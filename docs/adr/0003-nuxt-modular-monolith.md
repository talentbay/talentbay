# ADR-0003: Nuxt Modular Monolith

Date: 2026-06-09
Status: Accepted

## Context

The codebase is already a Nuxt fullstack application. The team is small and the MVP needs speed. Splitting backend services now would add infrastructure and coordination cost.

## Decision

Keep Nuxt/Nitro as a fullstack modular monolith for MVP.

Use clear internal boundaries:

- API handlers are thin.
- Business logic lives in services.
- Database access is isolated.
- UI is grouped by domains within Nuxt conventions.

## Consequences

- Fast development and deployment.
- Fewer infrastructure moving parts.
- Future extraction remains possible if clear boundaries are maintained.

