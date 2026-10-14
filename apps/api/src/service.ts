import {
  BadRequestException,
  ConflictException,
  HttpException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { interventionSchema, keySchema, type Success } from "@lab/contracts";
import { createHash, randomUUID } from "node:crypto";
import { Pool } from "pg";
import { DemoControls } from "./demo";
export type Fault = { failure?: boolean; gate?: string };
export class InterventionService {
  constructor(
    private readonly pool: Pool,
    readonly demo: DemoControls,
  ) {}
  private async transaction<T>(
    operation: (client: import("pg").PoolClient) => Promise<T>,
  ): Promise<T> {
    let client: import("pg").PoolClient | undefined;
    try {
      client = await this.pool.connect();
      await client.query("BEGIN");
      await client.query("SET LOCAL lock_timeout = '750ms'");
      await client.query("SET LOCAL statement_timeout = '3000ms'");
      const result = await operation(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      if (client) await client.query("ROLLBACK").catch(() => undefined);
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException(
        "Outcome uncertain or busy; retry with the same key and content",
      );
    } finally {
      client?.release();
    }
  }
  async create(
    rawKey: unknown,
    rawInput: unknown,
    fault: Fault = {},
  ): Promise<Success> {
    const parsedKey = keySchema.safeParse(rawKey);
    const parsedInput = interventionSchema.safeParse(rawInput);
    if (!parsedKey.success || !parsedInput.success)
      throw new BadRequestException(
        "Provide a UUID v4 key, site (2–80 characters), description (5–500) and valid priority",
      );
    if ((fault.failure || fault.gate) && !this.demo.enabled)
      throw new BadRequestException("Fault controls disabled");
    const key = parsedKey.data;
    const { site, description, priority } = parsedInput.data;
    const fingerprint = createHash("sha256")
      .update(JSON.stringify({ site, description, priority }))
      .digest("hex");
    return this.transaction(async (client) => {
      const claimed = await client.query(
        "INSERT INTO idempotency_keys (key, fingerprint) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING key",
        [key, fingerprint],
      );
      if (claimed.rowCount === 0) {
        const existing = await client.query(
          "SELECT fingerprint, response FROM idempotency_keys WHERE key = $1 FOR UPDATE",
          [key],
        );
        if (!existing.rows[0])
          throw new ServiceUnavailableException(
            "Key was purged concurrently; retry",
          );
        if (existing.rows[0].fingerprint !== fingerprint)
          throw new ConflictException(
            "This key already belongs to different content. Start a new intention to create another request.",
          );
        return existing.rows[0].response as Success;
      }
      const request = {
        id: randomUUID(),
        site,
        description,
        priority,
        createdAt: this.demo.now().toISOString(),
      };
      const result: Success = { request };
      await client.query(
        "INSERT INTO interventions (id, site, description, priority, created_at) VALUES ($1,$2,$3,$4,$5)",
        [request.id, site, description, priority, request.createdAt],
      );
      // Hooks run after both writes. Other connections must still see neither row.
      await client.query(
        "UPDATE idempotency_keys SET request_id=$2, status=201, response=$3, completed_at=$4 WHERE key=$1",
        [key, request.id, result, this.demo.now()],
      );
      if (fault.gate) await this.demo.pause(fault.gate);
      if (fault.failure)
        throw new ServiceUnavailableException(
          "Injected failure before commit; retry the same key",
        );
      // Completion time is set again after a gate so retention never starts too early.
      await client.query(
        "UPDATE idempotency_keys SET completed_at=$2 WHERE key=$1",
        [key, this.demo.now()],
      );
      return result;
    });
  }
  async list() {
    try {
      const result = await this.pool.query(
        'SELECT id, site, description, priority, created_at AS "createdAt" FROM interventions ORDER BY created_at DESC, id LIMIT 100',
      );
      return { requests: result.rows };
    } catch {
      throw new ServiceUnavailableException(
        "Database unavailable; refresh later",
      );
    }
  }
  async reset() {
    this.demo.requireEnabled();
    return this.transaction(async (client) => {
      await client.query("TRUNCATE idempotency_keys, interventions");
      return { reset: true };
    });
  }
  async purge() {
    this.demo.requireEnabled();
    return this.transaction(async (client) => {
      const result = await client.query(
        "DELETE FROM idempotency_keys WHERE completed_at <= $1::timestamptz - interval '24 hours'",
        [this.demo.now()],
      );
      return { purged: result.rowCount };
    });
  }
}
