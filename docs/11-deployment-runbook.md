# Deployment Runbook

Last updated: 2026-10-06

## Current operating boundary

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
