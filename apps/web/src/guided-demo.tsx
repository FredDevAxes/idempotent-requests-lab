import { useEffect, useRef } from "react";
import { lessonFor } from "./lessons";
import { Icon } from "./icons";
import { ExchangeMotion } from "./exchange-motion";
import type { Lab } from "./use-lab";
import type { LessonId } from "./session";
export function GuidedDemo({
  lab,
  lessonId,
  inspect,
}: {
  lab: Lab;
  lessonId: LessonId;
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
  const clientTitle = lab.sending
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
  const clientDetail = lab.sending
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
  const shortStory = lab.sending
    ? "Sending the request. Waiting for the outcome."
    : lab.busy && active
      ? "Checking server records."
      : unavailable && active
        ? "Server evidence is unavailable. Refresh to check the result."
        : phase === "done" && resultMatches
          ? lessonId === "new"
            ? "A new reference creates a separate request."
            : lessonId === "conflict"
              ? "Changed content was refused. The original request is unchanged."
              : lessonId === "lost"
                ? "The retry recovered the saved request."
                : lessonId === "parallel"
                  ? "Twenty sends created one saved request."
                  : "Sending again kept one saved request."
          : lessonId === "lost"
            ? !latest
              ? "Send a request, then lose its reply after saving."
              : outcome === "unknown" && records.length === 1
                ? "The request is saved. The reply never arrived."
                : outcome === "unknown"
                  ? "No reply arrived. No saved request was observed."
                  : "The response differs from this scenario. Inspect the evidence."
            : lessonId === "parallel"
              ? "Send the same request twenty times, together."
              : lessonId === "rollback"
                ? "Fail before saving, then try again."
                : lessonId === "conflict"
                  ? "Keep the reference. Change the content."
                  : lessonId === "new"
                    ? "Same content. A new request reference."
                    : "Send a pump inspection request. Then send it again.";
  const replyLabel = lab.sending
    ? "Waiting for reply…"
    : outcome === "unknown"
      ? "Reply lost"
      : outcome === "conflict"
        ? "Content refused"
        : outcome === "retryable"
          ? "Retry available"
          : outcome === "accepted"
            ? "Reply received"
            : "Reply";
  return (
    <section className="scenario-page" aria-labelledby="scene-title">
      <div className="scene-heading">
        <h1 id="scene-title">{lesson.label}</h1>
        <p className="scenario-intro">{lesson.setup}</p>
      </div>
      <div className="observation-stage" aria-label="Live observations">
        <div
          className="request-flow"
          data-outcome={lab.sending ? "sending" : (outcome ?? "ready")}
        >
          <section
            className="endpoint client"
            data-testid="client-observation"
            aria-label="Your screen"
          >
            <h2>Your screen</h2>
            <Icon name="screen" className="endpoint-icon" />
            <span
              className={`state-label ${lab.sending ? "ready" : (outcome ?? "ready")}`}
            >
              {lab.sending
                ? "Waiting…"
                : !active
                  ? "Ready"
                  : outcome === "unknown"
                    ? "Unconfirmed"
                    : outcome === "accepted"
                      ? "Confirmed"
                      : outcome === "conflict"
                        ? "Refused"
                        : "Try again"}
            </span>
            <span className="sr-only">
              {clientTitle}. {clientDetail}
            </span>
          </section>
          <div className="flow-arrows" aria-label="Request and reply">
            <ExchangeMotion
              exchange={
                active && lab.exchange?.key === lab.session.key
                  ? lab.exchange
                  : undefined
              }
            />
            <div className="outbound">
              <span>
                {lab.sending ? "Sending…" : latest ? "Request sent" : "Request"}
              </span>
            </div>
            <div className={`inbound ${outcome === "unknown" ? "broken" : ""}`}>
              {outcome === "unknown" && (
                <span className="lost-marker">
                  <Icon name="close" />
                </span>
              )}
              <span className="reply-label">{replyLabel}</span>
            </div>
          </div>
          <section
            className="endpoint server"
            data-testid="server-observation"
            aria-label="Server"
          >
            <h2>Server</h2>
            <Icon name="server" className="endpoint-icon" />
            <span
              className={`state-label ${!unavailable && records.length ? "accepted" : "ready"}`}
            >
              {unavailable
                ? "Unavailable"
                : lab.busy
                  ? "Checking…"
                  : !active
                    ? "Not sent"
                    : records.length
                      ? "Saved"
                      : "Nothing saved"}
            </span>
            {!unavailable && !lab.busy && records.length > 0 && (
              <span className="record-caption">
                Pump inspection
                {records.length > 1 ? ` × ${records.length}` : ""}
              </span>
            )}
            <span className="sr-only">
              {unavailable
                ? "Could not check the server"
                : !active
                  ? "No experiment started"
                  : records.length === 1
                    ? "One request saved"
                    : records.length === 0
                      ? "No saved request observed"
                      : `${records.length} requests saved`}
            </span>
          </section>
        </div>
        <div className="result-counts" aria-live="polite">
          <span>
            <Icon name="send" />
            <strong>
              {sends} {sends === 1 ? "send" : "sends"}
            </strong>
          </span>
          <span>
            <Icon name="document" />
            <strong>
              {unavailable
                ? "Server not checked"
                : lab.busy
                  ? "Checking records…"
                  : `${records.length} saved ${records.length === 1 ? "request" : "requests"}`}
            </strong>
          </span>
        </div>
        {phase === "done" && (
          <p
            className={`takeaway ${resultMatches ? "sr-only" : "inline-warning"}`}
          >
            {resultMatches
              ? `${sends} sends, ${records.length} saved ${records.length === 1 ? "request" : "requests"}.`
              : unavailable
                ? "Server evidence is unavailable."
                : "Check the server observations before continuing."}
          </p>
        )}
      </div>
      <div className="scenario-actions">
        <p className="stage-footer" aria-live="polite">
          {shortStory}
        </p>
        <div className="primary-action">
          {phase !== "done" ? (
            <button
              id="guide-action"
              className="primary"
              disabled={cannotRun}
              onClick={() => void lab.runGuide(lessonId)}
            >
              {lab.sending
                ? "Sending…"
                : lab.busy
                  ? "Checking records…"
                  : phase === "retry"
                    ? lesson.retryAction
                    : lesson.firstAction}
              <Icon name="arrow" />
            </button>
          ) : !resultMatches ? (
            <button
              id="guide-action"
              className="primary"
              disabled={lab.busy}
              onClick={() => void lab.refresh()}
            >
              Refresh server results
              <Icon name="retry" />
            </button>
          ) : (
            <button
              id="guide-action"
              className="primary"
              disabled={lab.busy}
              onClick={lab.restartGuide}
            >
              Restart scenario
              <Icon name="retry" />
            </button>
          )}
        </div>
      </div>
      <div className="scenario-notices">
        {lesson.needsDemo && lab.demo === false && (
          <p className="inline-warning">
            This scenario needs local demo mode. “Send twice” is available in
            standard mode.
          </p>
        )}
        <p
          role="status"
          className={
            lab.notice.includes("storage") ||
            lab.notice.includes("API unavailable")
              ? "inline-warning"
              : "sr-only"
          }
        >
          {lab.notice.includes("storage") ||
          lab.notice.includes("API unavailable")
            ? lab.notice
            : lab.sending
              ? "Sending real requests to the API."
              : lab.busy
                ? `${clientTitle}. Checking server records.`
                : `${clientTitle}. ${unavailable ? "Server evidence unavailable." : "Server records refreshed."}`}
        </p>
        {!active && lab.session.locked && (
          <p className="preserved-note">
            Your earlier request is preserved in{" "}
            <button className="text-button" onClick={inspect}>
              Technical details
            </button>
            . Starting this scenario creates a new reference.
          </p>
        )}
      </div>
    </section>
  );
}
