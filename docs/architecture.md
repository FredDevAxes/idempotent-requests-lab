# Architecture and decisions

pnpm coordinates two TypeScript apps and a small contract package. NestJS owns HTTP;
React/Vite owns the demo. Shared Zod validation supplies normalized types. No extra
monorepo orchestration or ORM is needed for two apps and one explicit transaction.
SQL remains visible so the lock and commit boundaries can be inspected.

## Durable transaction

```mermaid
sequenceDiagram
  participant C as Client (saved key and payload)
  participant A as API instance
  participant P as PostgreSQL
  C->>A: POST key + payload
  A->>P: BEGIN + bounded local timeouts
  A->>P: INSERT key ON CONFLICT DO NOTHING
  alt New key
    A->>P: INSERT intervention
    A->>P: UPDATE key with status/body/completed_at
    A->>P: COMMIT
    A--xC: Demo destroys socket after commit
    C->>A: Retry same key and payload
    A->>P: Read recorded response
    A-->>C: Same 201 and request identifier
  else Existing key
    A->>P: SELECT key FOR UPDATE
    A-->>C: Stored 201 or 409 content conflict
  end
```

The unique primary key arbitrates even between API processes. At READ COMMITTED,
ON CONFLICT waits for the competing insert; the subsequent statement sees the committed
row. SELECT FOR UPDATE protects replay from an overlapping purge. If a purge deletes
the row between those statements, respond 503 and let the caller retry. This keeps
recovery bounded without a recursive retry loop. The business object is retained
independently of the key. Purge has the same lock/statement bounds.

A connection is released in `finally`. COMMIT errors are treated as uncertain, never
as proof of rollback. Retrying resolves the outcome using the stored key. The clock
is sampled at transaction completion; normal operation uses wall time, while tests
advance a controlled clock without sleeping 24 hours.

Fault hooks pause **after writes and before commit**, announce arrival at a barrier,
and resume only when released. A 10-second watchdog prevents forgotten demo gates
from keeping a transaction open indefinitely. Tests verify visibility from a separate
connection before release, and use pg_stat_activity to observe a waiting contender.
The lost-response hook destroys the real HTTP socket after commit, not a UI message.

## Design direction

The interface is a maintenance dispatch worksheet: cool white (#f5f8fc), deep marine
(#173352), slate (#40556b), signal blue (#165bb6), confirmation green (#176144) and
error red (#a52b37). A Georgia headline suggests a service log; the system sans-serif
keeps form controls readable without downloading fonts. Left-aligned form and attempt
ledger share a wide workspace; persisted records span the page below. Narrow screens
stack these in task order. The meaningful visual device is the attempt timeline, whose
numbers correspond to actual sends. Technical controls sit in a separate details panel.
No decorative metric cards, gradients, stock assets or automatic motion are needed.

## Sources and versions examined

Versions are fixed in package manifests, `.nvmrc`, the lockfile, Compose and CI.
Registry metadata was checked before installation; this lab deliberately uses NestJS 11
and Vite 7 rather than changing major versions during implementation.

- [Node 24.13.0 LTS](https://nodejs.org/en/blog/release/v24.13.0)
- [NestJS databases](https://docs.nestjs.com/techniques/database)
- [Vite prerequisites](https://vite.dev/guide/)
- [pnpm workspace support](https://pnpm.io/workspaces)
- [PostgreSQL 17 INSERT / ON CONFLICT](https://www.postgresql.org/docs/17/sql-insert.html)
- [PostgreSQL locks](https://www.postgresql.org/docs/17/explicit-locking.html)
- [Playwright setup](https://playwright.dev/docs/intro)

Authentication and tenant-bound keys would be needed for a shared service. External
effects would require additional design (for example a transactional outbox); this
transaction alone does not protect them. No performance benchmark is claimed.
