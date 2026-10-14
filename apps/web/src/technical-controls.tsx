import { useState, type FormEvent } from "react";
import type { Scenario } from "@lab/contracts";
import type { Lab } from "./use-lab";
import type { LessonId } from "./session";
import { lessonFor } from "./lessons";
import { Icon } from "./icons";
function CopyValue({
  label,
  value,
  testId,
}: {
  label: string;
  value: string | null;
  testId: string;
}) {
  const [message, setMessage] = useState("");
  return (
    <div className="identifier">
      <dt>{label}</dt>
      <dd>
        <code data-testid={testId}>{value ?? "Not confirmed yet"}</code>
        {value && (
          <button
            aria-label={`Copy ${label.toLowerCase()}`}
            onClick={() => {
              void navigator.clipboard
                .writeText(value)
                .then(() => setMessage(`${label} copied.`))
                .catch(() =>
                  setMessage(
                    "Copy unavailable. Select the identifier to copy it.",
                  ),
                );
            }}
          >
            <Icon name="copy" />
          </button>
        )}
      </dd>
      <span role="status" className="copy-message">
        {message}
      </span>
    </div>
  );
}
export function TechnicalControls({
  lab,
  lessonId,
}: {
  lab: Lab;
  lessonId: LessonId;
}) {
  const [scenario, setScenario] = useState<Scenario>("normal");
  const matching = !lab.session.guide || lab.session.guide.lesson === lessonId;
  const records = matching
    ? lab.requests.filter((request) =>
        lab.session.guide
          ? request.site === lab.session.guide.runSite
          : request.id === lab.session.businessId ||
            request.site === lab.session.draft.site,
      )
    : [];
  async function submit(event: FormEvent) {
    event.preventDefault();
    await lab.send(scenario);
  }
  return (
    <div className="technical-content">
      {!matching ? (
        <div className="other-scenario">
          <p>No attempts in this scenario yet.</p>
          <p className="muted">
            Your request in “{lessonFor(lab.session.guide!.lesson).label}” is
            preserved. Select that scenario in the navigation to resume it, or
            use the main action above to start this one.
          </p>
        </div>
      ) : (
        <div className="technical-grid">
          <section className="http-evidence">
            <h2>HTTP activity</h2>
            {lab.session.attempts.length ? (
              <ol
                className="timeline"
                tabIndex={0}
                aria-label="HTTP attempt history"
              >
                {lab.session.attempts.map((attempt) => (
                  <li key={attempt.number}>
                    <div className="attempt-row">
                      <time dateTime={attempt.time}>
                        {new Date(attempt.time).toLocaleTimeString("en-GB")}
                      </time>
                      <code>POST /interventions</code>
                      <strong className={`http-outcome ${attempt.outcome}`}>
                        {attempt.outcome === "accepted"
                          ? "201 Created"
                          : attempt.outcome === "conflict"
                            ? "409 Conflict"
                            : attempt.outcome === "retryable"
                              ? "503 Retry available"
                              : attempt.outcome === "unknown"
                                ? "No response"
                                : "Request rejected"}
                      </strong>
                    </div>
                    <p>
                      {attempt.outcome === "unknown"
                        ? "Response body unavailable. The outcome is unknown to the client."
                        : attempt.message}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="empty-evidence">
                No HTTP attempts for this key yet.
              </p>
            )}
            <div className="section-heading">
              <h2>Saved record{records.length === 1 ? "" : "s"}</h2>
              <span>
                {lab.listError ? "Unavailable" : `${records.length} found`}
              </span>
            </div>
            {lab.listError ? (
              <p className="inline-warning">{lab.listError}</p>
            ) : records.length ? (
              <ul className="scoped-records">
                {records.map((record) => (
                  <li key={record.id}>
                    <dl>
                      <dt>id</dt>
                      <dd>{record.id}</dd>
                      <dt>createdAt</dt>
                      <dd>{record.createdAt}</dd>
                      <dt>priority</dt>
                      <dd>{record.priority}</dd>
                    </dl>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-evidence">
                No saved record observed for this request.
              </p>
            )}
            <p className="evidence-caption">
              Records from GET /interventions. Separate from the POST reply.
            </p>
          </section>
          <section className="request-tools">
            <h2>Request & tools</h2>
            <dl className="identifiers">
              <CopyValue
                label="Idempotency key"
                value={lab.session.key}
                testId="intention-key"
              />
              <CopyValue
                label="Saved request"
                value={lab.session.businessId}
                testId="business-id"
              />
            </dl>
            {lab.session.guide && (
              <p className="muted">
                Next attempt follows this scenario. Use the main action above.
              </p>
            )}
            <button
              className="refresh-records"
              disabled={lab.busy}
              onClick={() => void lab.refresh()}
            >
              <Icon name="retry" />
              Refresh records
            </button>
            <details className="request-payload">
              <summary>Request content</summary>
              <pre>{JSON.stringify(lab.session.draft, null, 2)}</pre>
              {lab.session.guide && (
                <p>Keys used: {lab.session.guide.keys.join(" / ")}</p>
              )}
            </details>
          </section>
        </div>
      )}
      <details className="advanced-tools">
        <summary>
          <Icon name="chevron" />
          Advanced tools
        </summary>
        <p className="muted">
          Manual controls use the current browser request
          {!matching
            ? ` from “${lessonFor(lab.session.guide!.lesson).label}”`
            : ""}
          . They can change the guided result. Starting a new request keeps
          existing server records.
        </p>
        <div className="advanced-grid">
          <section className="manual-request">
            <h2>Send a request manually</h2>
            <p className="muted">
              After the first send, the content is frozen. “New request” creates
              a new key.
            </p>
            <form id="request-form" onSubmit={submit}>
              <label htmlFor="site">Site</label>
              <input
                id="site"
                value={lab.session.draft.site}
                disabled={lab.session.locked || lab.busy}
                required
                minLength={2}
                maxLength={80}
                onChange={(event) => lab.update("site", event.target.value)}
              />
              <label htmlFor="description">What needs attention?</label>
              <textarea
                id="description"
                rows={3}
                value={lab.session.draft.description}
                required
                minLength={5}
                maxLength={500}
                disabled={lab.session.locked || lab.busy}
                onChange={(event) =>
                  lab.update("description", event.target.value)
                }
              />
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={lab.session.draft.priority}
                disabled={lab.session.locked || lab.busy}
                onChange={(event) => lab.update("priority", event.target.value)}
              >
                <option value="routine">Routine inspection</option>
                <option value="urgent">Urgent intervention</option>
              </select>
              <div className="actions">
                <button
                  id="send-button"
                  className="primary"
                  disabled={lab.busy}
                  type="submit"
                >
                  {lab.busy
                    ? "Sending…"
                    : lab.session.locked
                      ? "Retry same request"
                      : "Send request"}
                </button>
                <button
                  type="button"
                  disabled={lab.busy}
                  onClick={lab.newIntention}
                >
                  New request
                </button>
              </div>
            </form>
            <p
              role="status"
              className="technical-status"
              data-testid="technical-status"
            >
              {lab.notice}
            </p>
          </section>
          <section className="fault-controls">
            <h2>Local fault controls</h2>
            {lab.demo ? (
              <>
                <p>
                  These controls affect the next manual send. Response loss
                  destroys the HTTP socket after a real commit.
                </p>
                <label htmlFor="scenario">Scenario for the next attempt</label>
                <select
                  id="scenario"
                  disabled={lab.busy}
                  value={scenario}
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
                <div className="retention-controls">
                  <div>
                    <h3>Retention boundary</h3>
                    <p>
                      The clock and purge are separate. Purge deletes eligible
                      keys, while the saved business requests remain.
                    </p>
                    <div className="actions">
                      <button
                        disabled={lab.busy}
                        onClick={() =>
                          void lab.control("clock", {
                            milliseconds: 25 * 3600000,
                          })
                        }
                      >
                        Advance clock by 25 hours
                      </button>
                      <button
                        disabled={lab.busy}
                        onClick={() => void lab.control("purge")}
                      >
                        Purge eligible keys
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3>Reset this lab</h3>
                    <p>
                      Deletes all rows in this isolated lab schema. Your browser
                      starts a new request. The demo clock is kept.
                    </p>
                    <button
                      className="danger"
                      disabled={lab.busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            "Delete all data in this isolated lab schema?",
                          )
                        )
                          void lab.control("reset", {
                            confirm: "DELETE LAB DATA",
                          });
                      }}
                    >
                      Reset lab data
                    </button>
                  </div>
                </div>
                <p role="status" data-testid="control-status">
                  {lab.controlMessage}
                </p>
              </>
            ) : (
              <p>
                Fault controls are disabled. Start the local demo with{" "}
                <code>LOCAL_DEMO=true</code> to enable them. Production mode
                keeps them disabled.
              </p>
            )}
          </section>
        </div>{" "}
        <section className="saved">
          <div className="section-heading">
            <div>
              <h2>All saved requests</h2>
              <p className="muted">
                Actual database records, including earlier experiments. Up to
                100 newest requests.
              </p>
            </div>
            <button onClick={() => void lab.refresh()} disabled={lab.busy}>
              <Icon name="retry" />
              Refresh saved requests
            </button>
          </div>
          <p role="status" className="inline-warning">
            {lab.listError}
          </p>
          <ul className="records" data-testid="saved-requests">
            {lab.requests.map((request) => (
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
          {!lab.requests.length && !lab.listError && (
            <p className="muted">
              No interventions saved yet. Send a request to create the first
              one.
            </p>
          )}
        </section>
      </details>
    </div>
  );
}
