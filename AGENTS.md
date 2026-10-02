# AGENTS.md

## Repository purpose

TalentBay is one product that should run as a responsive website and as a Telegram Mini
App from the same Nuxt codebase.

## Sources of truth

Read these before substantial changes:

1. `docs/09-current-state.md` — what exists now.
2. `docs/plan.md` — target product/architecture direction.
3. `docs/roadmap.md` — dependency order for upcoming work.
4. `docs/02-architecture.md` — current architecture until migrations in the plan land.
5. `docs/10-design-direction.md` and the TalentBay Figma file — design system/product UI.
6. relevant ADRs under `docs/adr/`.

When current-state docs and the plan differ, do not pretend the migration is already done.
Implement the next roadmap step or explicitly document the gap.

## Product architecture rules

- Do not create a separate Telegram frontend unless a later ADR explicitly reverses the
  current decision.
- Build shared responsive domain components for desktop, mobile web and Telegram.
- Keep Telegram APIs behind a platform/host adapter.
- Prefer a modular monolith for transactional product domains.
- Extract a Worker/service only for a real lifecycle, scaling, isolation or security reason.
- PostgreSQL remains the source of truth; do not move core relational data to D1 without
  an approved ADR.
- Preserve Drizzle migrations and explicit database migration procedures.
- Never trust Telegram `initDataUnsafe` for authentication; validate `initData` on server.
- Web OAuth identities and Telegram identity must resolve to local TalentBay users rather
  than creating incompatible account systems.

## Design rules

- Figma is the product-design review surface.
- Desktop and Mini App are variants of one responsive product, not two independent visual
  systems.
- Reuse existing TalentBay variables, text styles and components before adding new ones.
- Keep Telegram-specific chrome/behavior out of reusable domain components.
- Do not design functionality the backend does not support without clearly marking it as
  planned/future scope.

## Admin/content rules

- Bulk ingestion is the primary content-entry path; manual create/edit is an exception.
- Imports must be previewed and validated before commit.
- Imported vacancies enter controlled draft/review states and must not silently publish.
- Preserve idempotency/deduplication by source identifiers.
- Destructive/admin actions require server authorization; client guards are UX only.

## Git and change discipline

- Prefer small, coherent changes.
- Do not perform broad mechanical repository moves together with functional changes.
- Keep schema changes and migrations in the same reviewed change.
- Do not remove existing tests to make a change pass.
- Update relevant docs when architecture, auth, deployment, data contracts or workflows
  materially change.

## Required checks

For application-code changes run, as applicable:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Run integration/smoke tests when the required environment is available.

## Security

- Never commit secrets, connection strings, bot tokens or session passwords.
- Server authorization is the security boundary.
- Validate external/webhook inputs.
- Treat authentication/account-linking changes as security-sensitive.
- Keep production migrations, admin promotion and destructive operations explicit and
  reviewable.

## Current high-priority sequence

1. reconcile website and Telegram designs into one responsive system;
2. design admin/content bulk-import workflows;
3. Cloudflare/Hyperdrive foundation;
4. CI/CD previews and production pipeline;
5. unified Telegram + Google/GitHub identities;
6. implement responsive candidate product;
7. implement scalable admin/content ingestion.
