import { useState, type FormEvent } from "react";
import type { Scenario } from "@lab/contracts";
import type { Lab } from "./use-lab";
import { Icon } from "./icons";
export function TechnicalControls({ lab }: { lab: Lab }) {
  const [scenario, setScenario] = useState<Scenario>("normal");
  async function submit(event: FormEvent) {
    event.preventDefault();
    await lab.send(scenario);
  }
  return (
    <section
      role="tabpanel"
      id="technical-panel"
      aria-labelledby="technical-tab"
    >
      <div className="technical-intro">
        <h1>Technical controls</h1>
        <p>
          Inspect the current request, replay it manually, and verify the saved
          records. These are the same API calls used by the guided
          demonstration.
        </p>
      </div>
      <div className="technical-grid">
        <section className="manual-request">
          <h2>Send a request manually</h2>
          <p className="muted">
            After the first send, the content is frozen. “New request” creates a
            new key.
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
          <p role="status" className="technical-status">
            {lab.notice}
          </p>
        </section>
        <section className="request-evidence">
          <h2>Current request evidence</h2>
          <dl>
            <dt>Idempotency key</dt>
            <dd data-testid="intention-key">{lab.session.key}</dd>
            <dt>Saved request identifier</dt>
            <dd data-testid="business-id">
              {lab.session.businessId ?? "Not confirmed yet"}
            </dd>
            {lab.session.guide && (
              <>
                <dt>Guided experiment</dt>
                <dd>{lab.session.guide.lesson}</dd>
                <dt>Keys used in the experiment</dt>
                <dd>{lab.session.guide.keys.join(" / ")}</dd>
              </>
            )}
          </dl>
          <h3>HTTP attempts</h3>
          {lab.session.attempts.length ? (
            <ol className="timeline">
              {lab.session.attempts.map((attempt) => (
                <li key={attempt.number}>
                  <strong>
                    {attempt.number}.{" "}
                    {attempt.outcome === "accepted"
                      ? "201 Created"
                      : attempt.outcome === "conflict"
                        ? "409 Conflict"
                        : attempt.outcome === "retryable"
                          ? "503 Retry available"
                          : attempt.outcome === "unknown"
                            ? "No usable reply"
                            : "Request rejected"}
                  </strong>
                  <time dateTime={attempt.time}>
                    {new Date(attempt.time).toLocaleTimeString("en-GB")}
                  </time>
                  <p>{attempt.message}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">No HTTP attempts for this key yet.</p>
          )}
        </section>
      </div>
      <section className="fault-controls">
        <h2>Local fault controls</h2>
        {lab.demo ? (
          <>
            <p>
              These controls affect the next manual send. Response loss destroys
              the HTTP socket after a real commit.
            </p>
            <label htmlFor="scenario">Scenario for the next attempt</label>
            <select
              id="scenario"
              disabled={lab.busy}
              value={scenario}
              onChange={(event) => setScenario(event.target.value as Scenario)}
            >
              <option value="normal">Normal delivery</option>
              <option value="drop-response">
                Lose the response after commit
              </option>
              <option value="fail-before-commit">Fail before commit</option>
              <option value="parallel">Send 20 simultaneous attempts</option>
              <option value="conflict">
                Change content under the same key
              </option>
            </select>
            <div className="retention-controls">
              <div>
                <h3>Retention boundary</h3>
                <p>
                  The clock and purge are separate. Purge deletes eligible keys,
                  while the saved business requests remain.
                </p>
                <div className="actions">
                  <button
                    disabled={lab.busy}
                    onClick={() =>
                      void lab.control("clock", { milliseconds: 25 * 3600000 })
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
                      void lab.control("reset", { confirm: "DELETE LAB DATA" });
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
            <code>LOCAL_DEMO=true</code> to enable them. Production mode keeps
            them disabled.
          </p>
        )}
      </section>
      <section className="saved">
        <div className="section-heading">
          <div>
            <h2>All saved requests</h2>
            <p className="muted">
              Actual database records, including earlier experiments. Up to 100
              newest requests.
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
            No interventions saved yet. Send a request to create the first one.
          </p>
        )}
      </section>
    </section>
  );
}
