# Verification record

## Documentation visuals refreshed — 15 October 2026

The current README and [visual tour](visual-tour.md) use twelve fresh PNG captures
covering all six scenarios, intermediate failure/recovery states, the expanded
technical panel and its narrow-screen layout. A real browser recording shows the
lost-reply exchange and successful retry. The runtime source is immutable
[v0.3.1](https://github.com/FredDevAxes/idempotent-requests-lab/tree/v0.3.1), revision
`ea9baf468b5576671140de68a2e860dcc50f3631`. The API and frontend have not changed in
this documentation update.

The [manifest](visuals/manifest.json) records the actual viewport, browser, source
revision, send count, persisted-row count and capture time for each PNG. Source
provenance is also embedded in PNG text metadata. All captures use the compiled app,
real HTTP and PostgreSQL, with fictional data in a temporary isolated schema.
The mobile captures use a 390×844 viewport; desktop uses 1440×900. Expanded images
include the full document height. Static shots use reduced motion; the GIF preserves
normal app motion and playback speed, encoded with the FFmpeg version in the manifest.

`CAPTURE_GIF=true pnpm docs:capture` succeeded locally: build, font readiness,
horizontal overflow and actual outcomes checked before saving. The capture server
was stopped and its schema dropped afterwards; the running user demo was untouched.
Both the static-only and GIF capture commands passed locally. `pnpm check` also
passed again: formatting, lint, types, builds and all 49 regression cases. The
[local output](evidence/visual-refresh-check.txt) preserves those executions.
The command and dedicated Playwright configuration are committed. CI also executes
the static capture path after `pnpm check`; that step is separate from the 49-case
regression suite. Historical evidence and immutable tags remain intact.

The README, presenter protocol, architecture, risk matrix and review page now agree
with manual scenario selection, same-scenario restart, inline introductions and
integrated technical evidence. Local Markdown/image links and screenshot provenance
were checked. This documentation refresh is not a new UI or accessibility audit;
other browsers and native assistive-technology combinations remain unverified.

## Manual navigation and exchange motion — v0.3.1

Scenario changes now happen only through the scenario rail (or its narrow-screen
selector). Completion offers **Restart scenario**, preserving the selected URL and
all existing server rows; restarting sends nothing until the next explicit action.
The scenario introduction is always visible under its title. The explanation disclosure
and top-right mode label have been removed. The technical panel remains collapsed by default.

Actual POST activity triggers finite request/reply illustrations. Return motion is gated
on the observed POST outcome, independently of the GET used to verify saved rows.
Unknown replies stop halfway; concurrent sends use three representative dots, with twenty
real attempts counted separately. No animation claims measured latency or individual
network packets. Reduced-motion users retain static state feedback. Technical controls,
reloads and navigating back to a scenario do not replay previous exchanges.

On 15 October 2026, `pnpm check` passed: formatting, ESLint, build, TypeScript,
2 unit tests, 15 PostgreSQL/HTTP tests and 32 Chromium browser cases (49 total).
Eight new cases cover restart and preserved data across all six scenarios, pending
replies, bounded animation, control/navigation/reload suppression, reduced motion,
and client confirmation while independent GET evidence is still pending.
See [local output](evidence/v031-local-check.txt) and [browser cases](evidence/v031-browser-cases.json).

The compiled desktop and mobile captures use the `v031-` prefix. The desktop/mobile
views were visually inspected, alongside the live in-app page; keyboard, axe checks
and 200% text reflow pass. Existing demo data was preserved. The API and retention
contract have not changed. This focused refinement does not rerun or close the v0.3.0
image-comparison gate described below. No fresh clone or other browser-engine run is
claimed for this milestone. Resolve the immutable tag with `git rev-list -n 1 v0.3.1`
and match its revision to the public main-branch CI run.

## Scenario workspace C — v0.3.0

The approved C interface replaces the two top-level tabs with one page per scenario.
A bottom technical panel starts collapsed, closes on scenario navigation and reveals
HTTP attempts, independent server observations and advanced manual tools in place.
The API and persistence contract are unchanged. No user-demo rows were deleted for tests.

The complete `pnpm check` passed locally on 15 October 2026: formatting, build, TypeScript, ESLint, 2 unit tests,
15 PostgreSQL/HTTP tests and 24 Chromium browser cases, all passing with none skipped.
The browser cases include all six guided scenarios, the existing nine manual journeys,
legacy session recovery, keyboard/axe checks, 200% text reflow, scenario-scoped evidence,
collapsed defaults, actual identifier copy, and truthful lost-reply summaries before
sending and after a failed server read. See [browser cases](evidence/v030-browser-cases.json).

The v0.3.0 screenshots use the `workspace-c-` prefix under `docs/evidence/`. They are
compiled-app captures, with provenance embedded, at 1536×1024 (approved reference size),
1440×1024, 390×844, 659×853 and 640×800 with enlarged text. UUIDs and timestamps are real
fictional test records. Older screenshots and verification sections belong to earlier
milestones, whose immutable tags preserve their original context.

The independent design review requested a stronger primary action, the approved send
symbol, observation-aware lost-reply copy, mobile brand spacing and updated design
records. Corrections and their verdict are recorded in the C review evidence. The hero
comparison gate passed. The responsive image-comparison gate remains mechanically open:
its normalized crops call the diagram and HTTP activity missing at 1440px, although the
reviewer confirmed both are present and readable in the capture and paired crops.
No forced pass was recorded. This is a documented image-comparison limitation, not a
claim of exact pixel fidelity. Automated browser overflow and accessibility checks pass.

The source milestone is the immutable `v0.3.0` tag. Resolve its exact code revision
with `git rev-list -n 1 v0.3.0` and match it in the public main-branch CI runs.
The final check output is [recorded here](evidence/v030-local-check.txt); the focused
design verdict is [recorded here](../.impeccable/review/workspace-c-verdict.json).

The new UI has not been reproduced in a separate fresh clone; the v0.2.0 clean-clone
run below remains historical. Chromium is the automated target. Other engines, native
browser zoom and full assistive-technology certification remain unverified. One browser
intention is active at a time; browsing scenarios preserves it, starting a new experiment
explicitly replaces it while keeping earlier database records.

## Guided interface milestone (historical v0.2.0)

The v0.2.0 interface adds an accompanied, six-experiment presentation and a separate
technical-controls tab. The API transaction and retention contract are unchanged.
The existing client session format remains accepted; starting a new experiment is explicit.

Executed browser coverage: 21 Chromium cases passed with no skipped cases, including
all six guided lessons, exact replay, real lost-response recovery, preserved references
across reload/tab changes, two distinct intentions, scoped experiment counts, unavailable
server reads, old-session preservation, keyboard/tabs, axe scans and 200% text reflow.
The displayed face is a pinned self-hosted font, checked in the rendered heading.

Real screenshots show the compiled interface at 1440×1100, 390×844, 659×853 and 640×800
with 200% root text. Capture helpers wait for document.fonts.ready. Screenshot provenance
is embedded. The Impeccable detector ran once and returned no findings; the finish reviewer
requested truthful conflict wording and a self-hosted typeface. Both corrections are
scored resolved in the focused verdict, with disposition ship. The final local checks
and public delivery are recorded below.

The complete local `pnpm check` passed on 14 October 2026: formatting, ESLint,
API/contracts/web builds, TypeScript, 2 unit tests, 15 real PostgreSQL/HTTP tests
and 21 compiled Chromium cases. No tests were skipped. See
[the sanitized check output](evidence/v020-local-check.txt) and
[the browser-case summary](evidence/v020-browser-cases.json).
`DESIGN.md` and `.impeccable/design.json` record the implementation's design system.
The current pinned production dependency audit reported no known advisories.
The working tree was scanned by Gitleaks with no findings; the committed history is
checked again before push. Font licenses were verified from the installed inventory.

The actual records stay isolated in the browser-test schema. A failed server read is not
reported as zero, and a conflict is not described as an accepted replay. No metric or
successful business write is simulated by the guide.

### Public delivery and fresh-clone reproduction

The [guided-interface CI run](https://github.com/FredDevAxes/idempotent-requests-lab/actions/runs/38643683964)
passed on `0d2d0ba7a41257d9f657b3f3002f63dcf515c407`, the complete interface revision.
A new anonymous HTTPS clone of that exact revision installed dependencies with the
frozen lockfile, copied the example environment, built, migrated, installed Chromium
and passed `pnpm check` (2 unit, 15 PostgreSQL/HTTP, 21 browser tests; none skipped).
The existing local PostgreSQL container, installed toolchain and package/browser
caches were reused. No configuration, node_modules or build output was copied into
the clone. Git remained clean. See [clean-clone output](evidence/v020-clean-check.txt).
The running visitor demonstration was kept separate from these test schemas.

The evidence-record commit changes documentation only. The final `v0.2.0` delivery
must also have a successful main-branch CI run before its tag is pushed. Resolve the
annotated tag with `git rev-list -n 1 v0.2.0` and match that SHA in
[main-branch runs](https://github.com/FredDevAxes/idempotent-requests-lab/actions?query=branch%3Amain).
The original `v0.1.0` tag is unchanged. The repository remains public; no service was
deployed. Chromium is the automated target; native browser zoom, other engines and
screen readers remain unverified. This is a local prototype with a bounded retention
contract, not a production or universal exactly-once guarantee.

# v0.1.0 verification history

Historical v0.1.0 milestone. Its immutable tag preserves the original interface,
test results and screenshots. See the current guided-interface record above.

Historical implementation and original screenshots examined: `bc7cd25c699170c49faaa9f761eb6fffe0a5eb52`.
The later check-order correction does not change runtime behavior. Screenshot UUIDs
are fictional generated identifiers. See [the original protocol](https://github.com/FredDevAxes/idempotent-requests-lab/blob/v0.1.0/docs/demo.md) for its capture conditions.

Observed on 14 October 2026, macOS arm64, Node 24.13.0, pnpm 10.34.5, Docker 29.8.0,
PostgreSQL 17.6, Chromium 156.0.8078.4 (Playwright 1.64.1):

- Formatting, ESLint, TypeScript, API/shared/web builds: passed.
- Unit tests: 2 passed, none skipped.
- Real PostgreSQL/HTTP tests: 15 passed, none skipped.
- Compiled Chromium browser tests: 9 passed, none skipped.
- The normal/production-mode control separation was executed, not just inspected.
- CLI lost-response demonstration returned a persisted identifier and exact 201 replay.
- A dependency audit reported zero production advisories at the time of examination.
- Gitleaks scanned working-tree content before commits and all four published commits; no leaks found.

The [review](review.md) records corrected material findings and remaining coverage limits.
Raw sanitized local output and browser-case results are stored under `evidence/`.
The socket-hang-up trace in the output is the intentional lost-response experiment.
Timing values describe one execution and are not a performance benchmark.

## Public CI and fresh-clone reproduction

The [initial public delivery run](https://github.com/FredDevAxes/idempotent-requests-lab/actions/runs/38613096522)
completed successfully on `eb3c5c6a144786b32f342178d6c44f0c39fef1d2`.
It used Ubuntu 24.04, the pinned PostgreSQL service, Node/pnpm and Chromium and ran
`pnpm check` with no skipped test cases. The final milestone's run is available in
[main-branch CI runs](https://github.com/FredDevAxes/idempotent-requests-lab/actions?query=branch%3Amain);
match its head revision with `git rev-list -n 1 v0.1.0`.

A fresh HTTPS clone of that public revision was used to install locked dependencies,
copy the example environment, start Compose, build, migrate, install Chromium,
run all checks, launch `LOCAL_DEMO=true pnpm dev` and execute `pnpm demo:cli`.
The installed toolchain and local pnpm download cache were reused; no node_modules,
build artifacts or local configuration were copied into the clone. The documented
commands passed and Git remained clean. See [clean-clone output](evidence/clean-clone-check.txt)
and [CLI observations](evidence/clean-clone-demo.txt). Repeating migrations also passed.

The later evidence-record commit changes documentation only. The same checks are
required on that final delivery revision before the tag is published. The repository
was verified PUBLIC through GitHub metadata and an anonymous HTTPS clone. No service
was deployed and no external business side effect is implemented.
