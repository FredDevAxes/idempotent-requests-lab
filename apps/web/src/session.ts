import { z } from "zod";
import { keySchema } from "@lab/contracts";
export const storageKey = "intervention-lab.intent.v1";
const draftSchema = z.object({
  site: z.string(),
  description: z.string(),
  priority: z.enum(["routine", "urgent"]),
});
const attemptSchema = z.object({
  number: z.number(),
  time: z.string(),
  outcome: z.enum(["accepted", "unknown", "retryable", "conflict", "invalid"]),
  message: z.string(),
});
const sessionSchema = z.object({
  key: keySchema,
  draft: draftSchema,
  locked: z.boolean(),
  attempts: z.array(attemptSchema).max(100),
  businessId: z.string().nullable(),
});
export type Session = z.infer<typeof sessionSchema>;
export type Attempt = z.infer<typeof attemptSchema>;
export function freshSession(
  draft: Session["draft"] = {
    site: "North workshop",
    description: "Inspect the fictional water pump",
    priority: "routine",
  },
): Session {
  return {
    key: crypto.randomUUID(),
    draft,
    locked: false,
    attempts: [],
    businessId: null,
  };
}
export function loadSession(): Session {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = sessionSchema.safeParse(JSON.parse(saved));
      if (parsed.success) return parsed.data;
    }
  } catch {
    /* Sending checks storage separately and explains the failure. */
  }
  return freshSession();
}
export function saveSession(session: Session) {
  localStorage.setItem(storageKey, JSON.stringify(session));
}
