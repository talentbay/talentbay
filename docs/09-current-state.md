# Current State

Last updated: 2026-11-20

## Current handoff: 20 November

| Surface | Observed state | Next acceptance |
| --- | --- | --- |
| Primary website | Public API returns a verified catalogue with zero published jobs. Relocation returns 4 locations and 12 destination entries. An empty catalogue is not a database outage. | One current employer-authorized listing, reviewed and published through the operator workflow. |
| Candidate web / Mini App | One responsive Nuxt app covers Jobs, Saved (device-local), relocation, profile and managed applications. Native Profile/Applications were previously confirmed on the **tester** bot. | Verify the **primary** bot separately. No inference about native login from a public capabilities flag. |
| Operator | CSV validation, draft import, review/publish and candidate application handling exist. No new parser is required for the first authorized listing. | Rehearse one approved listing and the operator review before the public pilot; no production candidate data for testing. |
| Release | Consolidated MVP PR #65 was merged. A clean frozen install at main `a34d59a` failed on a duplicate YAML key, and its general build called a schema migration. | Review the reconciled security/build fix, run clean CI, and obtain a separate release decision. |

The dated sections below are history, not instructions to deploy or reset any environment.

## Repository Reconciliation — 17 November

Later17November: security topic codex/mvp-dependency-security updates Nuxt4.6.4/Nitro2.13.6/
schema4.6.4 and Nodefloor22.23.5. Final local206unit/44tooling/95SQL/20public+46DB-browser,
types/lint/builds/smoke/recovery PASS;4reviewed tooling audit findings remain,0high/critical.
See docs14/16 for the reproduced raw-path fix and independent review, not zero-risk claims.
Externally merged Dependabot63 is now main99b2f0c. Fresh GitHub Vercel deploymentSUCCESS
and primary /jobs200/health200/DEMOcatalogue verified11:18–11:19UTC; prior404 no longer
reproduces. Repo PUBLIC/Hobby screenshots replace the earlier private/unknown-plan snapshot.
Agent did not merge main or publish a deployment. Full MVP PR65 remains open/non-draft;
the old test alias/runtime below is separate. New topic publication/CI: docs14.

The current review line is `codex/mvp-integration`, combining source-rights43f74aa with
baseline25 reconciliation5f5f3b5 and main57b03a0. One draft integration-to-main PR replaces
the cumulative human queue after exact-head ancestry verification; source branches remain.
Dependabot63 has unique newer security updates and remains a separate release gate.
Main/provider deployment is not changed by this cleanup. PR24 Cloudflare preparation is
now in main; its configuration/build check are preserved, not a Worker launch decision.
The runtime/product table below is the16November snapshot unless separately dated.

## Current MVP Line — 16 November

This checkout is the unmerged MVP stack, not current main. One responsive Nuxt product
serves desktop/mobile web and Telegram Mini App; the bot is an entry/webhook adapter,
not a second frontend or separately hosted application.

Installed/locked local runtime verified: Nuxt4.6.2/Vue3.5.44/Nitro2.13.4, TypeScript6.0.3,
Nuxt UI4.10.0/Tailwind4.3.3/Lucide, Node22.23.1/pnpm10.33.0, Drizzle0.45.2/Postgres.js3.4.9,
nuxt-auth-utils0.5.32. PostgreSQL/Neon is the data layer; no Cloudflare/D1/ClickHouse/Web3
runtime is required. No packages were upgraded for the16 November source hardening.

| Part | Where | Actual state |
| --- | --- | --- |
| Candidate web/Mini App | app/pages, components, composables; product-host client adapter | Catalogue/detail/search, local Saved, profile, managed Apply, progress/withdrawal and relocation UI implemented; native sign-in/Profile/Applications owner-confirmed28Oct, not re-certified today |
| API/domain | server/api/v1, server/services, shared/types | Auth/local identities, vacancies, profiles, applications, manual operator handling, source runner, relocation and counters implemented |
| Operator | /ktulhu/v1; server/services/admin | CSV/JSON dry-run/import, review/publish/archive, source controls, application queue/handling/export and operational metrics; not a complete redesigned admin product |
| Persistence | server/db/schema, server/db/migrations | PostgreSQL/Drizzle, migrations0000..0009; restricted review-runtime role previously configured; no shared SQL changes this checkpoint |
| Ingestion | server/services/sources | Lever connector/runner implemented;16Nov hardening b7e00be/draft64 is facts-only, mandatory explicit rights record; live registry empty/schedule off, Greenhouse/Workday not implemented |
| Hosting/process | Vercel review project; GitHub Actions | Review alias deployed15b8ca3, not16Nov code. Consolidated integration-to-main review uses existing CI filters; old stacked PR checks are historical |

Fresh anonymous HTTPS16Nov: review/jobs200/noindex, Telegram capability true, Google/GitHub
false, profile401/admin403. First catalogue request500, one repeat200 with5explicit DEMO rows.
Neon preview compute observed active; runtime logs show generic500 then200, not a proven
root cause/cold-start fix. Main talentbay.org still404/DEPLOYMENT_NOT_FOUND. No provider,
schema/data, domain, paid-plan or rollout operation made in this check.

Not an accepted production MVP: approved vacancy sources, reviewed city/tax data,
privacy/terms/retention/operator acceptance, consolidated main/CI release and full human
candidate→TalentBay-operator walkthrough remain. Demo Apply stays disabled. CV upload,
employer self-service, proactive notifications, token/ICO/payments/custody are not this MVP.
Exact current tests/review/PR and continuation: [execution log](14-mvp-execution.md).

## Historical Snapshots

The October/July sections below describe their dated branch/environment, not this MVP line.

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
