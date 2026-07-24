# Deployment Runbook

Last updated: 2026-07-24

## Verified Access State

- The repository branch `chore/sprint-1-cleanup` is published on GitHub.
- Local Vercel CLI authentication belongs to the `lattelix` account.
- The accessible Vercel team is Hobby and has no TalentBay project or domain.
- `talentbay.org` uses Vercel nameservers but is managed in another Vercel scope.
- Local Google/GitHub OAuth credentials and `NUXT_SESSION_PASSWORD` are present.
- Both OAuth handlers generate redirects to the expected providers.
- No `DATABASE_URL` is available.
- No authenticated Neon session is available.

The target deployment therefore needs access to the founder/company Vercel scope that currently owns `talentbay.org`. Do not create a second production project under the personal `lattelix` Hobby scope.

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

1. Create/import the Vercel project without attaching `talentbay.org`.
2. Add Preview environment variables.
3. Deploy `chore/sprint-1-cleanup`.
4. Verify `/`, `/jobs`, vacancy detail, relocation preview and legal status pages.
5. Connect PostgreSQL and run migrations.
6. Verify Google and GitHub OAuth.
7. Verify candidate profile, application and admin flows.
8. Review logs and the automated CI/smoke result.

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
