# Current State

Last updated: 2026-07-23

## Product Status

TalentBay is a functioning Web2 MVP preview, not a production release.

Implemented:

- SSR vacancy catalogue, search, filters, sorting and detail pages.
- Clearly labelled demo vacancies when no database is configured.
- Relocation preview for four demo cities.
- Automatic use of reviewed PostgreSQL relocation records with source provenance when available.
- Google/GitHub OAuth handlers backed by local user records.
- Candidate profile form.
- Apply flow and application list.
- Admin vacancy import/review/publish/archive/flag workflow.
- Read-only admin user registry and real operational counters.
- PostgreSQL/Drizzle schema, indexes and migrations.
- CI, typecheck, ESLint, Vitest and production build.
- Responsive product UI and Figma concepts.

Not yet verified end to end:

- Real PostgreSQL migrations and DB-backed runtime.
- OAuth callbacks on a deployed origin.
- Profile/application/admin workflows against the real database.
- Real vacancy ingestion from approved providers.
- Verified relocation data and tax models.
- Vercel preview/production deployment and domain binding.

## Active Product Boundary

- `/` redirects to `/jobs`.
- SaaS routes do not advertise token, ICO, payments or custody.
- Legacy presentation/whitepaper routes redirect to `/jobs`.
- Terms and privacy pages expose status only and are `noindex` until approved.

## External Blockers

1. A managed PostgreSQL project and `DATABASE_URL`.
2. Access to the intended Vercel account/project.
3. Google and GitHub OAuth credentials with final callback origins.
4. Founder/legal-approved Terms and Privacy Notice.
5. Approved vacancy sources and their usage/API terms.
6. Verified relocation sources for the selected cities.
7. Confirmation of the final first city/country set beyond the current 11-city working list.

## Verification Snapshot

Passed on 2026-07-23:

- `pnpm lint` with zero errors.
- `pnpm typecheck`.
- `pnpm test`: 15 tests.
- `pnpm build`.
- Production-server HTTP smoke:
  - `/` -> `302 /jobs`
  - `/jobs` -> SSR `200`
  - `/api/v1/vacancies` -> demo response
  - `/terms` -> pending-review `200`

## Next Release Path

1. Provision/connect PostgreSQL and apply migrations.
2. Seed one admin and a small verified vacancy dataset.
3. Verify OAuth, profile, application and admin flows end to end.
4. Connect Vercel and produce a Preview deployment.
5. Review Preview with founder.
6. Approve legal copy, data sources and launch checklist.
7. Bind `talentbay.org` and deploy Production only after explicit release approval.
