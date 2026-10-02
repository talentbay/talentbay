# TalentBay Product & Architecture Plan

Last updated: 2026-10-02

## Purpose

This document defines the target direction for the next TalentBay implementation phase.
It is a forward-looking plan. Existing numbered documents such as `02-architecture.md`,
`09-current-state.md` and `11-deployment-runbook.md` describe the current or historical
implementation until the corresponding migrations are completed.

## Product Shape

TalentBay should be one responsive product rather than separate website and Telegram
Mini App frontends.

The same Nuxt application must support:

- desktop browsers;
- mobile browsers;
- Telegram Mini App WebView.

The product routes and domain components should be shared. Platform-specific behavior
belongs in a host/platform adapter rather than duplicated pages.

Target candidate routes:

- `/jobs`
- `/jobs/:slug`
- `/saved`
- `/applications`
- `/profile`
- `/settings`

Desktop, mobile web and Telegram use the same domain UI with responsive layout changes.
Telegram adds host capabilities such as validated `initData`, BackButton, SettingsButton,
theme parameters, safe-area insets and haptics.

## Architecture Strategy

### Start as a modular monolith

Do not split transactional product domains into network microservices without a concrete
scaling, ownership or lifecycle reason.

Keep strong domain boundaries inside one application:

- auth
- users
- candidate profiles
- vacancies
- saved vacancies
- applications
- relocation
- organisations
- admin/content operations
- notifications
- integrations

This keeps local development, transactions, schema migrations and observability simple
while making later extraction possible.

### Extract workloads, not arbitrary domains

Separate Workers become justified when a workload has a genuinely different lifecycle.
Likely early candidates are:

- Telegram bot/webhook processing;
- notification delivery;
- scheduled vacancy ingestion/synchronisation;
- long-running or asynchronous import processing.

Cloudflare Service Bindings and Queues should be preferred for internal Worker-to-Worker
communication when these services are extracted.

## Runtime Target

Target deployment:

```text
Browser / Telegram
        |
        v
Cloudflare
        |
        v
Nuxt Worker
SSR + client UI + BFF/API + sessions
        |
        v
Cloudflare Hyperdrive
        |
        v
PostgreSQL (Neon initially)
```

PostgreSQL remains the source of truth. Do not migrate core relational data to D1 merely
to make the stack Cloudflare-native.

Potential later Cloudflare services:

- Queues: notifications/import pipelines;
- Cron Triggers: periodic vacancy refresh;
- R2: CVs and attachments if/when required;
- KV: small configuration/cache use cases;
- Workers Observability: logs and traces;
- Service Bindings: internal services.

## Database

Current Drizzle/PostgreSQL model is retained.

The runtime database adapter must become Cloudflare/Hyperdrive-aware. Current code uses
Postgres.js with `prepare: false` for transaction-pooling compatibility; the Worker
runtime adapter must be reviewed and changed for Hyperdrive rather than copied unchanged.

Separate concerns:

- runtime connection: Hyperdrive connection string;
- migration/maintenance connection: direct migration URL;
- schema/migrations: Drizzle, versioned and committed.

## Authentication & Account Linking

The current model is OAuth/email-first and is not sufficient for Telegram Mini App auth.

Target model:

```text
users
  id
  display identity / profile linkage
  ...

auth_identities
  id
  user_id
  provider            TELEGRAM | GOOGLE | GITHUB | ...
  provider_user_id
  provider_email?
  provider_metadata?
```

A single TalentBay user may link multiple identities.

Flows:

- Telegram Mini App: validate Telegram `initData` server-side, resolve/create identity,
  establish the normal TalentBay session;
- website: Google/GitHub sign-in remains available;
- account linking: multiple identities can resolve to the same local user.

Never trust Telegram `initDataUnsafe` as authentication.

Before OAuth work, update and review auth dependencies and callback/state handling.

## Saved Vacancies

Current Saved state is browser-local `localStorage` containing vacancy slugs.

Short term:
- keep the UX functional with local Saved state;
- preserve the same state across Jobs, Vacancy Detail and Saved.

Production target:
- add a server-backed user-vacancy saved relation/API;
- migrate local saved slugs into an authenticated account where possible;
- allow cross-device sync.

## Notifications

Notification UX is designed, but delivery infrastructure is not implemented.

Target path:
- ask for Telegram bot write access only after explicit user opt-in;
- persist subscription/category preferences;
- emit application/job events;
- process delivery asynchronously through a notification Worker/Queue.

Do not request notification permission at first launch.

## Admin & Content Operations

Admin/content management is a first-class product requirement, not only an internal
technical page.

The admin surface must support:

- dashboard and health/ingestion visibility;
- vacancy list with status/review/source filters;
- create/edit as an exception/manual correction workflow;
- bulk import as the primary workflow;
- import from CSV/XLSX initially; JSON may also be supported;
- import preview and field mapping;
- row-level validation with actionable errors;
- deduplication/idempotency by source/external ID;
- staged import into DRAFT/UNREVIEWED;
- review and publish workflow;
- archive/unpublish;
- relocation-data/source management;
- user/admin role operations with auditability.

Bulk import must never silently publish unreviewed content.

## Repository Direction

Keep the existing repository. A separate Telegram frontend repository is no longer
planned.

Long-term monorepo shape may become:

```text
apps/
  web/
workers/
  telegram/
  notifications/
  vacancy-sync/
packages/
  db/
  auth/
  domain/
  telegram/
  ui/
```

Do not begin by moving the whole existing Nuxt tree into `apps/web`. First establish
runtime/platform boundaries and Cloudflare deployment; perform a monorepo move later as
a dedicated mechanical change if it remains useful.

## CI/CD Target

GitHub Actions remains the orchestration layer.

Pull request pipeline:

1. install with frozen lockfile;
2. typecheck;
3. lint;
4. unit tests;
5. build;
6. deploy Cloudflare preview;
7. optional smoke checks against preview.

Production pipeline from `main`:

1. CI gates pass;
2. reviewed database migrations run;
3. deploy Worker;
4. production smoke checks;
5. rollback application deployment if required; database rollback/forward-fix remains a
   separate controlled operation.

Integration tests already exist and should be wired to an isolated database environment
when infrastructure is ready.

## Design Contract

Figma is the design source of truth for the product experience.

The website and Telegram Mini App must converge into one responsive design system:

- shared domain components;
- shared content hierarchy and interaction states;
- desktop composition at wide breakpoints;
- mobile composition at narrow breakpoints;
- Telegram-specific shell behavior as a host capability, not a separate product design.

Before implementation, audit existing website concepts against the completed Telegram
candidate flow and document responsive mappings and exceptions.

## Decision Rule for Microservices

Extract a module only when at least one is true:

- independent scaling is necessary;
- the workload is asynchronous or scheduled;
- failure isolation is materially useful;
- security boundary is materially different;
- deployment cadence/ownership is independent.

"Microservices may scale later" is not sufficient by itself.
