# Interface review

## Current scenario workspace — v0.3.1

The current interface has one page per scenario and a bottom technical panel, collapsed
by default. The introduction stays beneath the title. Only the scenario navigation
changes cases; the final action restarts the same case. Exchange motion is tied to
actual POST sends and outcomes, with independent GET evidence for saved records.

The [visual tour](visual-tour.md) documents this interface. Desktop and mobile captures
show actual completed outcomes, unknown replies, rollback and the integrated technical
panel. Existing browser checks cover all six cases, keyboard, axe, 200% text reflow,
manual navigation, preserved data, reduced motion and exchange lifecycle. See
[verification.md](verification.md) for execution records and the source revision.

The earlier C design review and its mechanically open responsive comparison gate are
historical records. Updated documentation does not claim a new independent audit,
pixel-exact approval or complete accessibility certification.

## Guided interface review — historical v0.2.0

A fresh Impeccable finish reviewer examined the complete guided interface against the
confirmed accompanied-use brief and development-only direction contract. It validated
the six-step topology, separate technical tab, observation comparison, preserved-session
explanation and the captured desktop/mobile/in-app/200% adaptations.

The initial disposition was **fix** with two material findings:

1. After a content conflict, the footer described a saved request as returned. The
   footer now distinguishes refusal, rollback, separate intention and accepted replay.
   Browser assertions verify that the conflict keeps the original priority and does
   not say a response was returned.
2. Display headings inherited the system face. Atkinson Hyperlegible Next Variable
   5.3.0 is now self-hosted through Fontsource; its rendered use and narrow-width reflow
   are tested, and OFL-1.1 is retained with the public assets.

The focused verdict scored both corrections **resolved**, with disposition **ship**.
No material regression was observed in that fix batch. This UI finish review is not
an independent security or complete accessibility audit.

## API review — historical v0.1.0

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
