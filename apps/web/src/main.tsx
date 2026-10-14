import "@fontsource-variable/atkinson-hyperlegible-next";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { GuidedDemo } from "./guided-demo";
import { TechnicalControls } from "./technical-controls";
import { useLab } from "./use-lab";
import { Icon } from "./icons";
import { lessons } from "./lessons";
import { lessonIds, type LessonId } from "./session";
import "./style.css";
function App() {
  const lab = useLab();
  const readLesson = () => {
    const id = location.hash.slice(1) as LessonId;
    return lessonIds.includes(id)
      ? id
      : (lab.session.guide?.lesson ?? "repeat");
  };
  const [lesson, setLesson] = useState<LessonId>(readLesson);
  const [technicalOpen, setTechnicalOpen] = useState(false);
  useEffect(() => {
    const change = () => {
      setLesson(readLesson());
      setTechnicalOpen(false);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  });
  function choose(id: LessonId) {
    if (lab.busy) return;
    setLesson(id);
    setTechnicalOpen(false);
    if (location.hash !== `#${id}`) location.hash = id;
  }
  const index = lessons.findIndex((item) => item.id === lesson);
  const matching = !lab.session.guide || lab.session.guide.lesson === lesson;
  const attempts = matching ? lab.session.attempts.length : 0;
  return (
    <>
      <a
        className="skip"
        href="#guide-action"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("guide-action")?.focus();
        }}
      >
        Skip to the next action
      </a>
      <div className="app-shell">
        <aside className="scenario-rail">
          <a
            className="brand"
            href="https://github.com/FredDevAxes/idempotent-requests-lab"
          >
            <Icon name="document" />
            <span>
              Idempotent
              <br /> requests lab
            </span>
          </a>
          <nav className="lesson-nav" aria-label="Guided experiments">
            <h2>Scenarios</h2>
            {lessons.map((item, number) => (
              <button
                key={item.id}
                disabled={lab.busy}
                aria-current={item.id === lesson ? "step" : undefined}
                onClick={() => choose(item.id)}
              >
                <span className="lesson-index">{number + 1}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="mobile-scenarios">
            <label htmlFor="choose-scenario">Scenario</label>
            <select
              id="choose-scenario"
              value={lesson}
              disabled={lab.busy}
              onChange={(event) => choose(event.target.value as LessonId)}
            >
              {lessons.map((item, number) => (
                <option key={item.id} value={item.id}>
                  {number + 1}. {item.label}
                </option>
              ))}
            </select>
          </div>
          <p className="rail-position">
            {index + 1} of {lessons.length}
            <span>DevAxes</span>
          </p>
        </aside>
        <main
          id="main-content"
          className={`workspace ${technicalOpen ? "drawer-open" : ""}`}
        >
          <header className="workspace-header">
            <span>Scenario {String(index + 1).padStart(2, "0")} / 06</span>
          </header>
          <GuidedDemo
            key={lesson}
            lab={lab}
            lessonId={lesson}
            inspect={() => setTechnicalOpen(true)}
          />
          <section className="technical-drawer" aria-label="Technical details">
            <button
              id="technical-toggle"
              className="drawer-toggle"
              aria-expanded={technicalOpen}
              aria-controls="technical-panel"
              onClick={() => setTechnicalOpen(!technicalOpen)}
            >
              <span>
                <Icon name="code" />
                <strong>Technical details</strong>
                <span className="attempt-badge">
                  {attempts} {attempts === 1 ? "attempt" : "attempts"}
                </span>
              </span>
              <span className="drawer-verb">
                {technicalOpen ? "Collapse" : "Expand"}
                <Icon name="chevron" />
              </span>
            </button>
            <div id="technical-panel" hidden={!technicalOpen}>
              <TechnicalControls key={lesson} lab={lab} lessonId={lesson} />
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
