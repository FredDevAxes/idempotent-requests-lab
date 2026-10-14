import "@fontsource-variable/atkinson-hyperlegible-next";
import { useState, type KeyboardEvent } from "react";
import { createRoot } from "react-dom/client";
import { GuidedDemo } from "./guided-demo";
import { TechnicalControls } from "./technical-controls";
import { useLab } from "./use-lab";
import { Icon } from "./icons";
import type { LessonId } from "./session";
import "./style.css";
function App() {
  const lab = useLab();
  const [selectedTab, setSelectedTab] = useState<"guided" | "technical">(
    "guided",
  );
  const [lesson, setLesson] = useState<LessonId>(
    lab.session.guide?.lesson ?? "repeat",
  );
  function switchTab(value: "guided" | "technical", focus = false) {
    setSelectedTab(value);
    if (focus) document.getElementById(`${value}-tab`)?.focus();
  }
  function tabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      switchTab(
        event.key === "Home"
          ? "guided"
          : event.key === "End"
            ? "technical"
            : selectedTab === "guided"
              ? "technical"
              : "guided",
        true,
      );
    }
  }
  return (
    <>
      <a
        className="skip"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document
            .getElementById(
              selectedTab === "guided"
                ? "guide-action"
                : lab.session.locked
                  ? "send-button"
                  : "site",
            )
            ?.focus();
        }}
      >
        Skip to the next action
      </a>
      <header className="app-header">
        <a
          className="brand"
          href="https://github.com/FredDevAxes/idempotent-requests-lab"
        >
          <Icon name="document" />
          Idempotent requests lab
        </a>
        <span>DevAxes</span>
      </header>
      <main id="main-content">
        <div
          className="view-tabs"
          role="tablist"
          aria-label="Demonstration views"
        >
          <button
            id="guided-tab"
            role="tab"
            aria-selected={selectedTab === "guided"}
            aria-controls="guided-panel"
            tabIndex={selectedTab === "guided" ? 0 : -1}
            onKeyDown={tabKey}
            onClick={() => switchTab("guided")}
          >
            <Icon name="play" />
            Guided demo
          </button>
          <button
            id="technical-tab"
            role="tab"
            aria-selected={selectedTab === "technical"}
            aria-controls="technical-panel"
            tabIndex={selectedTab === "technical" ? 0 : -1}
            onKeyDown={tabKey}
            onClick={() => switchTab("technical")}
          >
            <Icon name="code" />
            Technical controls
          </button>
        </div>
        <div hidden={selectedTab !== "guided"}>
          <GuidedDemo
            lab={lab}
            lessonId={lesson}
            setLesson={setLesson}
            inspect={() => switchTab("technical", true)}
          />
        </div>
        <div hidden={selectedTab !== "technical"}>
          <TechnicalControls lab={lab} />
        </div>
        <footer>
          Local prototype. No payments, emails or other external effects.{" "}
          <a href="https://github.com/FredDevAxes/idempotent-requests-lab">
            Read the contract and source
          </a>
        </footer>
      </main>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
