# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Visitors unfamiliar with idempotency, discovering the lab through an accompanied
demonstration. The presenter should be able to guide one action at a time and explain
its outcome. Technical visitors can inspect a separate controls and evidence tab.

## Product Purpose

Show why retrying a request after an uncertain response can create duplicates, and
how preserving one request key lets the API recover the same saved intervention.
Success means the visitor understands what was sent, what the server saved, what the
client knows, and why a retry is safe within the documented retention boundary.

## Operating Context

A fictional maintenance request in a local NestJS, React/Vite and PostgreSQL lab.
Real persisted requests and actual HTTP attempts support the demonstration. The
user has requested a complete interface redesign with guided scenarios, simple
results and a dedicated technical tab. The API contract remains authoritative.

## Capabilities and Constraints

Preserve durable keys and payloads across attempts and reloads, exact replay,
conflicts, concurrency, pre-commit rollback and real post-commit response loss.
Two distinct keys are separate intentions. Keys are retained until explicit purge
with a minimum 24-hour retention. No external effects, authentication or deployment.
Local fault and reset controls are disabled by default and in production.
Existing browser sessions and database rows must not be silently discarded.
All public repository content remains in English; no French localization is requested.

## Evidence on Hand

A verified v0.1.0 API contract and PostgreSQL tests, compiled-browser journeys,
actual screenshots and public CI. New interface results must continue to come from
real API/database activity. No simulation may pretend a business operation succeeded.

## Product Principles

- Start with the visitor's situation before introducing the technical term.
- Reveal one useful action at a time during the accompanied demonstration.
- Explain client uncertainty separately from actual server persistence.
- Keep expert controls and raw identifiers in their own tab.
- State the retention boundary alongside conclusions about safe retries.

## Accessibility & Inclusion

Support keyboard operation, clear focus, status announcements, readable contrast,
mobile reflow, 200% text enlargement and reduced motion. Chromium is the automated
browser target; no complete screen-reader certification is claimed.
