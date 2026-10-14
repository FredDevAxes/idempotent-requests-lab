# API contract

A fictional intervention consists of `site`, `description` and `priority` (`routine`
or `urgent`). Strings are Unicode NFC, trimmed and whitespace-collapsed. Unknown
fields are rejected. Site length is 2–80, description 5–500 after normalization;
raw inputs are bounded to four times these lengths. JSON property order is irrelevant.
A SHA-256 hash of an explicitly ordered normalized JSON object is compared.

`POST /interventions` requires an `Idempotency-Key` UUID v4. Keys are lowercased.
Validation happens before acquiring a connection or writing. A successful creation
returns 201 with `{request: {id, site, description, priority, createdAt}}`.
The same key and normalized content returns that same status and JSON body.
A different content under an existing key returns 409. Two different keys represent
two intentions, even with identical content. There is no user/tenant scope in this lab.

Concurrent callers wait on PostgreSQL's unique index, at most 750 ms per lock and
3000 ms per statement. A lock/statement timeout returns 503 with `Retry-After: 1`.
The caller keeps its key and payload and retries. Database connection acquisition is
bounded to 3000 ms; infrastructure failures return 503 without claiming a commit failed.
No failure result is cached. If the commit outcome is unknown, retry the same key.

The key reservation, business row and 201 response are committed together.
An injected pre-commit failure rolls back all three. A lost response after commit
leaves a durable success to replay. A restart uses PostgreSQL, with no memory cache.

Keys are retained for **at least 24 hours after completion**. They do not automatically
expire: existing keys continue replaying until an explicit purge deletes entries with
`completed_at <= now - 24h`. Purging does not remove interventions. A purged key may
create another request. Operators must treat this as the boundary of the guarantee.
The normal API exposes no purge, reset or fault route. The local demo exposes a purge
and a monotonic test clock. Never confuse a missing response with a failed write.

`GET /interventions` lists up to 100 newest persisted requests. `GET /health` verifies
PostgreSQL. `GET /config` reports whether local demo controls are enabled.
Validation: 400; content conflict: 409; retryable infrastructure/fault: 503.
Bodies contain public messages only. There are no external side effects, payments,
emails or universal exactly-once guarantee.

## Local controls

Disabled by default. `LOCAL_DEMO=true` is honored only outside `NODE_ENV=production`;
the server listens on 127.0.0.1. Routes are under `/demo`; headers start with `X-Lab-`.
Normal mode rejects any fault headers and returns 404 for every control route.
The isolated schema contains only this lab's tables; reset requires explicit confirmation.
Use on a trusted workstation only: loopback and lack of authentication do not protect
against other local processes. Vite proxies only to the loopback API.
