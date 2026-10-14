import { useEffect, useRef, useState } from "react";
import {
  interventionSchema,
  type Intervention,
  type Scenario,
  type Success,
} from "@lab/contracts";
import {
  freshSession,
  loadSession,
  saveSession,
  type Attempt,
  type Session,
  type GuideState,
  type LessonId,
} from "./session";
export type Exchange = {
  id: number;
  key: string;
  startedAt: number;
  settledAt?: number;
  count: number;
  outcome?: Attempt["outcome"];
};
export function useLab() {
  const [session, setSession] = useState(loadSession);
  const current = useRef(session);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const executing = useRef(false);
  const exchangeId = useRef(0);
  const [exchange, setExchange] = useState<Exchange>();
  const [demo, setDemo] = useState<boolean | null>(null);
  const [requests, setRequests] = useState<Intervention[]>([]);
  const [notice, setNotice] = useState(
    session.attempts.at(-1)?.message ??
      (session.locked
        ? "No result confirmed. Retry this intention with the same key."
        : "Ready to send."),
  );
  const [listError, setListError] = useState("");
  const [controlMessage, setControlMessage] = useState("");
  function store(next: Session) {
    saveSession(next);
    current.current = next;
    setSession(next);
  }
  async function refresh() {
    try {
      const response = await fetch("/api/interventions", {
        signal: AbortSignal.timeout(6000),
      });
      if (!response.ok) throw new Error();
      const body = await response.json();
      if (!Array.isArray(body.requests)) throw new Error();
      setRequests(body.requests);
      setListError("");
      return body.requests as Intervention[];
    } catch {
      setListError(
        "The server could not be checked. Refresh before drawing a conclusion.",
      );
      return null;
    }
  }
  useEffect(() => {
    void refresh();
    void fetch("/api/config", { signal: AbortSignal.timeout(6000) })
      .then((response) => response.json())
      .then((config) => setDemo(config.demoEnabled === true))
      .catch(() => {
        setDemo(false);
        setNotice("API unavailable. Start the API and reload this page.");
      });
  }, []);
  function update(field: keyof Session["draft"], value: string) {
    try {
      store({
        ...current.current,
        draft: { ...current.current.draft, [field]: value },
      });
    } catch {
      setNotice(
        "Browser storage is unavailable. Enable local storage before sending.",
      );
    }
  }
  function newIntention() {
    if (executing.current) return;
    try {
      store(freshSession(current.current.draft));
      setNotice(
        "New request ready. It has a new key, even when the content stays the same.",
      );
    } catch {
      setNotice("Browser storage is unavailable. No request sent.");
    }
  }
  async function send(
    scenario: Scenario = "normal",
    prepared?: Session,
    phase?: GuideState["phase"],
  ) {
    if (executing.current) return;
    const selected = prepared ?? current.current;
    const parsed = interventionSchema.safeParse(selected.draft);
    if (!parsed.success) {
      setNotice(
        "Enter a site of 2–80 characters and a description of 5–500 characters.",
      );
      return;
    }
    let active: Session;
    try {
      active = { ...selected, draft: parsed.data, locked: true };
      store(active);
    } catch {
      setNotice(
        "Browser storage is unavailable. No request sent; enable storage and retry.",
      );
      return;
    }
    executing.current = true;
    setBusy(true);
    const flight: Exchange = {
      id: ++exchangeId.current,
      key: active.key,
      startedAt: performance.now(),
      count: demo && scenario === "parallel" ? 20 : 1,
    };
    setExchange(flight);
    setSending(true);
    setNotice(
      "Sending. A missing reply does not tell us whether the request was saved.",
    );
    const outcomes: Attempt["outcome"][] = [];
    async function attempt(number: number) {
      let outcome: Attempt["outcome"];
      let message: string;
      let businessId = current.current.businessId;
      try {
        const input =
          scenario === "conflict"
            ? {
                ...active.draft,
                priority:
                  active.draft.priority === "routine" ? "urgent" : "routine",
              }
            : active.draft;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "Idempotency-Key": active.key,
        };
        if (
          demo &&
          (scenario === "drop-response" || scenario === "fail-before-commit")
        )
          headers["X-Lab-Fault"] = scenario;
        const response = await fetch("/api/interventions", {
          method: "POST",
          headers,
          body: JSON.stringify(input),
          signal: AbortSignal.timeout(6000),
        });
        const body = await response.json();
        if (response.status === 201) {
          outcome = "accepted";
          businessId = (body as Success).request.id;
          message = `Result known. Saved request ${businessId}.`;
        } else if (response.status === 409) {
          outcome = "conflict";
          message =
            "Content conflict. The original request is unchanged. Use a new key for different content.";
        } else if (response.status === 503) {
          outcome = "retryable";
          message =
            "Temporarily unavailable. Keep the key and retry the same request.";
        } else {
          outcome = "invalid";
          message = "Request rejected. Check the input and API configuration.";
        }
      } catch {
        outcome = "unknown";
        message =
          "Result unknown. The request may have been saved. Retry with the same key.";
      }
      outcomes.push(outcome);
      const record: Attempt = {
        number,
        time: new Date().toISOString(),
        outcome,
        message,
      };
      const next = {
        ...current.current,
        businessId,
        attempts: [...current.current.attempts, record]
          .sort((a, b) => a.number - b.number)
          .slice(-100),
      };
      try {
        store(next);
      } catch {
        current.current = next;
        setSession(next);
        message +=
          " Browser storage could not save this result; keep this page open.";
      }
      setNotice(message);
    }
    const first = (active.attempts.at(-1)?.number ?? 0) + 1;
    try {
      await Promise.all(
        Array.from(
          { length: demo && scenario === "parallel" ? 20 : 1 },
          (_, index) => attempt(first + index),
        ),
      );
      // Animate only observed POST outcomes, independently of GET evidence.
      setExchange({
        ...flight,
        settledAt: performance.now(),
        outcome:
          outcomes.find((outcome) => outcome !== "accepted") ?? "accepted",
      });
      setSending(false);
      const observed = await refresh();
      if (current.current.guide && phase) {
        const expected =
          scenario === "drop-response"
            ? outcomes.includes("unknown")
            : scenario === "fail-before-commit"
              ? outcomes.includes("retryable")
              : scenario === "conflict"
                ? outcomes.includes("conflict")
                : outcomes.every((outcome) => outcome === "accepted");
        const guide = {
          ...current.current.guide,
          phase: expected
            ? phase
            : active.guide?.phase === "ready"
              ? "ready"
              : "retry",
          firstRequestId:
            current.current.guide.firstRequestId ??
            observed?.find(
              (request) => request.site === current.current.guide?.runSite,
            )?.id ??
            current.current.businessId,
          firstServerCount:
            active.guide?.phase === "ready"
              ? (observed?.filter(
                  (request) => request.site === current.current.guide?.runSite,
                ).length ?? null)
              : current.current.guide.firstServerCount,
        };
        try {
          store({ ...current.current, guide });
        } catch {
          setNotice(
            "The result could not be saved in browser storage. Keep this page open and inspect the technical evidence.",
          );
        }
      }
    } finally {
      executing.current = false;
      setBusy(false);
      setSending(false);
    }
  }
  async function runGuide(lesson: LessonId) {
    if (executing.current || demo === null) return;
    let active = current.current;
    if (!active.guide || active.guide.lesson !== lesson) {
      const key = crypto.randomUUID();
      const draft = {
        site: `North workshop / demo ${key.slice(0, 8)}`,
        description: "Inspect the fictional water pump",
        priority: "routine" as const,
      };
      active = {
        ...freshSession(draft),
        key,
        guide: {
          lesson,
          runSite: draft.site,
          phase: "ready",
          priorSends: 0,
          firstRequestId: null,
          firstServerCount: null,
          keys: [key],
        },
      };
    }
    const guide = active.guide!;
    if (guide.phase === "done") return;
    if (guide.phase === "retry") {
      const retryScenario =
        lesson === "conflict" && active.businessId ? "conflict" : "normal";
      if (lesson === "new") {
        const next = freshSession(active.draft);
        active = {
          ...next,
          guide: {
            ...guide,
            priorSends: guide.priorSends + active.attempts.length,
            keys: [...guide.keys.slice(0, 1), next.key],
          },
        };
      }
      await send(retryScenario, active, "done");
    } else {
      const firstScenario: Scenario =
        lesson === "lost"
          ? "drop-response"
          : lesson === "rollback"
            ? "fail-before-commit"
            : lesson === "parallel"
              ? "parallel"
              : "normal";
      if (["lost", "parallel", "rollback"].includes(lesson) && !demo) {
        setNotice(
          "This exercise needs local demo mode. Normal sends are available in the first exercise.",
        );
        return;
      }
      await send(
        firstScenario,
        active,
        lesson === "parallel" ? "done" : "retry",
      );
    }
  }
  function restartGuide() {
    if (executing.current) return;
    try {
      store(freshSession());
      setNotice(
        "Ready for a new experiment. Saved server records have been kept.",
      );
    } catch {
      setNotice(
        "Browser storage is unavailable. The existing request has been preserved.",
      );
    }
  }
  async function control(path: string, body: object = {}) {
    if (executing.current) return;
    executing.current = true;
    setBusy(true);
    try {
      const response = await fetch(`/api/demo/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(6000),
      });
      if (!response.ok) throw new Error();
      const result = await response.json();
      setControlMessage(
        path === "purge"
          ? `${result.purged} retained keys purged. Saved requests remain.`
          : path === "clock"
            ? "Demo clock advanced by 25 hours. Keys remain until you purge."
            : "Lab data reset. A new request is ready.",
      );
      if (path === "reset") {
        store(freshSession());
        setNotice("Lab data reset. Ready to send.");
      }
      await refresh();
    } catch {
      setControlMessage(
        "Demo control failed. No successful change can be confirmed.",
      );
    } finally {
      executing.current = false;
      setBusy(false);
    }
  }
  return {
    session,
    exchange,
    sending,
    busy,
    demo,
    requests,
    notice,
    listError,
    controlMessage,
    refresh,
    update,
    newIntention,
    send,
    runGuide,
    restartGuide,
    control,
  };
}
export type Lab = ReturnType<typeof useLab>;
