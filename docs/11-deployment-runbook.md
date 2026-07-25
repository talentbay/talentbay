# Deployment Runbook

Last updated: 2026-07-25

## Verified Access State

- The repository branch `chore/sprint-1-cleanup` is published on GitHub.
- Local Vercel CLI authentication belongs to the `lattelix` account.
- A temporary Vercel project named `talentbay` exists in the personal
  `alexs-projects-76662c2b` Hobby scope.
- The current public demo is available at
  `https://talentbay-seven.vercel.app`.
- The demo is deployed directly with Vercel CLI and has no Git integration.
- `talentbay.org` uses Vercel nameservers but is managed in another Vercel scope.
- A valid `NUXT_SESSION_PASSWORD` is configured for Preview and Production.
- Local Google/GitHub OAuth credentials are present but are not deployed.
- Both OAuth handlers generate redirects to the expected providers.
- No database is connected to the Vercel project yet.
- A Neon credential shared through chat must be rotated before use.

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

1. Create the TalentBay project in the intended company/founder account.
2. Use a region close to the selected Vercel function region.
3. Copy the pooled connection URL to `DATABASE_URL`.
4. Copy the direct connection URL to `DATABASE_MIGRATION_URL`.
5. Test a read-only connection.
6. Run `pnpm db:migrate` once against the intended database.
7. Verify tables and indexes before seeding an admin or vacancy data.

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

The initial CLI demo is deployed. To publish the current local branch again:

```bash
pnpm dlx vercel@latest deploy --scope alexs-projects-76662c2b
```

The first deployment of a new project can become Production automatically.
Later commands without `--prod` create Preview deployments. Use `--prod` only
after the intended source state and environment variables have been verified.

Remaining Preview work:

1. Rotate the exposed Neon role password.
2. Add the pooled URL as `DATABASE_URL`.
3. Keep the direct URL local or in the migration environment as
   `DATABASE_MIGRATION_URL`.
4. Run and verify migrations once.
5. Configure dedicated Preview OAuth callbacks and secrets.
6. Verify vacancy detail, relocation, candidate profile, application and admin
   flows against the connected database.
7. Review runtime logs and the automated CI/smoke result.

## Production Gate

Do not bind `talentbay.org` or merge for release until:

- Preview review is approved.
- Database backup/restore ownership is known.
- OAuth Production callbacks are configured.
- Terms and Privacy Notice are approved.
- Vacancy and relocation sources are approved.
- A rollback owner is identified.

After approval:

1. Merge the reviewed PR into `main`.
2. Confirm the Production deployment passes.
3. Attach `talentbay.org` to that deployment in the Vercel scope that owns the domain.
4. Re-run public smoke checks.
