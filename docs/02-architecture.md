# Architecture

Last updated: 2026-10-06 (code/context reconciliation; not a new deployment verification)

## System Shape

TalentBay is a Nuxt 4 modular monolith:

```text
app/pages                 route-level UI
app/components            product and domain UI
app/composables           browser/client state
server/api/v1             thin HTTP handlers
server/services           business rules
server/repositories       persistence and preview-data selection
server/db/schema           Drizzle PostgreSQL schema
server/db/migrations       versioned SQL migrations
shared/types              shared transport and session contracts
tests                     unit tests for business rules
```

Splitting services or introducing a monorepo is not justified until a separate workload, ownership boundary or scaling requirement exists.

## Rendering

- Nuxt SSR is enabled globally.
- `/jobs/**`, legal status pages and public product surfaces are server-rendered.
- `/user/**`, `/orgs/**` and `/ktulhu/**` remain client-rendered because they are authenticated application surfaces.
- `/`, legacy landing, presentation and whitepaper routes redirect to `/jobs`.

Browser-only APIs must remain inside client lifecycle code.

## UI

- New product UI uses Nuxt UI 4, Tailwind CSS 4 and Manrope.
- Redirected legacy pages no longer compile their former Bootstrap/SCSS UI.
- New UI is grouped by domain within Nuxt directories rather than strict FSD.
- Figma is the review surface for foundations, components and page concepts.
- July UI is partial. Frozen Candidate v1.0 is a design contract, not fully implemented UI.
- Relocation preserves vacancy context/back state; handoff node `2078:35` does not require
  a new top-level route. See `docs/10-design-direction.md`.

## Data

- PostgreSQL is the production source of truth.
- Drizzle schema and migrations are committed.
- Public vacancy reads use PostgreSQL when `DATABASE_URL` exists and an explicitly labelled preview dataset otherwise.
- Imported vacancies are idempotent by `(sourceName, sourceExternalID)`.
- New imports enter `DRAFT` and `UNREVIEWED`; the publish action requires `VERIFIED`.
  Existing re-imports can retain `PUBLISHED` while resetting review to `UNREVIEWED`;
  public reads do not yet enforce the full review invariant. Early M4.1 fixes this separately.
- Relocation reads prefer `VERIFIED` PostgreSQL records and expose source provenance, review status and effective dates; demo cities remain labelled fallback data.

## Auth and Authorization

- OAuth-first through Google and GitHub.
- OAuth identities map to permanent local users.
- Existing Google/GitHub identities auto-link by verified provider email, not client email.
  Telegram-only auth, the new identity model and explicit linking are still planned.
- Server session shape is normalized and typed.
- Candidate profile/application endpoints require a user session.
- `/api/v1/admin/**` requires the `ADMIN` role in server middleware.
- Admin pages also declare role metadata for client navigation.
- Admin middleware trusts the session role; immediate revocation based on the current
  database role is not separately implemented.

Client route guards are UX only; server authorization is the security boundary.

## Current Domains

- `auth`
- `candidates`
- `organisations`
- `vacancies`
- `applications`
- `relocation`
- `admin`

## Known Constraints

- Neon service-level integration passed in July; that does not prove present readiness.
  October metadata shows archived branches; SQL/schema/data have not been reverified.
- Disposable PostgreSQL CI exists in unmerged PR #25; real browser auth journeys remain unproven.
- The reconciled baseline used OAuth dependency 0.5.29; the bounded M2.1 patch is tracked
  separately in `docs/14-mvp-execution.md`. Do not equate PR implementation with deployment.
- Vercel metadata Node 24.x differs from Node 22 engines/CI; do not change cloud settings implicitly.
- The relocation calculator uses demo figures until approved sources are loaded and reviewed.
- Company self-service is deferred; admin-managed vacancy ingestion is the first workflow.
- The main CSS entry is about 197 kB before gzip (about 29.5 kB gzip), primarily Tailwind and Nuxt UI.
- Public legal documents are pending founder/legal approval and block production launch.

Current SHA, provider evidence, checks and next task: `docs/14-mvp-execution.md`.
