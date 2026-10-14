---
name: "Idempotent requests lab"
description: "A precise, readable workspace for observing request reliability."
colors:
  "ink": "#182543"
  "muted": "#4f5b72"
  "accent": "#3159ce"
  "accent-hover": "#2547ac"
  "surface": "#fff"
  "ground": "#f5f7fc"
  "line": "#ccd4e3"
  "green": "#186443"
  "green-light": "#eaf6ef"
  "purple": "#6643a2"
  "purple-light": "#f0ebfa"
  "red": "#a12c40"
  "button-border": "#8b9bb5"
  "button-hover": "#edf1fa"
  "button-active": "#e2e9f9"
  "field-border": "#8292ad"
  "invalid-surface": "#fbebee"
  "selected-tab": "#eaf0ff"
  "selected-step": "#e7edfc"
typography:
  display:
    fontFamily: "Atkinson Hyperlegible Next Variable, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "2.35rem"
    fontWeight: 750
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Atkinson Hyperlegible Next Variable, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 750
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  scene-title:
    fontFamily: "Atkinson Hyperlegible Next Variable, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.8rem"
    fontWeight: 750
    lineHeight: 1.22
  result-title:
    fontFamily: "Atkinson Hyperlegible Next Variable, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Atkinson Hyperlegible Next Variable, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Atkinson Hyperlegible Next Variable, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 650
    lineHeight: 1.55
  observation-label:
    fontFamily: "Atkinson Hyperlegible Next Variable, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.88rem"
    fontWeight: 650
    lineHeight: 1.4
  button:
    fontFamily: "Atkinson Hyperlegible Next Variable, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 650
    lineHeight: 1.55
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.55
rounded:
  "field": "6px"
  "control": "8px"
  "record": "12px"
  "technical-panel": "14px"
  "observation-stage": "16px"
  "circle": "50%"
spacing:
  "4": "4px"
  "8": "8px"
  "10": "10px"
  "12": "12px"
  "14": "14px"
  "16": "16px"
  "18": "18px"
  "20": "20px"
  "22": "22px"
  "24": "24px"
  "26": "26px"
  "28": "28px"
  "32": "32px"
  "40": "40px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.red}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    padding: "10px 0"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "11px 12px"
    width: "100%"
  view-tab:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    padding: "15px 20px"
  view-tab-selected:
    backgroundColor: "{colors.selected-tab}"
    textColor: "{colors.accent}"
  technical-panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.technical-panel}"
    padding: "24px"
  observation-stage:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.observation-stage}"
  takeaway:
    backgroundColor: "{colors.green-light}"
    textColor: "{colors.green}"
    rounded: "{rounded.control}"
    padding: "13px 14px"
  takeaway-attention:
    backgroundColor: "{colors.purple-light}"
    textColor: "{colors.purple}"
---

# Design System: Idempotent requests lab

## Overview

**Creative North Star: "The Rehearsal Cue Sheet"**

The rehearsal cue sheet gives each action a clear place and each observation a readable explanation. Cool paper, deep navy ink and restrained cobalt controls support an accompanied demonstration without decorative staging.

The system separates action, evidence and uncertainty through language, borders and paired state colors. Its depth is flat, its typography is deliberately legible, and its SVG symbols supplement words rather than carrying meaning alone.

**Key Characteristics:**

- Readable task typography with tabular numerals.
- Flat white observation surfaces on cool paper.
- State colors paired with explicit result text.
- Responsive comparison panels and visible keyboard focus.

## Colors

Cool paper and navy ink support cobalt actions, with green and violet distinguishing evidence from uncertainty. The frontmatter is the normative palette; its names preserve the stylesheet's existing custom properties.

### Primary

- **Cobalt Action** (`accent`, `accent-hover`): links, next-action buttons, selected navigation and focus.

### Secondary

- **Recorded Green** (`green`, `green-light`): persisted results, verified takeaways and live evidence labels.
- **Uncertainty Violet** (`purple`, `purple-light`): missing confirmation, conflicting content and attention takeaways.
- **Failure Red** (`red`, `invalid-surface`): retryable or invalid results, warnings and destructive controls.

### Neutral

- **Navy Ink** (`ink`): principal text and brand.
- **Slate Explanation** (`muted`): supporting text and inactive navigation.
- **White Stage / Cool Paper** (`surface`, `ground`): bounded evidence against the page ground.
- **Quiet Divider** (`line`): panel outlines and internal separators.
- **Control Edges** (`button-border`, `field-border`): stronger boundaries on interactive controls.
- **Interaction Washes** (`button-hover`, `button-active`, `selected-tab`, `selected-step`): visible control and navigation states.

**The Evidence Color Rule.** Green marks observed saved facts; violet marks unknown confirmation or a refused content change. Keep their text explanations alongside the color.

## Typography

**Display Font / Body Font:** Atkinson Hyperlegible Next Variable, with the platform sans-serif fallback stack in the frontmatter.
**Label/Mono Font:** the same Atkinson family for labels; the frontmatter's system monospace stack for technical identifiers.

The readable variable family is self-hosted through Fontsource (package version 5.3.0, OFL-1.1), imported by the web entry point. It supplies the display as well as the body face; the system font stack is a loading fallback, not a display identity. Numerals are tabular across the interface.

### Hierarchy

- **Display:** the page introduction; balanced wrapping and tight tracking.
- **Headline:** section headings; the scene-title role is larger on wide screens.
- **Result title:** a concise observation outcome, using the browser's bold heading weight (700).
- **Body:** explanatory paragraphs, with the introduction limited to 63ch and scene copy to 45ch on wide screens.
- **Label:** form labels and observation names; action buttons use weight 650.
- **Mono:** keys and identifiers in the technical evidence definitions.

The source also uses compact supporting text between 0.75rem and 0.92rem. At the narrow breakpoint, display becomes 1.85rem, scene titles become 1.5rem and result titles become 1.2rem. Lesson labels become 0.72rem within a three-column step grid; this is a local dense-navigation treatment, not the default body scale.

**The Readable Voice Rule.** Use the sourced Atkinson family for task and explanatory text; reserve monospace for raw technical identifiers.

## Layout

The header and main content share a centered container (maximum 1224px including side padding). Wide screens use 32px gutters. Spacing is an observed set of practical increments, not a mathematical ratio.

The guided workspace uses a flexible scene beside a broader observation stage (`minmax(260px, 0.82fr) minmax(0, 1.5fr)`, gap 32px). Client and server observations share two equal columns. Technical panels and retention controls use equal columns with a 40px gap. Records use two columns with a 16px gap.

At maximum 1000px, the workspace gap becomes 22px and its columns change to `minmax(250px, 0.8fr) minmax(0, 1.2fr)`. Observations stack, their divider becomes horizontal, and the stage footer stacks its content. At maximum 700px, page gutters become 18px, the workspace, technical panels and records become single-column, and lesson navigation becomes three columns. Auxiliary header and introduction notes disappear. Long identifiers wrap anywhere; no narrow layout assumes fixed-width identifiers.

## Elevation & Depth

There are no box shadows. White surfaces, thin dividers and restrained state washes establish hierarchy. The result symbol's colored tile is a state marker, not a raised object. Focus remains an explicit outline.

**The Flat Evidence Rule.** Separate observations with borders and quiet surface changes rather than shadows.

## Shapes

Controls and takeaways share softly curved corners; fields use tighter corners. Evidence stages have the broadest corners, with clipping at the outer boundary. Technical panels and record cards use intermediate radii. Thin strokes define cards and fields. Circular numbered lesson markers are native to this world; they are meaningful step indicators, not decorative glyphs. Icons are inline outlined SVGs with round caps and joins.

## Components

### Buttons

Confident sentence-case controls. Standard buttons have a minimum height of 44px, a one-pixel boundary, weight 650 and a 10px internal gap. Primary buttons use cobalt and white; secondary buttons use white and ink; danger buttons use red text and border. The guided action stretches across its scene, with a minimum height of 54px and padding 15px 17px. Text buttons retain an underline and cobalt text.

Hover changes background and border over 160ms ease-out; standard active controls use the active wash. Disabled buttons have opacity 0.55 and a not-allowed cursor. Focus uses a cobalt outline (3px, offset 4px). Reduced-motion preference removes transitions, animations and smooth scrolling.

### Inputs / Fields

White, full-width fields with a stronger one-pixel stroke, minimum height 46px and field-radius corners. Textarea height is vertically resizable. Labels remain visible above fields. Disabled fields use a muted wash and text with full opacity. Carets use cobalt; keyboard focus uses the shared outline.

### Navigation

Tabs use transparent surfaces at rest, a quiet bottom divider, and a pale cobalt selected surface with a short cobalt underline. Tab selection is exposed through `aria-selected`; ArrowLeft/ArrowRight, Home and End move selection and focus. Only the selected tab is in the normal tab sequence, and inactive panels are hidden.

Lesson buttons wrap across the available width and mark the current step with `aria-current="step"`, a pale cobalt wash and a filled numbered circle. Narrow layouts use the three-column grid described above. The skip link becomes visible on focus and focuses the next usable action.

### Cards / Containers

White technical panels and record cards use quiet one-pixel boundaries with their own radius roles. Technical panels have 24px internal padding, becoming 20px on narrow screens. Record cards use 18px 20px. These containers stay flat.

### Observation Stage

A shared, clipped stage contains a heading, two labeled observations and a bounded footer. Each result uses an outlined SVG on a colored tile, an outcome heading, explanation and any refreshed records. The labels identify client and server independently of color. State changes announce through status text; completed guided phases return focus to the next action. Verified takeaways use green, while attention takeaways use violet. The stage's paired desktop composition belongs to this comparison pattern, not every future page.

## Do's and Don'ts

### Do:

- **Do** keep a visible focus outline and named keyboard-operable controls.
- **Do** pair each state color and SVG symbol with readable result text.
- **Do** let long technical identifiers wrap and comparison panels stack on narrow screens.
- **Do** preserve self-hosted font assets and their OFL notice.

### Don't:

- **Don't** treat unavailable server evidence as a zero count or a successful result.
- **Don't** use color or an icon as the only indication of an outcome.
- **Don't** add decorative elevation to the flat observation surfaces.
