# Contributing

TalentBay is one responsive Nuxt modular monolith for desktop web, mobile web and
Telegram Mini App. Share components and domain logic; do not create a separate
Telegram frontend. The MVP runtime is Node on Vercel with PostgreSQL/Drizzle on Neon.
Use Node 22 (`>=22.22.3 <23`) and pnpm `10.33.0`, as pinned in `package.json`.

Start with the [README](README.md), [repository workflow](docs/06-infrastructure-and-process.md)
and [execution log](docs/14-mvp-execution.md). Use the
[deployment runbook](docs/11-deployment-runbook.md) for environment and release gates;
historical provider observations are not current verification or permission to act.

## Branches and Pull Requests

- Before release, `codex/mvp-integration` is the consolidated source line. Create
  short, focused `codex/<topic>` branches from it and target it with topic PRs.
  After release, return to short topic branches targeting `main`.
- Keep one draft `codex/mvp-integration` -> `main` PR for the consolidated release
  review. Do not merge the superseded cumulative PRs individually.
- Close an old PR only after verifying that its head is an ancestor of published
  integration, its changes are preserved, and the replacement PR is linked. Preserve source
  branches: no force-push or branch deletion during cleanup.
- Keep each PR coherent. Explain the change, risk, rollback and actual verification
  in the PR template. No automatic reviewer or team assignment is required.

## Change Boundaries

- Follow the existing stack, conventions and design tokens. Keep unrelated dependency
  upgrades, branding and architecture changes out of a focused contribution.
- Update existing docs when behavior, contracts or operations change. Record actual
  commands/results and remaining blockers in the execution log, not planned successes.
- Server authorization is the security boundary; client guards are UX only. Preserve
  server-validated Telegram login and explicit identity-linking proof for both identities.
- Keep content factual and permission-gated. Facts-only extraction or public access
  does not grant republication rights. Preserve source/permission evidence and review
  before publishing new or changed imports; do not copy uncleared third-party text,
  use logged-in scraping, or delete application-linked records to simplify imports.
- Keep schema changes, Drizzle migrations and tests together. Never migrate shared
  databases from a build hook. Do not put secrets, real credentials or personal data
  in code, PRs, logs, screenshots or test artifacts; use synthetic fixtures.

## Verification

Run the checks applicable to the change and report each actual result, including
failures and reasons for skipped or blocked checks. Build before smoke/browser tests.

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:integration
pnpm build
pnpm test:smoke
pnpm test:e2e
```

`pnpm test:integration` requires installed PostgreSQL 18 and creates/stops its own
temporary loopback database without loading developer dotenv or provider credentials.
PR workflows must use disposable runner-only PostgreSQL, never shared databases or
real credentials. See [database verification](docs/34-database-verification.md).

Run the additional database browser suite only against a verified disposable local
PostgreSQL target, with `CI=true`, `TALENTBAY_TEST_DATABASE=disposable`, and both database
URLs targeting the same loopback `talentbay_ci` database and role without URL options:

```bash
pnpm exec playwright test --config playwright.database.config.ts
```

Do not falsify the marker, tunnel to shared data or bypass the database guard. This
command is not permission to provision, migrate or write to a shared/provider database.

## Release Boundary

A merge to `main` can trigger the owner's configured Vercel production deployment.
It requires explicit owner release confirmation, passing actual CI for the release
head, and verified database/migration/rollback, environment/provider, privacy and
approved-content gates in the runbook. A green local build is not release approval.

Routine contributions and PR cleanup authorize no paid plan, billing, domain, provider
or shared-database mutation. Such operations need explicit approval and a rollback plan;
keep deployment protection and API security controls intact.

Report **code ready**, **tests passed**, **merged**, **deployed** and **live verified**
separately, with evidence or a clear pending/not-run status for each. A merge does not
prove deployment, and deployment does not prove live user flows.
