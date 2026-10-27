# Infrastructure and Process

Last updated: 2026-10-27

## Active Integration Route

The autonomous run starts from `4e1be73` (approved scope docs plus cumulative product work).
`codex/mvp-integration` preserves that complete line; topic branches/PRs target it. CI runs
on its pushes and PRs as well as main. No main merge, production promotion or cloud change
is implicit. #25-#37 are cumulative review records, not independent squash patches.

| Layer | Included head | Existing PR |
| --- | --- | --- |
| Baseline / CI | ffbefd8 | #25 |
| OAuth state | 9e6dbcd | #26 |
| Publication safety | cb462cc | #27 |
| Local identities / Telegram | 36f93b2 | #28 |
| Security/current role | b4a49a5 | #29 |
| Responsive Candidate | 5ab3164 | #30 |
| CSV operations | b99776f | #31 |
| Release checks / hydration | b5f1aea / c602b42 | #32 / #33 |
| Local review / withdrawal | 71b9b8a / c256387 | #34 / #35 |
| Managed receipt / agreed scope | af2c4ec / 4e1be73 | #36 / #37 |

All these heads are ancestors of the integration baseline. Keep #24 Cloudflare deferred.
Old PR disposition and main release require reviewed integration, not blind repeated squash.

Environment passport: local review has fictional data/ephemeral credentials and its own PG;
CI has runner-only PostgreSQL; preview/production require distinct targets and secrets.
Runtime needs `DATABASE_URL`/session/provider configuration; migration URL belongs only to
the approved migration process. Deployment/callback/backup/rollback gates: `docs/20-release-readiness.md`.
Do not interpret July observations below as fresh provider checks.

## Current State

- Main repository is GitHub.
- Deployment target is Vercel.
- Budget before pre-ICO is limited.
- MVP should avoid infrastructure that requires dedicated DevOps work.
- CI runs typecheck, lint, unit tests and production build.
- Vercel is not connected to this local repository through the available account.
- No production PostgreSQL connection is available yet.

## Recommended MVP Infrastructure

### Hosting

Use a new Vercel project in the intended owner account:

- Pull Request -> Preview Deployment.
- `main` -> Production Deployment.

For the first MVP, PR Preview and Production are enough. A separate staging environment can be added after the team, budget or release risk grows.

Creating the Vercel project, binding `talentbay.org` and performing the first production deployment are explicit external changes. They require the correct account connection and release confirmation.

### Database

Use managed PostgreSQL:

- Neon is the current preferred first option; another managed PostgreSQL provider can be selected if account/region/limits make it unsuitable.

Criteria:

- Free or low-cost start.
- Easy connection from Vercel.
- Backups/restore story.
- Connection pooling or serverless-friendly connection mode.

### Secrets

Use:

- Local `.env` for local development.
- `.env.example` for names-only documentation.
- Vercel Environment Variables for deployed runtime.
- GitHub Secrets only for CI tokens/secrets.

`NUXT_SESSION_PASSWORD` is mandatory even when a deployment only exposes public preview data. Database and OAuth variables become mandatory before authenticated workflows are enabled.

Do not use Telegram or committed files as a secrets store.

## Git Process

Recommended process:

- `main` is always deployable.
- Short-lived feature branches.
- Pull Requests for changes.
- CI must pass before merge.
- Keep PRs small.

This is trunk-based development with PR review.

## Issue Tracking

Recommended:

- GitHub Issues for implementation tasks.
- GitHub Projects for board/planning.
- Obsidian can be used as personal/project memory, but repo and GitHub remain source of truth for implementation.

## CI Baseline

Implemented checks:

- Install dependencies.
- Typecheck.
- Lint.
- Unit tests.
- Production build.
- Production-server HTTP smoke.

The repository smoke script starts the compiled Nitro server and checks the root redirect, SSR jobs page, preview vacancy API, legal status page and session endpoint. A separate post-deploy check should be added after Vercel is connected.

## Release Policy

MVP release can start simple:

- Merge to `main` deploys production.
- Tags can be introduced later for investor-demo/release snapshots.
- Rollback should use Vercel deployment rollback.

## Documentation Policy

Docs should be updated when:

- Product scope changes.
- Architecture decisions are made.
- New service/provider is added.
- Auth/data model changes.
- Legal/compliance boundaries change.
- Deployment process changes.
