# ADR-0002: OAuth-First Authentication

Date: 2026-06-09
Status: Accepted

## Context

The current codebase already uses `nuxt-auth-utils` with Google and GitHub OAuth handlers. Local password auth would require additional security work and is not necessary for the first MVP.

## Decision

Use OAuth-first authentication for MVP.

TalentBay DMCC stores local user records, roles, profiles, and provider links in PostgreSQL.

Local password login is not part of the first MVP.

## Consequences

- Less password-security surface area.
- Faster MVP implementation.
- Need account-linking rules for multiple providers.
- Need server-side RBAC checks because OAuth does not solve authorization.

