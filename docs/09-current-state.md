# Current State

Last updated: 2026-10-06

## October reconciliation

July backend and partial UI exist in current main. Candidate v1.0 is frozen design, not a
complete implementation. Telegram-only auth/new identities/explicit linking are absent;
current OAuth auto-links verified provider email. No new auth capability is claimed.

PR #25 remains unmerged; deployed commits are older than main and PR #25. Neon branch IDs
have been discovered, but archived metadata is not SQL/runtime/schema/data readiness.
Vercel metadata access is partial, not wholly absent; Node 24.x differs from Node 22 CI.
Baseline OAuth 0.5.29, changed re-import exposure and delayed admin revocation were recorded
risks. Separate M2.1 patch status/evidence is in the execution log, not a deployed fix.
See `docs/14-mvp-execution.md` for dated sources/SHA and `docs/roadmap.md` for delivery order.

The sections below preserve the **2026-07-29 snapshot**, not fresh October verification.

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
- Separate Neon `production` and `preview` branches; local development and
  Vercel Preview use `preview`.
- Separate Neon `integration` branch with self-cleaning service-level workflow
  tests.
- Idempotent `pnpm db:seed:preview` workflow with five preview vacancies.
- Dry-run-first `pnpm db:promote-admin` operation for an existing OAuth user.
- CI, typecheck, ESLint, Vitest and production build.
- Nuxt 4.5.1, Vue 3.5.40 and a refreshed lockfile without the removed
  Bootstrap/Sass dependency tree.
- Responsive product UI and Figma concepts.
- Bootstrap/SCSS and unused ICO presentation components removed from the active build.
- Public Vercel production deployment at
  `https://talentbay-seven.vercel.app`.
- Vercel WAF rate limiting for `/api/` at 120 requests per 60 seconds per IP.
- Correlated API request/error logs with `x-request-id` and no request bodies,
  query strings, IP addresses, cookies or raw error messages.

Not yet verified end to end:

- OAuth callbacks on a deployed origin.
- Authenticated browser profile/application/admin workflows against the real database
  (July service-level integration passed; that is not a browser journey).
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
2. Add the Production callback to Google OAuth; GitHub accepts its current
   callback but still requires a manual login journey.
3. Founder/legal-approved Terms and Privacy Notice.
4. Approved vacancy sources and their usage/API terms.
5. Verified relocation sources for the selected cities.
6. Confirmation of the final first city/country set beyond the current working list.

## Verification Snapshot

Passed on 2026-07-29:

- `pnpm lint` with zero errors.
- `pnpm typecheck`.
- `pnpm test`: 25 tests.
- `pnpm build`.
- Neon connection as `neondb_owner` to PostgreSQL 18.4.
- Neon Preview branch cloned with two migrations and five preview vacancies.
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
- Protected Vercel Preview API smoke through authenticated `vercel curl`.
- Latest Preview deployment reached `READY` and returned all five records from
  the isolated Preview database.
- GitHub OAuth authorization endpoint accepted the current Production callback.
- Google OAuth returned `redirect_uri_mismatch`, isolating the remaining issue
  to provider-console configuration.
- Admin promotion parser is covered, and a missing user fails without changing
  data.
- `pnpm audit`: zero critical/high findings; one moderate and one low
  `esbuild` finding remain in development/build tooling.
- `pnpm db:generate`: schema is current with no migration changes.
- `pnpm test:integration`: admin import/review/publish and candidate
  profile/apply/list pass against Neon; post-run cleanup leaves zero test
  records.

## Historical July Release Path

1. Configure the Google callback and verify Google/GitHub OAuth.
2. Promote an explicitly approved user to admin and verify candidate/admin
   flows end to end.
3. Review the deployed product with the founder.
4. Approve legal copy, data sources and the commercial launch checklist.
5. Transfer/share `talentbay.org`, bind it to the Vercel project and repeat
   public smoke checks.

The current Vercel Production target is a technical MVP deployment, not approval
for a commercial launch.

The active path is now baseline/CI -> M2.1 -> early M4.1 -> unified auth -> Candidate ->
minimal content workflow -> verified beta; see `docs/roadmap.md`.
