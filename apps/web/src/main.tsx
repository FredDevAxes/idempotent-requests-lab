import { useEffect, useRef, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
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
} from "./session";
import "./style.css";
function App() {
  const [session, setSession] = useState(loadSession);
  const current = useRef(session);
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(false);
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [requests, setRequests] = useState<Intervention[]>([]);
  const [notice, setNotice] = useState(
    session.attempts.at(-1)?.message ??
      (session.locked
        ? "No result confirmed. Retry this intention with the same key."
        : ""),
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
      const response = await fetch("/api/interventions");
      if (!response.ok) throw new Error();
      const body = await response.json();
      setRequests(body.requests);
      setListError("");
    } catch {
      setListError(
        "Saved requests could not be refreshed. Try Refresh saved requests.",
      );
    }
  }
  useEffect(() => {
    void refresh();
    void fetch("/api/config")
      .then((response) => response.json())
      .then((config) => setDemo(config.demoEnabled === true))
      .catch(() =>
        setNotice("API unavailable. Start the API and reload this page."),
      );
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
    try {
      store(freshSession(current.current.draft));
      setNotice(
        "New intention ready. It has a new key, even if the content stays the same.",
      );
    } catch {
      setNotice("Browser storage is unavailable. No request sent.");
    }
  }
  async function send(event?: FormEvent) {
    event?.preventDefault();
    if (busy) return;
    const parsed = interventionSchema.safeParse(current.current.draft);
    if (!parsed.success) {
      setNotice(
        "Enter a site of 2–80 characters and a description of 5–500 characters.",
      );
      return;
    }
    let active: Session;
    try {
      active = { ...current.current, draft: parsed.data, locked: true };
      store(active);
    } catch {
      setNotice(
        "Browser storage is unavailable. No request sent; enable storage and retry.",
      );
      return;
    }
    setBusy(true);
    setNotice("Sending. Keep this key if the result is unknown.");
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
            "Content conflict. This key already belongs to different content. Start a new intention for a different request.";
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
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  async function control(path: string, body: object = {}) {
    try {
      const response = await fetch(`/api/demo/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error();
      const result = await response.json();
      setControlMessage(
        path === "purge"
          ? `${result.purged} retained keys purged. Saved requests remain.`
          : path === "clock"
            ? "Demo clock advanced by 25 hours. Keys remain until you purge."
            : "Lab data reset. A new intention is ready.",
      );
      if (path === "reset") newIntention();
      await refresh();
    } catch {
      setControlMessage(
        "Demo control failed. No successful change can be confirmed.",
      );
    }
  }
  const latest = session.attempts.at(-1);
  return (
    <>
      <a
        className="skip"
        href="#request-form"
        onClick={(event) => {
          event.preventDefault();
          const target = document.getElementById(
            current.current.locked ? "send-button" : "site",
          );
          target?.focus();
          target?.scrollIntoView({ block: "center" });
        }}
      >
        Skip to request form
      </a>
      <header>
        <a
          className="brand"
          href="https://github.com/FredDevAxes/idempotent-requests-lab"
        >
          DevAxes / reliability lab
        </a>
        <span>Fictional data • local experiment</span>
      </header>
      <main>
        <section className="intro">
          <h1>
            One request.
            <br />
            Many attempts.
          </h1>
          <p>
            A connection can fail after a request is saved. Send a fictional
            intervention, then retry the same intention and watch what actually
            reaches the database.
          </p>
        </section>
        <div className="workspace">
          <section className="form-section" aria-labelledby="form-title">
            <h2 id="form-title">Request an intervention</h2>
            <p className="hint">
              The first send freezes the content. Use a new intention to make a
              different request.
            </p>
            <form id="request-form" onSubmit={send}>
              <label htmlFor="site">Site</label>
              <input
                id="site"
                name="site"
                value={session.draft.site}
                disabled={session.locked || busy}
                maxLength={80}
                minLength={2}
                required
                onChange={(event) => update("site", event.target.value)}
              />
              <label htmlFor="description">What needs attention?</label>
              <textarea
                id="description"
                name="description"
                value={session.draft.description}
                disabled={session.locked || busy}
                maxLength={500}
                minLength={5}
                required
                rows={3}
                onChange={(event) => update("description", event.target.value)}
              />
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={session.draft.priority}
                disabled={session.locked || busy}
                onChange={(event) => update("priority", event.target.value)}
              >
                <option value="routine">Routine inspection</option>
                <option value="urgent">Urgent intervention</option>
              </select>
              <div className="actions">
                <button
                  id="send-button"
                  className="primary"
                  type="submit"
                  disabled={busy}
                >
                  {busy
                    ? "Sending…"
                    : session.locked
                      ? "Retry same request"
                      : "Send request"}
                </button>
                <button type="button" onClick={newIntention} disabled={busy}>
                  New intention
                </button>
              </div>
            </form>
            <p className="notice" role="status" aria-live="polite">
              {notice || "Ready. No request has been sent in this intention."}
            </p>
          </section>
          <section className="ledger" aria-labelledby="ledger-title">
            <div className="section-heading">
              <h2 id="ledger-title">Attempt ledger</h2>
              <span className={`state ${latest?.outcome ?? "ready"}`}>
                {latest?.outcome === "unknown"
                  ? "Result unknown"
                  : session.businessId
                    ? "Result known"
                    : session.locked
                      ? "Result unconfirmed"
                      : "Ready to send"}
              </span>
            </div>
            <dl>
              <dt>Intention key</dt>
              <dd data-testid="intention-key">{session.key}</dd>
              <dt>Saved request identifier</dt>
              <dd data-testid="business-id">
                {session.businessId ?? "Not confirmed yet"}
              </dd>
            </dl>
            {session.attempts.length ? (
              <ol className="timeline">
                {session.attempts.map((attempt) => (
                  <li key={attempt.number}>
                    <span className="attempt-number">{attempt.number}</span>
                    <div>
                      <strong>
                        {attempt.outcome === "accepted"
                          ? "Success / 201"
                          : attempt.outcome === "unknown"
                            ? "No response received"
                            : attempt.outcome === "conflict"
                              ? "Conflict / 409"
                              : attempt.outcome === "retryable"
                                ? "Retry available / 503"
                                : "Validation error"}
                      </strong>
                      <time dateTime={attempt.time}>
                        {new Date(attempt.time).toLocaleTimeString("en-GB")}
                      </time>
                      <p>{attempt.message}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="empty">
                Each actual send will appear here. Repeated attempts keep the
                same key.
              </p>
            )}
            <p className="hint">
              The browser stores the key and content before sending, so you can
              reload and retry.
            </p>
          </section>
        </div>
        <section className="saved" aria-labelledby="saved-title">
          <div className="section-heading">
            <div>
              <h2 id="saved-title">Saved requests</h2>
              <p>Live database records. Up to 100 newest requests shown.</p>
            </div>
            <button onClick={() => void refresh()}>
              Refresh saved requests
            </button>
          </div>
          <p role="status" className="error">
            {listError}
          </p>
          <ul className="records" data-testid="saved-requests">
            {requests.map((request) => (
              <li key={request.id}>
                <div>
                  <strong>{request.site}</strong>
                  <span>
                    {request.priority === "urgent" ? "Urgent" : "Routine"}
                  </span>
                </div>
                <p>{request.description}</p>
                <code>{request.id}</code>
              </li>
            ))}
          </ul>
          {!requests.length && !listError && (
            <p className="empty">
              No interventions saved yet. Send the form to create the first one.
            </p>
          )}
        </section>
        <section className="demo" aria-labelledby="demo-title">
          <h2 id="demo-title">Technical demonstration</h2>
          {demo ? (
            <details>
              <summary>Open local scenario controls</summary>
              <div className="demo-content">
                <label htmlFor="scenario">Scenario for the next attempt</label>
                <select
                  id="scenario"
                  value={scenario}
                  disabled={busy}
                  onChange={(event) =>
                    setScenario(event.target.value as Scenario)
                  }
                >
                  <option value="normal">Normal delivery</option>
                  <option value="drop-response">
                    Lose the response after commit
                  </option>
                  <option value="fail-before-commit">Fail before commit</option>
                  <option value="parallel">
                    Send 20 simultaneous attempts
                  </option>
                  <option value="conflict">
                    Change content under the same key
                  </option>
                </select>
                <p className="hint">
                  For a conflict, first send normally. For recovery, switch back
                  to Normal delivery and retry. Response loss closes the API
                  socket after a real commit.
                </p>
                <div className="actions">
                  <button
                    disabled={busy}
                    onClick={() =>
                      void control("clock", { milliseconds: 25 * 3600000 })
                    }
                  >
                    Advance clock by 25 hours
                  </button>
                  <button disabled={busy} onClick={() => void control("purge")}>
                    Purge eligible keys
                  </button>
                  <button
                    className="danger"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Delete all data in this isolated lab schema?",
                        )
                      )
                        void control("reset", { confirm: "DELETE LAB DATA" });
                    }}
                  >
                    Reset lab data
                  </button>
                </div>
                <p role="status">{controlMessage}</p>
              </div>
            </details>
          ) : (
            <p>
              Controls are disabled. To explore faults locally, restart with{" "}
              <code>LOCAL_DEMO=true</code>.
            </p>
          )}
        </section>
        <footer>
          One key protects one intention while retained. A purged key can create
          again. This experiment has no external side effects.
        </footer>
      </main>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
