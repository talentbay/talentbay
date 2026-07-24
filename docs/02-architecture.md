# Architecture

Last updated: 2026-07-24

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

## Data

- PostgreSQL is the production source of truth.
- Drizzle schema and migrations are committed.
- Public vacancy reads use PostgreSQL when `DATABASE_URL` exists and an explicitly labelled preview dataset otherwise.
- Imported vacancies are idempotent by `(sourceName, sourceExternalID)`.
- Imported records enter `DRAFT` and `UNREVIEWED`; only `VERIFIED` records can be published.
- Relocation reads prefer `VERIFIED` PostgreSQL records and expose source provenance, review status and effective dates; demo cities remain labelled fallback data.

## Auth and Authorization

- OAuth-first through Google and GitHub.
- OAuth identities map to permanent local users.
- Server session shape is normalized and typed.
- Candidate profile/application endpoints require a user session.
- `/api/v1/admin/**` requires the `ADMIN` role in server middleware.
- Admin pages also declare role metadata for client navigation.

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

- No real PostgreSQL environment has been connected or integration-tested.
- OAuth cannot be verified end to end until database and provider callback URLs are configured.
- The relocation calculator uses demo figures until approved sources are loaded and reviewed.
- Company self-service is deferred; admin-managed vacancy ingestion is the first workflow.
- The main CSS entry is about 197 kB before gzip (about 29.5 kB gzip), primarily Tailwind and Nuxt UI.
- Public legal documents are pending founder/legal approval and block production launch.
