import { useEffect, useRef } from "react";
import { lessons, lessonFor } from "./lessons";
import { Icon } from "./icons";
import type { Lab } from "./use-lab";
import type { LessonId } from "./session";
export function GuidedDemo({
  lab,
  lessonId,
  setLesson,
  inspect,
}: {
  lab: Lab;
  lessonId: LessonId;
  setLesson: (id: LessonId) => void;
  inspect: () => void;
}) {
  const lesson = lessonFor(lessonId);
  const active =
    lab.session.guide?.lesson === lessonId ? lab.session.guide : undefined;
  const phase = active?.phase ?? "ready";
  const previousPhase = useRef(phase);
  useEffect(() => {
    if (!lab.busy && previousPhase.current !== phase) {
      document.getElementById("guide-action")?.focus();
      previousPhase.current = phase;
    }
  }, [phase, lab.busy]);
  const latest = active ? lab.session.attempts.at(-1) : undefined;
  const records = active
    ? lab.requests.filter((request) => request.site === active.runSite)
    : [];
  const sends = active ? active.priorSends + lab.session.attempts.length : 0;
  const confirmed = lab.session.businessId;
  const unavailable = Boolean(lab.listError);
  const cannotRun =
    lab.busy || lab.demo === null || (lesson.needsDemo && !lab.demo);
  const expectedCount = lessonId === "new" ? 2 : 1;
  const history = lab.session.attempts.map((attempt) => attempt.outcome);
  const verifiedLesson =
    active &&
    (lessonId === "lost"
      ? active.firstServerCount === 1 &&
        history.includes("unknown") &&
        confirmed === active.firstRequestId
      : lessonId === "rollback"
        ? active.firstServerCount === 0 && history.includes("retryable")
        : lessonId === "conflict"
          ? latest?.outcome === "conflict"
          : lessonId === "new"
            ? active.keys.length === 2 && active.firstRequestId !== confirmed
            : lessonId === "parallel"
              ? history.length === 20 &&
                history.every((outcome) => outcome === "accepted")
              : confirmed === active.firstRequestId);
  const resultMatches =
    phase === "done" &&
    !unavailable &&
    records.length === expectedCount &&
    Boolean(verifiedLesson);
  const outcome = latest?.outcome;
  const clientTitle = lab.busy
    ? "Waiting for a reply"
    : !active
      ? "Ready to send"
      : outcome === "unknown"
        ? "No confirmation received"
        : outcome === "conflict"
          ? "Different content refused"
          : outcome === "retryable"
            ? "This attempt could not finish"
            : outcome === "accepted"
              ? "Confirmation received"
              : "No result confirmed";
  const clientDetail = lab.busy
    ? "The request is in flight. Its final outcome is not known yet."
    : !active
      ? "This is what a person using the app knows."
      : outcome === "unknown"
        ? "You cannot tell from this screen whether the request was saved."
        : outcome === "conflict"
          ? "The new content was rejected. The original saved request stays the same."
          : outcome === "retryable"
            ? "Keep the same request reference and try again."
            : outcome === "accepted"
              ? "The server returned the saved request."
              : "Keep the request reference to resolve its outcome.";
  const sceneText =
    phase === "ready"
      ? lesson.setup
      : phase === "retry"
        ? lessonId === "lost"
          ? "The reply is missing. Check what the server saved, then retry the same request to resolve its outcome."
          : lessonId === "rollback"
            ? "Try again without the injected failure, keeping the same reference. Compare the refreshed server records before and after."
            : lessonId === "conflict"
              ? "The routine inspection is saved. Now change the priority, while keeping the same request reference."
              : lessonId === "new"
                ? "The first job is saved. Create a second job with a new reference, even though the content is identical."
                : "Your request is saved. Send it again with the same reference and compare the result."
        : resultMatches
          ? lessonId === "new"
            ? "Two different references created two separate jobs. The server cannot infer whether identical content means the same intention."
            : lessonId === "conflict"
              ? "A reference belongs to one request. Different content was refused, so the saved job was not silently changed."
              : lessonId === "parallel"
                ? "Twenty real attempts reached the API. The database accepted one request and replayed its result to the others."
                : lessonId === "rollback"
                  ? "The failed transaction left no partial request. A retry with the same reference could then create the job."
                  : lessonId === "lost"
                    ? "The missing reply did not mean failure. Retrying recovered the already-saved request instead of creating another."
                    : "Sending again returned the same saved request. This is idempotency: repeating one operation preserves its result."
          : "The observations differ from this exercise’s expected result. Refresh the server or inspect the evidence before continuing.";
  const nextIndex = lessons.findIndex((item) => item.id === lessonId) + 1;
  function choose(id: LessonId) {
    if (lab.busy) return;
    setLesson(id);
  }
  return (
    <section role="tabpanel" id="guided-panel" aria-labelledby="guided-tab">
      <div className="demo-intro">
        <div>
          <h1>Try again. Keep one request.</h1>
          <p>
            Repeat a send without accidentally creating another job. Follow the
            request on your screen and on the server.
          </p>
        </div>
        <p className="intro-note">
          Fictional maintenance requests.
          <br />
          Real sends and saved results.
        </p>
      </div>
      <nav className="lesson-nav" aria-label="Guided experiments">
        {lessons.map((item, index) => (
          <button
            key={item.id}
            type="button"
            disabled={lab.busy}
            aria-current={item.id === lessonId ? "step" : undefined}
            onClick={() => choose(item.id)}
          >
            <span className="lesson-index">{index + 1}</span>
            <span>{item.label}</span>
            {active?.phase === "done" && item.id === lessonId && (
              <Icon name="check" />
            )}
          </button>
        ))}
      </nav>
      <div className="teaching-workspace">
        <section className="scene" aria-labelledby="scene-title">
          <h2 id="scene-title">{lesson.title}</h2>
          <p className="scene-story">{sceneText}</p>
          {phase !== "done" ? (
            <>
              <button
                id="guide-action"
                className="primary guide-action"
                disabled={cannotRun}
                onClick={() => void lab.runGuide(lessonId)}
              >
                <span>
                  {lab.busy
                    ? "Sending…"
                    : phase === "retry"
                      ? lesson.retryAction
                      : lesson.firstAction}
                </span>
                <Icon name={phase === "retry" ? "retry" : "arrow"} />
              </button>
              {lesson.needsDemo && lab.demo === false && (
                <p className="inline-warning">
                  This exercise needs local demo mode. Use “Send twice” for a
                  normal request, or enable local demo mode.
                </p>
              )}
              <p className="action-note">
                {phase === "ready"
                  ? "Starts a new experiment. Earlier saved requests are kept."
                  : lessonId === "new"
                    ? "Creates a new reference for a second job."
                    : "Uses the same request reference."}
              </p>
            </>
          ) : (
            <>
              <div
                className={`takeaway ${resultMatches ? "confirmed" : "attention"}`}
              >
                <Icon name={resultMatches ? "check" : "warning"} />
                <p>
                  {resultMatches
                    ? `${sends} sends, ${records.length} saved ${records.length === 1 ? "request" : "requests"}.`
                    : unavailable
                      ? "Server evidence is unavailable."
                      : "Check the server observations."}
                </p>
              </div>
              {!resultMatches ? (
                <button
                  id="guide-action"
                  className="primary guide-action"
                  disabled={lab.busy}
                  onClick={() => void lab.refresh()}
                >
                  Refresh server results
                  <Icon name="retry" />
                </button>
              ) : nextIndex < lessons.length ? (
                <button
                  id="guide-action"
                  className="primary guide-action"
                  disabled={lab.busy}
                  onClick={() => choose(lessons[nextIndex].id)}
                >
                  Next experiment
                  <Icon name="arrow" />
                </button>
              ) : (
                <button
                  id="guide-action"
                  className="primary guide-action"
                  disabled={lab.busy}
                  onClick={() => {
                    choose("repeat");
                    lab.restartGuide();
                  }}
                >
                  Start a fresh walkthrough
                  <Icon name="retry" />
                </button>
              )}
              <button
                className="text-button"
                disabled={lab.busy}
                onClick={lab.restartGuide}
              >
                Repeat this experiment
              </button>
            </>
          )}
          <p role="status" className="guide-status">
            {lab.notice.includes("storage") ||
            lab.notice.includes("API unavailable")
              ? lab.notice
              : lab.busy
                ? "Sending real requests to the API."
                : phase === "ready"
                  ? "Ready. No send has been made in this experiment."
                  : outcome === "unknown"
                    ? "The reply is missing. Check the server before retrying."
                    : phase === "done" && resultMatches
                      ? "The result has been checked against the saved server records."
                      : "Compare the two observations, then take the next action."}
          </p>
          {!active && lab.session.locked && (
            <p className="preserved-note">
              Your earlier request is preserved in{" "}
              <button className="text-button" onClick={inspect}>
                Technical controls
              </button>
              . Starting an experiment creates a new reference.
            </p>
          )}
        </section>
        <section className="observation-stage" aria-label="Live observations">
          <div className="stage-heading">
            <h2>Follow this request</h2>
            <span className={`live-label ${unavailable ? "attention" : ""}`}>
              {lab.busy
                ? "Updating…"
                : unavailable
                  ? "Server unavailable"
                  : "Live API results"}
            </span>
          </div>
          <div className="observations">
            <section
              className={`observation client ${outcome === "unknown" ? "uncertain" : ""}`}
              aria-labelledby="client-title"
            >
              <div className="observation-label">
                <Icon name="screen" />
                <h3 id="client-title">What you see</h3>
              </div>
              <div
                className="observation-body"
                data-testid="client-observation"
              >
                <div className={`result-symbol ${outcome ?? "ready"}`}>
                  <Icon
                    name={
                      outcome === "accepted"
                        ? "check"
                        : outcome === "unknown" || outcome === "conflict"
                          ? "warning"
                          : "document"
                    }
                  />
                </div>
                <h4>{clientTitle}</h4>
                <p>{clientDetail}</p>
                {active && (
                  <p className="observed-count">
                    {sends} {sends === 1 ? "send" : "sends"} in this experiment
                  </p>
                )}
              </div>
            </section>
            <section
              className="observation server"
              aria-labelledby="server-title"
            >
              <div className="observation-label">
                <Icon name="server" />
                <h3 id="server-title">What the server saved</h3>
              </div>
              <div
                className="observation-body"
                data-testid="server-observation"
              >
                {unavailable ? (
                  <>
                    <div className="result-symbol unknown">
                      <Icon name="warning" />
                    </div>
                    <h4>Could not check the server</h4>
                    <p>
                      Do not assume that nothing was saved. Refresh or inspect
                      the technical evidence.
                    </p>
                  </>
                ) : !active ? (
                  <>
                    <div className="result-symbol ready">
                      <Icon name="document" />
                    </div>
                    <h4>No experiment started</h4>
                    <p>The server result will appear after your first send.</p>
                  </>
                ) : (
                  <>
                    <div
                      className={`result-symbol ${records.length ? "accepted" : "ready"}`}
                    >
                      <Icon name={records.length ? "check" : "document"} />
                    </div>
                    <h4>
                      {records.length === 0
                        ? "No saved request observed"
                        : records.length === 1
                          ? "One request saved"
                          : `${records.length} requests saved`}
                    </h4>
                    <p>
                      Refreshed from the server. Only this experiment is shown.
                    </p>
                    <ul className="experiment-records">
                      {records.map((request, index) => (
                        <li key={request.id}>
                          <Icon name="document" />
                          <div>
                            <strong>
                              Inspection request
                              {records.length > 1 ? ` ${index + 1}` : ""}
                            </strong>
                            <span>
                              {request.priority === "urgent"
                                ? "Urgent"
                                : "Routine"}{" "}
                              · North workshop
                            </span>
                            <span className="short-reference">
                              Reference {request.id.slice(0, 8)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </section>
          </div>
          <div className="stage-footer">
            <p>
              {active && outcome === "conflict"
                ? "Changed content was refused. The original job stays saved."
                : resultMatches && lessonId === "rollback"
                  ? "The retry saved the job after the failed attempt rolled back."
                  : resultMatches && lessonId === "new"
                    ? "New reference, new job. Both requests are saved."
                    : resultMatches && lessonId === "parallel"
                      ? "All twenty attempts shared one request reference."
                      : resultMatches && outcome === "accepted"
                        ? "The same saved request was returned."
                        : active && outcome === "unknown"
                          ? records.length > 0 && !unavailable
                            ? "A missing reply and a saved request can both be true."
                            : "A missing reply leaves the result uncertain. Keep the reference."
                          : "One reference follows one request across attempts."}
            </p>
            <button className="text-button" onClick={inspect}>
              Inspect the evidence
              <Icon name="code" />
            </button>
          </div>
        </section>
      </div>
      <section className="boundary-note">
        <Icon name="document" />
        <p>
          <strong>A bounded guarantee.</strong> A retained request reference
          lets the API replay its result. After an explicit purge, reusing that
          reference can create another job.
        </p>
      </section>
    </section>
  );
}
