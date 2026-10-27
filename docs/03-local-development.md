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

For Neon, set the pooled connection string as `DATABASE_URL` and the direct connection string as `DATABASE_MIGRATION_URL`. The application uses the pooler; Drizzle Kit prefers the direct URL for schema migrations.

Useful development commands:

```bash
pnpm db:generate
pnpm db:studio
```

`db:push` is for deliberate local prototyping only; shared environments should use migrations.

## Quality Checks

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
