# Infrastructure and Process

Last updated: 2026-11-20

## Current Review Route

Consolidation PR #65 already merged. Dependency/security [PR #67](https://github.com/talentbay/talentbay/pull/67)
has auto-merge enabled and still needs the required reviewer. [Pilot PR #69](https://github.com/talentbay/talentbay/pull/69)
includes that baseline. After #67 merges, reconcile #69 with the resulting `main` and verify
its exact head locally and in CI before normal approval and auto-merge. The owner permits
this reviewed path; do not bypass rules or deploy to production manually. Building the
app must not migrate a shared database. See [execution log](14-mvp-execution.md) and
[deployment runbook](11-deployment-runbook.md).

## Historical Integration Route

`codex/mvp-integration` was the single pre-release line. It contains the cumulative
MVP through source-rights `43f74aa`, the updated baseline `5f5f3b5` and main `57b03a0`.
The draft PR from this branch to `main` was the release-review entry. The earlier topic
PRs below are preserved review history, not independent squash patches to merge in order.

Repository cleanup closes superseded PRs only after verifying that their exact head
commits are retained in the published integration branch. A closed PR does not mean
that its code was rejected, deployed or merged into main. Source branches remain intact.
PRs targeting integration may become indirectly merged when their commits become reachable;
that is still not a production merge. Do not force-push or delete branches during this cleanup.

| Layer | Included head | Existing PR |
| --- | --- | --- |
| Baseline / CI and main reconciliation | 5f5f3b5 | #25 |
| OAuth state | 9e6dbcd | #26 |
| Publication safety | cb462cc | #27 |
| Local identities / Telegram | 36f93b2 | #28 |
| Security/current role | b4a49a5 | #29 |
| Responsive Candidate | 5ab3164 | #30 |
| CSV operations | b99776f | #31 |
| Release checks / hydration | b5f1aea / c602b42 | #32 / #33 |
| Local review / withdrawal | 71b9b8a / c256387 | #34 / #35 |
| Managed receipt / agreed scope | af2c4ec / 4e1be73 | #36 / #37 |
| Repeatable candidate/operator walkthrough | 6278108 | #59 |
| Conservative CI feedback | 7a3a2ef | #60 |
| Displayed role/recipient consent | 0b990b4 | #61 |
| Native Telegram launch recovery | 45f43f5 | #62 |
| Facts-only permission-gated source import | 43f74aa | #64 |

All listed heads must remain ancestors of the integration result. Dependabot #63 is a
separate security update (including Nuxt4.6.4 and newer transitive packages), not a duplicate
of this inventory; do not discard it or copy its older main lockfile over the current MVP.
Reconcile it in a separate focused update with full tests before a public release.

The owner merged Cloudflare preparation #24 into main on17November. Its existing build
check/configuration are preserved, but no Worker deployment, Hyperdrive migration or change
to the Vercel/Neon launch target follows from that merge. Earlier deferral statements are history.

| Branch group | Role |
| --- | --- |
| `main` | Production boundary; current product code is not assumed deployed or complete |
| `codex/mvp-integration` | One active pre-release review line; not a second production branch |
| Previous topic/source branches | Preserved history and rollback references; no parallel merge queue |
| Dependabot branches | Focused dependency review, not an implicit product release |

Until the consolidated release, short topic branches target integration. Once released,
return to short branches against main; do not keep growing a permanent alternative trunk.
Do not change merge strategy or branch protections as part of PR cleanup. Follow the
repository's permitted merge method only after explicit release approval.

Environment passport: local review has fictional data/ephemeral credentials and its own PG;
CI has runner-only PostgreSQL; preview/production require distinct targets and secrets.
Runtime needs `DATABASE_URL`/session/provider configuration; migration URL belongs only to
the approved migration process. Deployment/callback/backup/rollback gates: `docs/20-release-readiness.md`.
Do not interpret July observations below as fresh provider checks.

## Provider Boundaries

- Main repository is GitHub.
- Deployment target is Vercel.
- Budget before pre-ICO is limited.
- MVP should avoid infrastructure that requires dedicated DevOps work.
- CI runs typecheck, lint, unit tests and production build.
- The owner reports an existing GitHub-to-Vercel deployment for the primary domain.
  Available Alex test projects have no Git link; that does not disprove the primary setup.
- The separate `talentbay-review` project is CLI/prebuilt deployed and uses its restricted
  review database. Do not infer primary production configuration from that test project.
- Fresh17November public primary-domain reads returned Vercel404/DEPLOYMENT_NOT_FOUND.
  The actual primary project's build logs/domain binding are not available to the current
  agent, so the exact root cause remains unproven. See the deployment runbook.

## Recommended MVP Infrastructure

### Hosting

Use the existing intended founder/company Vercel project after its ownership and settings
are verified. Do not create another replacement or move the domain as a cleanup shortcut:

- Pull Request -> Preview Deployment.
- `main` -> Production Deployment.

For the first MVP, PR Preview and Production are enough. A separate staging environment can be added after the team, budget or release risk grows.

Linking or replacing a Vercel project, binding `talentbay.org` and performing a production
deployment require correct access and explicit release confirmation. The owner's Git
integration may deploy main automatically, so a main merge is itself a release operation.

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

- `main` is the production boundary; never assume a historical baseline is the complete MVP.
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

- Treat merge to `main` as potentially deploying production through the owner's integration.
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
