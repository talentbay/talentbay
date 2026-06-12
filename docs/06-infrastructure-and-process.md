# Infrastructure and Process

Last updated: 2026-06-09

## Current Assumptions

- Main repository is GitHub.
- Deployment target is Vercel.
- Budget before pre-ICO is limited.
- MVP should avoid infrastructure that requires dedicated DevOps work.

## Recommended MVP Infrastructure

### Hosting

Use Vercel for Nuxt deployment:

- Pull Request -> Preview Deployment.
- `main` -> Production Deployment.

For the first MVP, preview and production are enough. A separate staging environment can be added after the team, budget, or release risk grows.

### Database

Use managed PostgreSQL:

- Neon, Vercel Marketplace Postgres provider, Supabase, or another managed Postgres.

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

Expected checks:

- Install dependencies.
- Typecheck.
- Lint.
- Build.
- Later: unit tests and smoke tests.

Current package scripts do not include typecheck/lint/tests yet.

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

