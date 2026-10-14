import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
type Gate = { reached: boolean; release: () => void; wait: Promise<void> };
export class DemoControls {
  private offset = 0;
  private gates = new Map<string, Gate>();
  constructor(readonly enabled: boolean) {}
  requireEnabled() {
    if (!this.enabled) throw new NotFoundException();
  }
  now() {
    return new Date(Date.now() + this.offset);
  }
  advance(milliseconds: unknown) {
    this.requireEnabled();
    if (
      typeof milliseconds !== "number" ||
      !Number.isSafeInteger(milliseconds) ||
      milliseconds < 0 ||
      milliseconds > 7 * 86400000
    )
      throw new BadRequestException(
        "Advance must be between zero and seven days",
      );
    this.offset += milliseconds;
    return { now: this.now().toISOString() };
  }
  createGate() {
    this.requireEnabled();
    if (this.gates.size >= 8)
      throw new BadRequestException("Release existing gates first");
    const id = randomUUID();
    let release!: () => void;
    const wait = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.gates.set(id, { reached: false, release, wait });
    return { id };
  }
  status(id: string) {
    this.requireEnabled();
    const gate = this.gates.get(id);
    if (!gate) throw new NotFoundException();
    return { reached: gate.reached };
  }
  release(id: string) {
    this.requireEnabled();
    const gate = this.gates.get(id);
    if (!gate) throw new NotFoundException();
    gate.release();
    this.gates.delete(id);
    return { released: true };
  }
  async pause(id: string) {
    this.requireEnabled();
    const gate = this.gates.get(id);
    if (!gate) throw new BadRequestException("Unknown gate");
    gate.reached = true;
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        gate.wait,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new ServiceUnavailableException(
                  "Demo gate expired; retry the same key",
                ),
              ),
            10000,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
      this.gates.delete(id);
    }
  }
}
