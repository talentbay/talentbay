# Current State

Last updated: 2026-07-29

## Product Status

TalentBay is a functioning Web2 MVP preview, not a production release.

Implemented:

- SSR vacancy catalogue, search, filters, sorting and detail pages.
- Clearly labelled preview vacancies stored in PostgreSQL, with an in-memory
  fallback when no database is configured.
- Relocation preview for four demo cities.
- Automatic use of reviewed PostgreSQL relocation records with source provenance when available.
- Google/GitHub OAuth handlers backed by local user records.
- Candidate profile form.
- Apply flow and application list.
- Admin vacancy import/review/publish/archive/flag workflow.
- Read-only admin user registry and real operational counters.
- PostgreSQL/Drizzle schema, indexes and migrations.
- Neon PostgreSQL 18.4 runtime with both migrations applied.
- Idempotent `pnpm db:seed:preview` workflow with five preview vacancies.
- CI, typecheck, ESLint, Vitest and production build.
- Responsive product UI and Figma concepts.
- Bootstrap/SCSS and unused ICO presentation components removed from the active build.
- Public Vercel production deployment at
  `https://talentbay-seven.vercel.app`.

Not yet verified end to end:

- OAuth callbacks on a deployed origin.
- Profile/application/admin workflows against the real database.
- Real vacancy ingestion from approved providers.
- Verified relocation data and tax models.
- `talentbay.org` domain binding.

## Active Product Boundary

- `/` redirects to `/jobs`.
- SaaS routes do not advertise token, ICO, payments or custody.
- Legacy presentation/whitepaper routes redirect to `/jobs`.
- Terms and privacy pages expose status only and are `noindex` until approved.

## External Blockers

1. Transfer or shared access to the Vercel scope that owns `talentbay.org`.
2. Google and GitHub OAuth callback configuration and a manual login account.
3. Founder/legal-approved Terms and Privacy Notice.
4. Approved vacancy sources and their usage/API terms.
5. Verified relocation sources for the selected cities.
6. Confirmation of the final first city/country set beyond the current working list.

## Verification Snapshot

Passed on 2026-07-29:

- `pnpm lint` with zero errors.
- `pnpm typecheck`.
- `pnpm test`: 15 tests.
- `pnpm build`.
- Neon connection as `neondb_owner` to PostgreSQL 18.4.
- `pnpm db:migrate`: both migrations applied successfully.
- `pnpm db:seed:preview`: idempotency verified, leaving exactly five
  organisations and five published preview vacancies.
- Main production CSS reduced from about 425 kB to about 197 kB before gzip.
- Public Vercel Production HTTP smoke:
  - `/` -> `302 /jobs`
  - `/jobs` -> SSR `200`
  - `/jobs/senior-backend-engineer-london` -> SSR `200`
  - `/api/v1/vacancies` -> five PostgreSQL records with `DEMO` provenance
  - `/terms` -> pending-review `200`
  - `/api/_auth/session` -> `200`
- Desktop width `1280` and mobile width `390` browser checks with no
  horizontal overflow.
- Mobile navigation exposes Jobs, Relocation, For companies and Sign in.
- Vercel runtime error scan after smoke requests returned no errors.

## Next Release Path

1. Isolate Preview/local database access from the Production Neon branch.
2. Configure provider callbacks and verify Google/GitHub OAuth.
3. Promote an explicitly approved user to admin and verify candidate/admin
   flows end to end.
4. Review the deployed product with the founder.
5. Approve legal copy, data sources and the commercial launch checklist.
6. Transfer/share `talentbay.org`, bind it to the Vercel project and repeat
   public smoke checks.

The current Vercel Production target is a technical MVP deployment, not approval
for a commercial launch.
