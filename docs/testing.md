# Risk-based test plan

| Risk                                     | Executed suite responsible for proof                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Inconsistent normalization or validation | Unit tests of the shared contract                                                                                  |
| Duplicate creation / wrong replay        | HTTP integration against real PostgreSQL; two API instances                                                        |
| Conflicting content races                | Sequential and concurrent HTTP integration + browser conflict                                                      |
| Partial writes / lost response           | Deterministic pre-commit barrier, rollback hook, real socket destruction                                           |
| Memory-only recovery                     | Child API process stop/restart with the same database                                                              |
| Lost client intent                       | Browser reload after unknown result and retry                                                                      |
| Premature expiry / purge boundary        | Controlled clock and persisted row counts                                                                          |
| Unbounded wait                           | Barrier + observed PostgreSQL lock wait + 503 then recovery                                                        |
| Exposed demo tools                       | Default and production modes reject controls and fault headers                                                     |
| Misleading guided conclusions            | All six lessons, unavailable reads, isolated experiment counts and legacy-session preservation                     |
| Unexpected navigation / restart          | Completion and explicit restart in each of six scenarios; selected fragment retained, no new POST or deleted rows  |
| Misleading exchange motion               | Pending POST and independent GET gates; bounded animation, no replay on reload/navigation/controls; reduced motion |
| Unusable UI                              | Chromium desktop/mobile, keyboard, 200% layout, reduced motion and axe                                             |

Integration tests create an isolated schema and drop it at completion. Browser tests
use their own schema, reset between cases, then drop it. Never point these tests at a
shared database. Tests run without skipped cases. Each scenario checks persisted effects;
HTTP status alone cannot establish atomicity. Chromium is the automated browser target.
VoiceOver and other browsers remain outside the automated coverage and are disclosed.

## Documentation capture checks

`pnpm docs:capture` uses a separate Playwright configuration and the same isolated
server lifecycle. Before saving each screenshot it checks actual attempt counts,
GET-observed record counts and horizontal overflow. It also verifies the conflict
keeps routine priority. The optional recording follows a real lost reply and retry.
CI runs this capture path after the regression suite. This is visual evidence generation,
not an addition to the 49-case regression total.
The [manifest](visuals/manifest.json) records the runtime revision and capture conditions.
