import "reflect-metadata";
import { Controller, Get, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Pool } from "pg";
export async function createApp(pool: Pool) {
  @Controller()
  class HealthController {
    @Get("health") async health() {
      await pool.query("SELECT 1");
      return { status: "ok", database: "connected" };
    }
  }
  @Module({ controllers: [HealthController] })
  class AppModule {}
  return NestFactory.create(AppModule, { logger: false });
}
