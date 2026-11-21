# Local Development

Last updated: 2026-10-27

## Safe Review Environment

For the full synthetic Candidate/operator journey without cloud credentials:

```bash
pnpm install --frozen-lockfile
pnpm dev:review
```

PostgreSQL 18 must be installed locally. The launcher creates its own disposable loopback
cluster, migrations, fictional content and account chooser at `http://127.0.0.1:3131`;
the application is at port 3130. It does not use developer dotenv, Neon or a real bot.
Do not mistake this for real OAuth/native Telegram acceptance. See `docs/21-local-product-review.md`.

## Requirements

- Node.js 22.
- pnpm 10.33.0.
- PostgreSQL for authenticated and admin workflows.
- Google/GitHub OAuth applications for real sign-in.

The versions are recorded in `package.json` and `.mise.toml`.

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Default URL: `http://localhost:3000`.

Required session value:

```env
NUXT_SESSION_PASSWORD=a-random-value-at-least-32-characters-long
```

Optional for public preview mode:

```env
DATABASE_URL=
DATABASE_MIGRATION_URL=
NUXT_OAUTH_GOOGLE_CLIENT_ID=
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=
NUXT_OAUTH_GITHUB_CLIENT_ID=
NUXT_OAUTH_GITHUB_CLIENT_SECRET=
```

Without `DATABASE_URL`, `/jobs` and relocation preview work from labelled demo data. Database-backed auth/profile/application/admin routes do not.

Never commit `.env` or send production credentials in chat.

When running the compiled Nitro server directly, export the runtime variables first:

```bash
NUXT_SESSION_PASSWORD=... node .output/server/index.mjs
```

Unlike `pnpm dev`, the standalone server does not load the repository `.env` file automatically.

## Database

After provisioning PostgreSQL:

```bash
pnpm db:migrate
```

For Neon, set the pooled connection string as `DATABASE_URL` and the direct connection string as `DATABASE_MIGRATION_URL`. Migrations require the explicit migration URL and never fall back to the runtime URL. Offline schema generation (`pnpm db:generate`) needs neither.

Useful development commands:

```bash
pnpm db:generate
pnpm db:studio
```

`db:push` is for deliberate local prototyping only; shared environments should use migrations.

## Quality Checks

### Feedback Loop

Use one coherent code/test/documentation slice per PR. During implementation, run the
affected unit/API/browser regressions first; run the complete applicable matrix on the
finished slice. Do not repeatedly rerun unchanged domain suites just to copy their results
into another note. Serialize Nuxt type generation and builds. CI remains the exact-head
integration check, not independent review or deployment approval.

CI always starts the scope check. Only a complete PR diff containing `README.md` and/or
`docs/**/*.md` may skip the existing `build` and `PostgreSQL integration` jobs. Their names
remain unchanged; missing revisions/diffs, non-Markdown files, code/configuration and all
protected-branch pushes run full checks. Classifier failure explicitly fails the dependent
required checks instead of letting them disappear. No workflow-level path filtering.
See [GitHub required checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks).

Headless Chromium installation uses `--only-shell`, matching the existing default test
channel. A real startup probe avoids blanket system-package installation on ready runners;
missing Linux libraries trigger official `playwright install-deps chromium` and a second
startup. Other errors, installer errors and retry failures fail CI. Full browser suites
still run; no retries/assertions/target guards are weakened. Browser caching is deliberately
not introduced: the observed slow step was Ubuntu package downloads, not browser download.
See [Playwright headless shell](https://playwright.dev/docs/browsers#chromium-headless-shell)
and [CI guidance](https://playwright.dev/docs/ci#caching-browsers).

Keep detailed commands/findings in the execution log and review report. Obsidian keeps a
short current state, decisions and links, not a copied task board or every passing command.
Update it after a completed slice/blocker, not after every tool call. Global vault rules
and structure are outside this project workflow change.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

CI and automated browser/integration tests use disposable loopback PostgreSQL named
`talentbay_ci`, with `CI=true`, `TALENTBAY_TEST_DATABASE=disposable` and both runtime and
migration URLs pointing to it. Run `node scripts/assert-ci-database.mjs` before migrations.
The actual commands are in `.github/workflows/ci.yml`; no cloud secrets are required.

Default local integration command (installed PostgreSQL18 required; no installer):

```bash
pnpm test:integration
```

This creates an owned fresh loopback cluster without reading dotenv or inheriting DB/
provider credentials, applies0000/0001, seeds synthetic legacy rows, upgrades to HEAD and
compares original fields/IDs plus unchanged replay. It then runs the full SQL suite and
stops its database before reporting PASS. No existing-target arguments are accepted.
`PG_BIN` may select an already installed PostgreSQL18 bin directory.

Vitest's integration config itself invokes the guard **before** test-module imports, so a
direct `pnpm exec vitest run --config vitest.integration.config.ts` also refuses unmarked,
shared/cloud/mismatched targets. CI's empty disposable service uses the same upgrade
verification. Upgrade verification refuses any existing public/drizzle table; it does not
drop/reset a database. Do not use ignored `.env.integration` as an implicit target or
change the guard to make a shared environment pass. Approved Neon integration needs a
separate verified-target adapter/approval, not merely a copied URL or cleanup promise.

Compiled-server smoke with no DB is `pnpm test:smoke`. Real DB-backed browser tests require
the existing disposable guard and compiled Node output; see docs17. Production/preview
database migration and release remain separate operations, never a test/build side effect.

## OAuth Callbacks

Provider callback URLs must match the deployment origin:

```text
https://<origin>/api/v1/auth/google
https://<origin>/api/v1/auth/github
```

Exact provider configuration must be checked again when preview and production domains are known.
