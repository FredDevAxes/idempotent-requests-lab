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
export const lessonIds = [
  "repeat",
  "lost",
  "parallel",
  "rollback",
  "conflict",
  "new",
] as const;
export type LessonId = (typeof lessonIds)[number];
const guideSchema = z.object({
  lesson: z.enum(lessonIds),
  runSite: z.string(),
  phase: z.enum(["ready", "retry", "done"]),
  priorSends: z.number().int().nonnegative(),
  firstRequestId: z.string().nullable(),
  firstServerCount: z.number().int().nonnegative().nullable().default(null),
  keys: z.array(keySchema).max(2),
});
export type GuideState = z.infer<typeof guideSchema>;
const sessionSchema = z.object({
  key: keySchema,
  draft: draftSchema,
  locked: z.boolean(),
  attempts: z.array(attemptSchema).max(100),
  businessId: z.string().nullable(),
  guide: guideSchema.optional(),
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
