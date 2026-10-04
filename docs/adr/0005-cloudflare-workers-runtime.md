# ADR 0005: Cloudflare Workers runtime

Status: Accepted
Date: 2026-10-04

## Context

TalentBay is moving from a Vercel-only deployment toward one responsive Nuxt
product that also runs as a Telegram Mini App. The product should keep
PostgreSQL as its source of truth and remain a modular monolith until a workload
has a concrete reason to be extracted.

Cloudflare Workers is the target application runtime. Cloudflare Workers Assets
can serve the Nuxt public output while the Worker runs SSR and server routes.

## Decision

1. Keep one Nuxt application for desktop web, mobile web and Telegram.
2. Target Cloudflare Workers rather than creating a separate Telegram service.
3. Keep the existing Vercel deployment operational during migration.
4. Add an explicit Cloudflare build target and Wrangler configuration.
5. Add `/api/health` for process/runtime liveness and `/api/ready` for
   dependency readiness.
6. Keep PostgreSQL/Drizzle. Do not migrate core relational data to D1.
7. Add Hyperdrive in a follow-up change that makes database access
   request-scoped on Workers.
8. Keep GitHub Actions as the deployment orchestration layer.

## Why Hyperdrive is a separate follow-up

The current database helper caches a Postgres.js client globally. That lifecycle
is suitable for the current Node/Vercel deployment but must not be copied to
Workers: Worker I/O objects cannot safely be reused across request contexts.

The Hyperdrive change therefore needs an explicit request-scoped database
adapter rather than only swapping a connection string.

Postgres.js through Hyperdrive must use prepared statements; the existing
`prepare: false` setting is retained only for the current direct transaction-
pooled Neon connection until the adapter is changed.

## Consequences

- `pnpm build` continues to produce the current default deployment output.
- `pnpm build:cloudflare` builds the Cloudflare preset.
- `pnpm preview:cloudflare` runs the built Worker through Wrangler locally.
- `pnpm deploy:cloudflare` is available for manual/CI deployment once the
  Cloudflare account and secrets are configured.
- `.dev.vars` is the local Wrangler secret file and is never committed.
- Cloudflare observability is enabled in Wrangler configuration.
- The migration is incremental; this ADR does not claim Hyperdrive or
  production Cloudflare deployment is complete.
