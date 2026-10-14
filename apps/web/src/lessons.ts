import type { LessonId } from "./session";
export const lessons: {
  id: LessonId;
  label: string;
  title: string;
  setup: string;
  firstAction: string;
  retryAction: string;
  needsDemo: boolean;
}[] = [
  {
    id: "repeat",
    label: "Send twice",
    title: "One request. Two sends.",
    setup:
      "You ask someone to inspect a pump. Then you press Send again, just to be sure. Should that create another job?",
    firstAction: "Send the request",
    retryAction: "Send the same request again",
    needsDemo: false,
  },
  {
    id: "lost",
    label: "Lost reply",
    title: "Saved, but not confirmed.",
    setup:
      "The server saves your request, then the connection drops before the reply reaches you. You do not know whether it worked.",
    firstAction: "Send with a lost reply",
    retryAction: "Retry same request",
    needsDemo: true,
  },
  {
    id: "parallel",
    label: "Send together",
    title: "Twenty sends. One job.",
    setup:
      "Several attempts reach the server at the same time. A disabled button cannot protect every caller. The database has to decide.",
    firstAction: "Send 20 attempts together",
    retryAction: "Retry the same request",
    needsDemo: true,
  },
  {
    id: "rollback",
    label: "Fail before saving",
    title: "A failure should leave no half-finished job.",
    setup:
      "This time the server stops before saving is complete. Both the request and its saved result must be rolled back.",
    firstAction: "Try a send that fails",
    retryAction: "Retry without the failure",
    needsDemo: true,
  },
  {
    id: "conflict",
    label: "Change content",
    title: "Same reference, different request?",
    setup:
      "First, save a routine inspection. Then try to change it to urgent using the same reference. A retry must not silently change the original.",
    firstAction: "Save the routine request",
    retryAction: "Try changing it to urgent",
    needsDemo: false,
  },
  {
    id: "new",
    label: "Create another",
    title: "Another job needs another reference.",
    setup:
      "You really do want a second inspection. The content can stay the same, but this is a new request, not a retry.",
    firstAction: "Save the first request",
    retryAction: "Create a separate request",
    needsDemo: false,
  },
];
export function lessonFor(id: LessonId) {
  return lessons.find((lesson) => lesson.id === id)!;
}
