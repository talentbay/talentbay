# TalentBay Roadmap

Last updated: 2026-10-03

This roadmap orders work by dependency. It is not a promise of calendar dates.

## Phase 0 — Align Candidate Product Design

Goal: one implementation-ready candidate product specification for desktop web, mobile web
and Telegram.

- audit current website screens against Telegram Mini App flows;
- define responsive behavior for Jobs, Vacancy Detail, Saved, Relocation, Applications,
  Profile and Settings;
- preserve Telegram-only host behavior behind a platform adapter;
- consolidate shared Figma components and remove duplicate web/mobile component concepts;
- document responsive breakpoints, interaction states, state ownership and implementation
  gaps in the active candidate specification and handoff.

Admin/content-management design is deliberately deferred until Phase 6. Archived
employer/admin concepts are reference only and must not be extended during the current
candidate implementation phase.

Exit condition: Candidate Design v1.0 is frozen and implementation-ready, with one responsive
specification for desktop, mobile web and Telegram WebView.

## Phase 1 — Architecture & Cloudflare Foundation

- add architecture ADR(s) for unified responsive web/Mini App;
- add Wrangler/Cloudflare configuration;
- configure Nuxt Worker target;
- add health/readiness endpoints;
- introduce runtime environment/binding abstraction;
- connect PostgreSQL through Hyperdrive;
- separate runtime DB connection from migration connection;
- preserve local development with direct PostgreSQL;
- add preview and production environment configuration.

Exit condition: current application can run locally and as a Cloudflare Worker against an
isolated database.

## Phase 2 — CI/CD & Environments

- retain existing typecheck/lint/unit/build gates;
- add Cloudflare preview deployment for pull requests;
- add production deploy from `main`;
- create isolated preview/staging database strategy;
- add migration step with explicit safety checks;
- run production smoke checks after deployment;
- wire integration tests when the isolated DB environment is available;
- enable Cloudflare logs/observability.

Exit condition: repeatable branch → preview → main → production pipeline.

## Phase 3 — Unified Auth

- redesign users/auth identities for multiple providers;
- add TELEGRAM identity;
- validate Telegram initData server-side;
- create/link TalentBay sessions from Telegram;
- keep Google and GitHub web sign-in;
- support safe account linking;
- remove assumptions that every product user originates from OAuth email;
- update/review auth dependencies and OAuth state handling.

Exit condition: one user can enter through Telegram or web OAuth and reach the same account.

## Phase 4 — Responsive Candidate Product

Implement from Candidate Design v1.0 and the active Figma handoff:

- responsive application shell/platform adapter;
- Jobs search/filter/sort;
- Saved;
- Vacancy Detail;
- relocation calculator;
- application preflight/review/submit;
- Applications;
- Profile;
- Settings;
- onboarding/deep links;
- global system states;
- Telegram theme/safe-area/BackButton/haptics integration.

Exit condition: the same deployed URL is usable as desktop site, mobile site and Telegram
Mini App.

## Phase 5 — Server-backed Saved & Notifications

- add saved-vacancy database relation/API;
- migrate compatible local saved slugs after authentication;
- add notification preferences;
- add Telegram bot Worker/webhook;
- add Queue-backed notification delivery;
- application-status notifications;
- matching-job notifications after matching criteria are defined.

Exit condition: Saved syncs between devices and notification opt-in delivers real events.

## Phase 6 — Admin & Content Operations

### Design gate before implementation

Before Phase 6 application code begins:

- design the responsive admin shell in Figma;
- define dashboard, vacancies, imports, relocation data, users/roles and operational/audit
  states;
- define bulk import UX for file upload, field mapping, validation, preview, dedupe and
  review/publish;
- reuse the active TalentBay design system rather than reviving archived employer/admin
  concepts;
- review admin flows against current backend contracts before implementation.

### Admin shell

- dashboard;
- vacancies;
- imports;
- relocation data;
- users/roles;
- audit/operational status.

### Bulk vacancy import

Primary workflow:

1. upload CSV/XLSX;
2. detect columns;
3. map fields;
4. validate rows;
5. show errors/warnings;
6. preview normalised records;
7. deduplicate/idempotency check;
8. import into DRAFT/UNREVIEWED;
9. review;
10. publish selected records.

Manual create/edit remains available for exceptions and corrections.

### Later ingestion

- reusable import adapters;
- source-specific integrations;
- scheduled sync Worker;
- Queue-backed processing for large imports;
- import history and audit trail.

Exit condition: operators can add/update realistic content at scale without hand-entering
every vacancy.

## Phase 7 — Data Quality & Relocation

- replace demo relocation figures with reviewed datasets;
- source provenance and review workflow;
- stale-data handling;
- country/city coverage expansion;
- only then consider household/lifestyle/custom-rent calculator inputs.

Exit condition: relocation output is based on reviewed, attributable data.

## Phase 8 — Organisation/Employer Self-service

Only after admin-managed operations are stable:

- organisation accounts/members;
- employer vacancy management;
- application review workflows;
- invitations/permissions;
- organisation audit trail.

## Phase 9 — Scale-driven Service Extraction

Evaluate actual bottlenecks and extract only justified workloads.

Likely candidates:
- Telegram bot;
- notifications;
- vacancy ingestion/sync;
- heavy import processing.

Use Cloudflare Queues and Service Bindings rather than introducing public internal APIs by
default.

## Explicit non-goals for the immediate phase

- separate website and Telegram frontend repositories;
- rewriting PostgreSQL to D1;
- splitting every domain into a microservice;
- forcing profile completion on onboarding;
- requesting Telegram write access on first launch;
- inventing unsupported relocation inputs;
- designing or implementing admin before its Phase 6 design gate;
- building employer self-service before admin ingestion works.
