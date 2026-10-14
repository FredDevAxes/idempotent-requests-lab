import "reflect-metadata";
import {
  Catch,
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Module,
  Param,
  Post,
  Req,
  Res,
  ServiceUnavailableException,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Pool } from "pg";
import type { Request, Response } from "express";
import { DemoControls } from "./demo";
import { InterventionService } from "./service";
export async function createApp(
  pool: Pool,
  demoEnabled = process.env.LOCAL_DEMO === "true" &&
    process.env.NODE_ENV !== "production",
) {
  const demo = new DemoControls(demoEnabled);
  const service = new InterventionService(pool, demo);
  @Controller()
  class LabController {
    @Get("health") async health() {
      try {
        await pool.query("SELECT 1");
        return { status: "ok", database: "connected" };
      } catch {
        throw new ServiceUnavailableException("Database unavailable");
      }
    }
    @Get("config") config() {
      return { demoEnabled };
    }
    @Get("interventions") list() {
      return service.list();
    }
    @Post("interventions") async create(
      @Req() req: Request,
      @Body() body: unknown,
      @Res() res: Response,
    ) {
      const labHeaders = Object.keys(req.headers).filter((key) =>
        key.startsWith("x-lab-"),
      );
      if (labHeaders.length && !demoEnabled)
        throw new ForbiddenException("Local fault controls disabled");
      if (
        labHeaders.some((key) => !["x-lab-fault", "x-lab-gate"].includes(key))
      )
        throw new BadRequestException("Unknown lab control");
      const fault = req.headers["x-lab-fault"];
      const gate = req.headers["x-lab-gate"];
      if (
        fault !== undefined &&
        !["drop-response", "fail-before-commit"].includes(String(fault))
      )
        throw new BadRequestException("Unknown fault");
      if (
        gate !== undefined &&
        (typeof gate !== "string" || !/^[a-f0-9-]{36}$/.test(gate))
      )
        throw new BadRequestException("Invalid gate");
      const result = await service.create(
        req.headers["idempotency-key"],
        body,
        {
          failure: fault === "fail-before-commit",
          gate: gate as string | undefined,
        },
      );
      if (fault === "drop-response") {
        res.socket?.destroy();
        return;
      }
      res.status(201).json(result);
    }
    @Post("demo/reset") reset(@Body() body: { confirm?: unknown } | undefined) {
      demo.requireEnabled();
      if (body?.confirm !== "DELETE LAB DATA")
        throw new BadRequestException("Explicit confirmation required");
      return service.reset();
    }
    @Post("demo/purge") purge() {
      return service.purge();
    }
    @Post("demo/clock") clock(
      @Body() body: { milliseconds?: unknown } | undefined,
    ) {
      return demo.advance(body?.milliseconds);
    }
    @Post("demo/gates") gate() {
      return demo.createGate();
    }
    @Get("demo/gates/:id") status(@Param("id") id: string) {
      return demo.status(id);
    }
    @Post("demo/gates/:id/release") release(@Param("id") id: string) {
      return demo.release(id);
    }
  }
  @Module({ controllers: [LabController] })
  class AppModule {}
  const app = await NestFactory.create(AppModule, { logger: false });
  @Catch(ServiceUnavailableException)
  class RetryableFilter {
    catch(
      exception: ServiceUnavailableException,
      host: import("@nestjs/common").ArgumentsHost,
    ) {
      const response = host.switchToHttp().getResponse<Response>();
      response.setHeader("Retry-After", "1");
      response.status(503).json({
        statusCode: 503,
        message: exception.message,
        error: "Service Unavailable",
      });
    }
  }
  app.useGlobalFilters(new RetryableFilter());
  app.use((req: Request, res: Response, next: () => void) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });
  // Nest's default exception handler preserves safe messages and validation statuses.
  return app;
}
