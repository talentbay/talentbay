# Deployment Runbook

Last updated: 2026-11-20

## Primary release: schema first, build without database writes

On 20 November the primary public vacancy and relocation APIs responded successfully again.
Stas reported applying missing migrations. Main commit `a34d59a` also added migration to
the general build command; this change separates it again. Do not undo applied migrations.

1. For a release with schema changes, the release owner confirms the intended Neon branch,
   database and role, reviews the pending SQL and identifies a tested restore point and
   a previous application version compatible with the new schema. Rehearse on an isolated
   target first. Do not merge an incompatible app while the production schema is pending.
2. In the approved release environment only, set the direct `DATABASE_MIGRATION_URL`
   for that target and run `pnpm db:migrate` once. If it fails, stop; inspect the migration
   journal and do not promote the app. Do not put this command in Vercel's Build Command,
   package install hooks or a per-PR workflow against a shared database.
3. Build with `pnpm build`; the runtime uses the restricted `DATABASE_URL`. For a
   code-only change there is no schema step. After an approved deployment check the JSON
   responses from `/api/v1/vacancies?limit=1` and `/api/v1/relocation/locations`,
   not only `/api/health`. An empty verified catalogue is valid; a 500 is not.

## Primary Project Is Not the Review Project — 17 November

The owner confirms an existing GitHub `talentbay/talentbay` integration in the primary
Vercel project serving `talentbay.org`. This is owner-reported configuration, not a fresh
provider-settings read by the agent. The accessible Alex projects have `link:null`; this
does not establish whether the separate primary project is connected. Do not repeat that
inference or treat a missing GitHub Vercel check as proof that no external deploy ran.

Earlier17November HTTPS apex/www requests returned404/DEPLOYMENT_NOT_FOUND. Primary project/domain
management and its actual latest build logs remain inaccessible to the current connection.
The exact missing-target/build cause is not proven; a Nuxt code error or Hobby restriction
must not be asserted as the cause without the relevant evidence. Inspect the actual primary
project's Git, production branch, Domains and deployment logs, not only the test projects.

`codex/mvp-integration` consolidates the current MVP for one draft PR to main. Publishing
this review or closing superseded PRs does not authorize main merge, manual deployment,
domain changes, database migrations or billing. A main merge may trigger the owner's
production integration, so it remains an explicit release decision.

## Latest readiness

Recovery verified17November11:18–11:19UTC: main99b2f0c (external Dependabot63 merge) has
GitHub Production7851282427/Vercel SUCCESS at11:00UTC. talentbay.org/302→/jobs, /jobs200,
health200/runtimevercel and public catalogueDEMO now respond. The previous404 is historical,
not the current diagnosis. Full MVP PR65 is still open; do not confuse this main deployment
with new integration/security source. No agent production operation caused this recovery;
visibility/reconnect/newcommit changed externally and exact original cause was not isolated.

17 November owner screenshots confirm primary Hobby, Git connected to talentbay/talentbay,
Production main and Preview all unassigned branches. Team invitation is unavailable without
Pro; do not buy a plan or request the owner's account/token. Fresh GitHub API now reports
this repository PUBLIC, not the earlier private snapshot; the agent did not change visibility.
The documented Hobby restriction on private organisation repositories does not explain this
current public configuration. Remote codex/mvp-integration exists at57441af; missing Vercel
checks/comments do not prove failed Git sync. Obtain the actual branch-selection error or
first build failure from the owner. A bounded owner-driven Preview attempt can target that
branch via Deployments/Create Deployment without changing Production or main. Neither the
screenshots nor a successful local Vercel build establish the root cause of the primary404.
[Vercel Git deployments and Hobby rules](https://vercel.com/docs/git).

Use [release readiness](20-release-readiness.md) for the current verified checklist.
The owner-approved separate internal test project now serves
<https://talentbay-review.vercel.app/jobs>. Database is connected under a restricted role;
Test-bot settings and10 HTTPS security probes are verified;8 DB-backed API/UI checks repeated
PASS after enabling Telegram and again after auth recovery15b8ca3 (8 checks/30.3s).
Initial native login failed401; the fresh post-recovery sign-in/Profile/Applications check
passed according to the owner's28 October reply. Broader native/Apply/operator acceptance
is not implied.
Main project/domain and billing are unchanged. Exact source,
deployment, operations and pending gates are in docs14; sections below dated26 October/July
are historical, not a revocation of the separate28 October test-project permission.

## Current Review Project Boundary - 2026-10-28

- Scope `alexs-projects-76662c2b` / `team_cjyqd17DfaDhcsylDIgQmBTl`, Hobby, no paid changes.
- Only project `talentbay-review` / `prj_e1D1S2QPVCWeIQPD7ACbF08ydyuW`; no Git integration.
- Current deployment `dpl_8Wz9SXdX64hmMvDRNSa7W6RENqua`, source/runtime15b8ca3, draft #62.
- Auth-recovery rollback: prior test deployment `dpl_CBXZ9Kq4RhJwYevBKDWNEqMhHHrs`.
  No migration, provider env/menu/webhook or role/grant changes accompany this hotfix.
- Stable test alias is public; unique deployment keeps SSO. Do not weaken protection or
  put bypass/auth credentials in Mini App URLs. Noindex is not a privacy boundary.
- Runtime `DATABASE_URL` is the sensitive pooled connection for `talentbay_review_runtime`
  in the new `talentbay_mvp_preview` DB only. Owner explicitly approved its limited-role
  creation; earlier rejection/pending records are superseded. SQL role, no inherited/elevated
  memberships/CREATE/migration-journal rights; grants name only11 current tables/7 sequences.
  Do not recreate it via the Neon control-plane API, rotate an existing password or grant
  future objects automatically. Owner/migration credentials never belong in this runtime.
  Baseline PUBLIC privileges are unchanged. [Neon SQL vs control-plane roles](https://neon.com/docs/manage/roles),
  [PostgreSQL grant semantics](https://www.postgresql.org/docs/18/sql-grant.html).
- Five existing fixtures were validated/rehearsed then deliberately published only as DEMO;
  no users, profiles, applications or fake admin/reviewer were seeded. No real source fetched.
  Demo Apply remains disabled. The one-time seed requires an empty DB; do not reset/replay
  it against later user data. Use the existing reviewed operator import flow for new content.
  Separate session secret remains sensitive provider configuration; do not copy old env.
- Test bot getMe verified `@talentbay_tester_bot`/9279549942; token is now configured only
  in the new project and owner's ignored/mode600 `.env.preview-review.local`. Never request
  it in chat. Menu/private commands/webhook read-back matches docs28. Telegram capability
  true, Google/GitHub false. Native sign-in/Profile/Applications is owner-confirmed after
  recovery15b8ca3; other native clients, real Apply and operator flows remain separate gates.

For the next authorized review deployment, verify project ID/scope/source before publishing.
Build from clean environment without developer dotenv using pinned Node22/pnpm and Nitro's
Vercel preset; do not migrate/seed from a build hook. Run both output guards. After each build,
prepend this test-only rule to the generated `.vercel/output/config.json` routes using the
normal file-edit process (the build overwrites it). Do not apply it to the primary project:

```json
{"src":"/(.*)","headers":{"X-Robots-Tag":"noindex, nofollow, noarchive"},"continue":true}
```

Then use the verified existing CLI65.5.0 with explicit targets:

```bash
vercel deploy --prebuilt --prod --project prj_e1D1S2QPVCWeIQPD7ACbF08ydyuW --scope alexs-projects-76662c2b
```

Here `--prod` is only this isolated test project's Vercel label. It does not authorize
primary production promotion, domains, paid plans or public-beta outreach. Verify the stable
alias without credentials, noindex, private API rejection and relevant browser flows after
deployment. Do not claim guest tests prove authenticated DB/native/operator journeys.

Review-only rollback target is the prior guest deployment `dpl_7VyosvQp3LbjPryHWLoWYYGEvVph`;
its immutable runtime DB configuration is empty. Restore only this test project's alias if
needed. Changing a project env affects future deployments, not an already deployed runtime.
Retain role/data until separately approved cleanup; no destructive down-migration/drop/reset.

Bot-only rollback first removes only the tester webhook with drop_pending_updates=false,
restores menu type commands and the prior empty all_private_chats command scope, then restores
the prior DB-backed/no-bot deployment `dpl_Fa64rRp3SiwfssVLX9qoVy71mZSr`. Do not leave an active
webhook targeting an unconfigured runtime or discard updates/rotate credentials to simplify rollback.

## Historical Operating Boundary - 2026-10-26

The access/runtime results below are historical July observations unless dated otherwise.
October metadata, project/branch IDs and SHA are centralized in `docs/14-mvp-execution.md`.
Neon branches are archived; no SQL readiness was checked. Project reads without teamId
succeed, while explicit-team reads returned 404; this is partial access, not no access.
Hobby was independently reverified via team context. Node 24.x metadata differs from the
Node 22 code/CI baseline and needs an approved resolution before deployment.

This pass authorizes no deployment, domain/billing/settings changes, branch restoration,
shared migrations or seed. Commands here are runbook examples, not permission to execute.

## Historical Access State (2026-07-29)

- The repository branch `chore/sprint-1-cleanup` is published on GitHub.
- Local Vercel CLI authentication belongs to the `lattelix` account.
- A temporary Vercel project named `talentbay` exists in the personal
  `alexs-projects-76662c2b` Hobby scope.
- The current public demo is available at
  `https://talentbay-seven.vercel.app`.
- The demo is deployed directly with Vercel CLI and has no Git integration.
- `talentbay.org` uses Vercel nameservers but is managed in another Vercel scope.
- A valid `NUXT_SESSION_PASSWORD` is configured for Preview and Production.
- Google/GitHub OAuth credentials are configured for Preview and Production,
  but callback/login flows are not yet verified.
- Both OAuth handlers generate redirects to the expected providers.
- Neon PostgreSQL is connected to the Vercel runtime.
- The exposed Neon role password was rotated on 2026-07-29.
- Both Drizzle migrations are applied to the `production` Neon branch.
- Local development and Vercel Preview use a separate Neon `preview` branch
  cloned from Production on 2026-07-29.
- DB integration tests use a third Neon `integration` branch and an ignored
  `.env.integration`.
- Five explicitly labelled preview vacancies are stored in PostgreSQL.
- Vercel CLI deployments require the Git commit author email to match a user
  with access to the target Vercel scope. Repository-local Git author email is
  configured accordingly.

The personal Hobby project is only a temporary internal demo. Vercel Hobby is
restricted to personal, non-commercial use and cannot connect to a private
GitHub Organization repository. The commercial release must move to an
appropriate founder/company Vercel scope before `talentbay.org` is attached.

## Required Ownership

The target Vercel project should be owned by the founder/company team:

1. The team must support a private GitHub Organization repository and commercial use.
2. The Vercel GitHub integration must be authorized for `talentbay/talentbay`.
3. The CTO/deploying commit author needs project access so Preview deployments are not blocked.
4. `main` remains the Production branch.
5. Pull Request branches create Preview deployments.

## Environment Variables

Configure values independently for Preview and Production.

Required for every deployment:

```text
NUXT_SESSION_PASSWORD
```

Required for database-backed flows:

```text
DATABASE_URL
```

Required only by the environment that runs Drizzle migrations:

```text
DATABASE_MIGRATION_URL
```

Required for sign-in:

```text
NUXT_OAUTH_GOOGLE_CLIENT_ID
NUXT_OAUTH_GOOGLE_CLIENT_SECRET
NUXT_OAUTH_GITHUB_CLIENT_ID
NUXT_OAUTH_GITHUB_CLIENT_SECRET
```

Do not commit or send `.env` through Git. Store deployed values in Vercel and exchange local values through an approved secrets channel.

## PostgreSQL

For Neon:

1. Keep Production, Preview and local development on separate Neon branches.
   Keep automated integration tests on an additional isolated branch.
2. Use the pooled connection URL as `DATABASE_URL`.
3. Use the direct connection URL as `DATABASE_MIGRATION_URL` only where
   migrations are executed.
4. Obtain explicit approval before restoring an archived branch or any shared DB write;
   first verify the intended branch and read-only runtime/schema/data readiness.
5. After migration approval and rollback preparation, run `pnpm db:migrate` against that branch.
6. Verify tables and indexes.
7. Run `pnpm db:seed:preview` only for an explicitly approved preview dataset.

Do not run `db:push` against shared Preview or Production databases.

Migration0005 is additive/nullable (vacancy provenance, no historical backfill). Apply it
only after the exact target, backup/restore and owner approval checks above, before the
new app selects its columns. The previous app remains schema-compatible for rollback;
retain the columns/data rather than run destructive down-SQL. Old `published_at` is not
evidence for either a source or TalentBay publication date. See docs25 for date semantics
and maintenance; no shared target has been migrated by the local C04 tests.

Migration0006 adds nullable relocation package snapshot/import time/actor, also without
backfill. New code excludes legacy VERIFIED rows lacking a matching reviewed package;
do not fabricate metadata to recover visibility. The initial `db:relocation` CLI is only
for guarded local disposable targets: cloud/shared execution stays blocked until the
exact provider passport/approval/backup/restore step. See docs26. A rollback app may have
less strict legacy data-reading policy, so retain protection/maintenance and review public
visibility before reopening; preserve the additive metadata, do not drop it.

## OAuth Callbacks

Callbacks:

```text
https://<preview-origin>/api/v1/auth/google
https://<preview-origin>/api/v1/auth/github
https://talentbay.org/api/v1/auth/google
https://talentbay.org/api/v1/auth/github
```

Google supports multiple exact authorized redirect URIs. GitHub OAuth Apps expose a single configured callback URL, so Preview and Production should use separate GitHub OAuth Apps or another explicitly approved fixed callback strategy.

Use a stable branch Preview URL for OAuth testing, not a commit-specific URL.

## First Preview

The initial CLI demo was deployed in July. Historical CLI example (not authorization):

```bash
npx --yes vercel@58.0.0 deploy --scope alexs-projects-76662c2b
```

The first deployment of a new project can become Production automatically.
Later commands without `--prod` create Preview deployments. Use `--prod` only
after the intended source state and environment variables have been verified.

Remaining Preview work:

1. Configure OAuth callbacks for the selected stable origins.
2. Verify vacancy detail, relocation, candidate profile, application and admin
   flows against the connected database.
3. Review runtime logs and the automated CI/smoke result.

Historical Production callback status (2026-07-29; not reverified):

```text
Google: https://talentbay-seven.vercel.app/api/v1/auth/google
GitHub: https://talentbay-seven.vercel.app/api/v1/auth/github
```

GitHub accepts the callback. Google currently returns
`redirect_uri_mismatch`, so its exact callback must be added in Google Cloud
Console before the browser journey can pass.

## Runtime Protection and Logs

Current application diagnostics, normalized/PII-minimal operation logs and repeatable
synthetic restore: [diagnostics and recovery](32-incidents-and-recovery.md). Health is
liveness, not DB/provider readiness. This does not refresh the historical firewall state
below or authorize any real backup/restore/provider/billing change.

July verification found the `TalentBay API rate limit` Vercel Firewall
rule: 120 requests per 60 seconds per IP for paths starting with `/api/`.
Changing or removing it is an operational change and must be recorded here.

API responses include `x-request-id`. Runtime logs use one-line JSON records
named `request.completed` and `request.error`. They intentionally exclude query
strings, request/response bodies, IP addresses, cookies, authorization headers
and raw error messages.

## Domain Handoff

DNS inspection on 2026-07-29 confirmed:

```text
ns1.vercel-dns.com
ns2.vercel-dns.com
```

The `lattelix` Vercel account cannot add `talentbay.org` because the domain is
owned by another Vercel scope in the July check. After current ownership verification,
the existing owner must either:

1. Grant the deploying account access to that scope and project; or
2. Approve transfer to the intended company scope with a plan permitting commercial use.
   Do not move it to the temporary personal Hobby demo as a launch workaround.

Do not use `--force` without confirming the current owner and target project.

## Production Gate

Do not bind `talentbay.org` or merge for release until:

- Preview review is approved.
- Database backup/restore ownership is known.
- OAuth Production callbacks are configured.
- Terms and Privacy Notice are approved.
- Vacancy and relocation sources are approved.
- A rollback owner is identified.

After approval and domain access:

1. Merge the reviewed PR into `main`.
2. Confirm the Production deployment passes.
3. Attach `talentbay.org` to that deployment in the Vercel scope that owns the domain.
4. Re-run public smoke checks.
