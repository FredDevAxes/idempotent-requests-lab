# Verification record

## Guided interface milestone

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
