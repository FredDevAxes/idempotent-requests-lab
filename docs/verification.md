# Verification record

Status: local checks verified; public CI and clean-clone evidence are being collected.
The release milestone is not validated until those checks finish. This file will be
updated with the observed delivery references.

Implementation and screenshots examined: `bc7cd25c699170c49faaa9f761eb6fffe0a5eb52`.
The later check-order correction does not change runtime behavior. Screenshot UUIDs
are fictional generated identifiers. See the [demo protocol](demo.md) for conditions.

Observed on 14 October 2026, macOS arm64, Node 24.13.0, pnpm 10.34.5, Docker 29.8.0,
PostgreSQL 17.6, Chromium 156.0.8078.4 (Playwright 1.64.1):

- Formatting, ESLint, TypeScript, API/shared/web builds: passed.
- Unit tests: 2 passed, none skipped.
- Real PostgreSQL/HTTP tests: 15 passed, none skipped.
- Compiled Chromium browser tests: 9 passed, none skipped.
- The normal/production-mode control separation was executed, not just inspected.
- CLI lost-response demonstration returned a persisted identifier and exact 201 replay.
- A dependency audit reported zero production advisories at the time of examination.
- Gitleaks scanned working-tree content before commits; history scan is required before push.

The [review](review.md) records corrected material findings and remaining coverage limits.
Raw sanitized local output and browser-case results are stored under `evidence/`.
The socket-hang-up trace in the output is the intentional lost-response experiment.
Timing values describe one execution and are not a performance benchmark.
