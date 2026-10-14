---
name: "Idempotent requests lab"
description: "A quiet scenario workspace for observing requests and replies."
colors:
  ink: "#182543"
  muted: "#4f5b72"
  line: "#ccd4e3"
  accent: "#1458e9"
  surface: "#f3f6fc"
  green: "#186443"
  purple: "#6643a2"
  danger: "#a12c40"
  white: "#fff"
  rail: "#f2f6fd"
  explanation: "#354a70"
  accent-hover: "#183fae"
  button-hover: "#edf2fc"
  button-hover-border: "#a0b2d5"
  nav-hover: "#e6edf9"
  nav-selected: "#dfe8fc"
  nav-selected-ink: "#1748cc"
  state-neutral: "#edf0f5"
  state-green: "#e3f4e7"
  state-purple: "#eee6ff"
  state-danger: "#fbecef"
  drawer: "#f8faff"
  drawer-toggle: "#eef3fb"
  record-border: "#d6dfef"
  field-border: "#a6b5ce"
  field-disabled: "#eef1f7"
typography:
  display:
    fontFamily: "Atkinson Hyperlegible Next Variable, sans-serif"
    fontSize: "clamp(2rem, 3vw, 2.75rem)"
    fontWeight: 750
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Atkinson Hyperlegible Next Variable, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 700
  body:
    fontFamily: "Atkinson Hyperlegible Next Variable, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  introduction:
    fontFamily: "Atkinson Hyperlegible Next Variable, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.5
  primary-action:
    fontFamily: "Atkinson Hyperlegible Next Variable, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
  navigation:
    fontFamily: "Atkinson Hyperlegible Next Variable, sans-serif"
    fontSize: "1.1rem"
    lineHeight: 1.2
  label:
    fontFamily: "Atkinson Hyperlegible Next Variable, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 500
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "0.85em"
rounded:
  identifier: "4px"
  field: "5px"
  control: "6px"
  pill: "999px"
  circle: "50%"
spacing:
  compact: "0.5rem"
  control-gap: "0.6rem"
  small: "0.7rem"
  regular: "1rem"
  mobile-gutter: "1.25rem"
  section: "1.5rem"
  technical-gap: "1.75rem"
  large: "2rem"
  desktop-gutter: "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.white}"
    typography: "{typography.primary-action}"
    rounded: "{rounded.control}"
    padding: "0.7rem 1.25rem"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.55rem 0.9rem"
  button-danger:
    backgroundColor: "{colors.white}"
    textColor: "{colors.danger}"
    rounded: "{rounded.control}"
    padding: "0.55rem 0.9rem"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    padding: "0"
  field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0.65rem 0.75rem"
    width: "100%"
  scenario-navigation:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.navigation}"
    padding: "0.6rem 0.8rem"
    width: "100%"
  scenario-navigation-current:
    backgroundColor: "{colors.nav-selected}"
    textColor: "{colors.nav-selected-ink}"
  state-label:
    backgroundColor: "{colors.state-neutral}"
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "0.4rem 0.9rem"
  evidence-record:
    rounded: "{rounded.control}"
    padding: "0.85rem 1rem"
  advanced-disclosure:
    textColor: "{colors.explanation}"
    padding: "0.4rem 0 0"
  disclosure-toggle:
    backgroundColor: "{colors.drawer-toggle}"
    rounded: "0"
    padding: "1rem 2rem"
    width: "100%"
---

# Design System: Idempotent requests lab

## Overview

**Creative North Star: "The Quiet Scenario Workspace"**

A quiet scenario workspace gives the next action and its observed outcome a clear place. Near-white blue surfaces, navy text and cobalt controls frame the exchange without decorative staging. The locally served Atkinson typeface preserves the readable voice of the previous interface.

Client uncertainty and server observations remain distinct through explicit words, thin borders and state colors. Technical evidence expands within the same document flow. This record describes the implemented approved C interface; its page-specific direction remains in `apps/web/.impeccable/surfaces/apps-web-src-main-tsx.md`.

**Key Characteristics:**

- Legible Atkinson text with monospace technical values.
- Flat surfaces and restrained semantic state washes.
- Outlined SVGs paired with readable labels.
- Progressive disclosure with visible keyboard focus.

## Colors

Cool near-white surfaces and navy ink support a cobalt action accent. Frontmatter values are extracted from `apps/web/src/style.css`; the original custom-property names are retained. Additional descriptive names identify repeated literal values.

### Primary

- **Cobalt Action** (`accent`, `accent-hover`): primary actions, links, carets, selected step circles and focus outlines.

### Secondary

- **Observed Green** (`green`, `state-green`): accepted replies and observed server records.
- **Uncertainty Violet** (`purple`, `state-purple`): missing confirmation.
- **Failure Red** (`danger`, `state-danger`): conflicts, retryable failures, warnings and destructive action text.

### Neutral

- **Navy Ink / Slate Explanation** (`ink`, `muted`, `explanation`): principal and supporting text.
- **White / Cool Rail** (`white`, `rail`, `surface`): workspace, navigation ground and scrollbar track.
- **Evidence Washes** (`drawer`, `drawer-toggle`): expanded evidence and its disclosure bar.
- **Control Boundaries** (`line`, `record-border`, `field-border`): dividers, evidence records and fields.
- **Interaction Washes** (`button-hover`, `nav-hover`, `nav-selected`, `field-disabled`): hovered, selected and disabled controls; selected navigation has its own ink.

**The Evidence Color Rule.** Green accompanies observed persistence or acceptance; violet accompanies missing confirmation. Conflict and retryable failure use danger red. Always retain readable state text.

## Typography

**Display / Body Font:** Atkinson Hyperlegible Next Variable, imported from Fontsource in the web entry point, with a sans-serif loading fallback.
**Label/Mono Font:** Atkinson labels; the frontmatter monospace stack for identifiers, payloads and HTTP evidence.

### Hierarchy

- **Display:** balanced scenario headings, using the fluid size and tight tracking in the frontmatter.
- **Headline:** endpoint and evidence section headings.
- **Body:** regular interface text; paragraphs use the recorded line height.
- **Introduction:** scenario summary text, constrained to 65ch; reduced to 1.05rem at the narrow breakpoint.
- **Primary action:** 18px at the default root size, weight 600.
- **Navigation:** left-aligned scenario names; the current item uses weight 650.
- **Label:** quiet navigation section label. Supporting evidence text uses 0.8–0.95rem; identifiers use 0.78rem and wrap anywhere. These compact values remain local to technical evidence.

Tabular numerals are applied to numbered scenario markers, result counts and timestamps. At 860px and below, endpoint titles become 1rem and state labels become 0.88rem; the fluid display ramp stays in effect.

**The Readable Voice Rule.** Use Atkinson for interface and explanatory text; reserve monospace for raw technical values.

## Layout

The implemented shell fills at least 100svh. A left rail uses `clamp(224px, 18vw, 275px)` beside a flexible workspace. There is no centered maximum-width page container. The workspace has a thin scenario-position header, scenario content and a bottom technical disclosure in normal flow.

Desktop content gutters are 2.5rem. The request/reply diagram uses three columns: `minmax(140px, 1fr) minmax(180px, 2.5fr) minmax(140px, 1fr)`, with a minimum height of 270px. Two observed counters sit below it. The introduction stays beneath the title. The action row places the observed outcome on the left and the primary action on the right. The scenario area grows to occupy available space while the technical panel is collapsed.

At widths up to 1100px, technical and advanced content stack, the diagram narrows its column minimums, and the primary action sits below the observed outcome at full width. Above 1100px, technical evidence occupies the left column and request tools the right, with a 1.75rem gap; collapsed Advanced tools sits under the tools, expanding across both columns when opened. At 1100px and above, opening the technical panel stops scenario-content growth.

At widths up to 860px, the rail becomes a top band and a labeled native selector replaces the numbered navigation. The brand remains spaced on one line. Gutters become 1.25rem; endpoint icons shrink from 84px to 62px, the diagram minimum height becomes 230px, and its horizontal exchange is preserved. The technical disclosure hides only its Expand/Collapse word while retaining the chevron and accessible expanded state. At widths up to 480px, identifier rows and saved-record definitions stack; diagram columns can shrink to zero minimum, and state pills wrap.

Spacing follows the observed practical increments in the frontmatter. These layout patterns describe the current scenario surface, not a mandatory composition for every future page.

## Elevation & Depth

Thin boundaries and pale washes separate regions. Keyboard focus uses a 3px cobalt outline with 4px offset. Actual sends trigger a finite 700ms outbound packet animation. A matching return animation starts only after the POST outcome is known, delayed enough to follow the outbound illustration. An unknown reply stops halfway. Parallel sends use three staggered dots to represent the batch, while counters show actual attempts. Packets use a 3px white outline shadow for contrast, with no surface elevation. Only transform and opacity animate; nothing loops. Reduced-motion preference hides decorative packets and preserves static state feedback. Reloading and navigation do not replay past events; technical controls do not animate the exchange. Controls have immediate hover changes, with no transition token.

**The Flat Evidence Rule.** Use borders and quiet surface changes to separate observations. The in-flight arrow glow is a temporary activity cue, not surface elevation.

## Shapes

Small radii define controls, fields, identifiers and evidence rows. Endpoint state labels use pill corners; scenario numbers and the lost-reply marker are circular. The full-width technical disclosure has square corners. No large rounded card contains the observation stage. Outlined SVG icons use round caps and joins, supplemented by CSS request/reply lines and arrowheads. Numbered circles are meaningful navigation markers native to this interface.

## Components

### Buttons

Sentence-case actions with explicit labels. Standard buttons have a one-pixel border and minimum height of 44px. Primary buttons use the recorded cobalt/white treatment, minimum height 52px and weight 600. The guided primary action has minimum width `min(242px, 100%)` and 24px SVG; it becomes full width below the technical stacking breakpoint. Secondary controls use white and ink; danger controls retain the base border and use red text. Text buttons are underlined, transparent and unpadded.

Hover changes backgrounds and borders immediately. Disabled buttons use opacity 0.55 and a not-allowed cursor. All interactive controls inherit the shared keyboard focus outline.

### Inputs / Fields

Full-width white fields with a one-pixel boundary and minimum height 44px. Labels remain above editable fields; the mobile scenario selector has an adjacent label. Disabled fields use muted text and a pale wash at full opacity. Textareas resize vertically. Copy controls are labeled buttons next to wrapping technical identifiers.

### Navigation

Six numbered scenario buttons use `aria-current="step"` for the selected item, a pale blue wash and a filled cobalt circle. Navigation is the only way to change scenarios. It changes the URL fragment and closes the technical panel. The completed main action restarts only the current scenario. It does not reset persisted records. Native selection replaces the rail on narrow screens. A focus-visible skip link moves to the next guided action.

### Evidence Records and State Labels

Evidence rows have thin borders, compact padding and small corners. HTTP status labels have outlined boundaries and explicit text. Endpoint status pills combine a colored dot with a readable word. Technical attempts scroll within a 230px maximum-height focusable history; saved records remain in document flow. All-record lists use an auto-fitting grid with a 300px minimum, capped by available width.

### Request / Reply Exchange

Two labeled endpoint SVGs face each other across a solid outgoing line and dashed return line. A circular close SVG interrupts a missing reply. Send and saved-record counts stay separate, with a paper-plane SVG for sends and document SVG for records. The lost-reply summary checks observed records before stating persistence. Missing server evidence remains explicit, and raw POST confirmation is separate from GET observations. Status announcements and focus returned to the next action accompany phase changes.

### Disclosures

The bottom Technical details button is collapsed on initial render, exposes `aria-expanded` and `aria-controls`, and hides its panel with the `hidden` attribute. The action remains above it. Its attempt badge is scoped to the displayed scenario. Expanded evidence groups HTTP activity, observed records, identifiers and request tools. The short scenario introduction is always visible below its title. Request content and Advanced tools use native details/summary elements and begin closed. Advanced manual controls describe their effect on the current request; they are separate from the guided next action. Chevron rotation signals expanded state where an SVG chevron is present.

## Do's and Don'ts

### Do:

- **Do** pair state colors and SVG symbols with explicit text.
- **Do** preserve the visible focus outline, native disclosures and labeled controls.
- **Do** allow identifiers to wrap and technical evidence to stack at narrow widths.
- **Do** retain locally served font assets and their third-party license.

### Don't:

- **Don't** interpret unavailable evidence as zero saved records or a successful operation.
- **Don't** substitute a lost POST response with an identifier observed separately through GET.
- **Don't** introduce decorative elevation on the flat evidence surfaces.
