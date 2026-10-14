# Final code and accessibility review

Reviewed the API transaction, SQL migration, request normalization, HTTP fault/control
boundary, client persistence, process recovery, purge and browser-test isolation using
the engineering code-review and accessibility-review procedures. This is an agent
review plus executed checks; it is not an independent audit or accessibility certification.

| Dimension       | Assessment within this local prototype                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Security        | Acceptable for trusted local use; parameterized SQL, validated schema name, bounded inputs, disabled-by-default tools; no authentication |
| Correctness     | PostgreSQL unique-key arbitration and atomic result storage verified through real HTTP and persisted counts                              |
| Performance     | Bounded lock/statement waits, pool size and newest-100 query; no load/performance claim                                                  |
| Maintainability | Explicit small transaction, shared input contract and root checks; no unneeded infrastructure                                            |

## Findings corrected before delivery

- `apps/web/src/main.tsx`: native anchor navigation overrode the skip link's focus.
  Prevented the default navigation and explicitly focused/scrolled to the first useful
  form control. The keyboard test now traverses and sends successfully.
- `packages/contracts/package.json`: CommonJS-only exports broke Vite compilation.
  Added conditional exports for API require and Vite's TypeScript import; both builds
  and the compiled browser suite pass.
- `scripts/browser-server.mjs:6`: test cleanup needed a guard against an ordinary
  lab schema. Refuse startup unless the schema is explicitly browser-test scoped.
- `apps/web/src/main.tsx:24`: reloading an in-flight first send could describe an
  already-sent intention as ready. A locked intention without a response is now
  unconfirmed; a barrier-based reload test proves safe recovery with the same key.
- `apps/web/src/main.tsx:109`: the conflict scenario appended text and could exceed
  validation limits. It now flips an allowed priority so custom valid input still
  produces a content conflict.
- `apps/web/src/style.css`: attempt-number markers had fixed dimensions at enlarged
  text size. Relative dimensions now keep the markers readable during reflow.
- `package.json`: check ordering initially required generated contract declarations
  before the build on a fresh CI checkout. The root check now builds before type checks.

## Positive observations

`apps/api/src/service.ts:23` groups the reservation, request and result in one transaction;
`service.ts:59` delegates ownership to the database's unique constraint. The replay
read locks the existing row against purge. Exceptions release connections and do not
assert that an uncertain commit failed. Fault injection destroys the actual socket
after success rather than inventing a front-end failure. Inputs are validated before
writes; conflicts and invalid requests leave row counts unchanged in executed tests.

Real desktop/mobile screenshots were inspected. Automated Chromium keyboard navigation,
landmark/label/contrast scan, reduced motion and 200% text/reflow checks pass. The
palette uses dark text on light surfaces and visible focus outlines; feedback has
live status regions and is not communicated by color alone. Native browser zoom,
VoiceOver and other screen readers remain unverified. No unresolved material finding
was identified within the documented local scope.
