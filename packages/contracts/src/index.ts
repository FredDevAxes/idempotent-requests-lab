import { z } from "zod";
const text = (min: number, max: number) =>
  z
    .string()
    .max(max * 4)
    .transform((value) => value.normalize("NFC").trim().replace(/\s+/gu, " "))
    .pipe(z.string().min(min).max(max));
export const interventionSchema = z
  .object({
    site: text(2, 80),
    description: text(5, 500),
    priority: z.enum(["routine", "urgent"]),
  })
  .strict();
export const keySchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  )
  .transform((value) => value.toLowerCase());
export type InterventionInput = z.output<typeof interventionSchema>;
export type Intervention = InterventionInput & {
  id: string;
  createdAt: string;
};
export type Success = { request: Intervention };
export type Scenario =
  "normal" | "drop-response" | "fail-before-commit" | "parallel" | "conflict";
