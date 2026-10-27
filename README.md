# TalentBay

TalentBay is an English-first international job board MVP with relocation-cost previews.

The active product is Web2-only: vacancies, OAuth accounts, candidate profiles, applications, admin review and relocation estimates. Token, ICO, payment, custody and KYC flows are outside this application until separately specified and legally approved.

## Stack

- Nuxt `4.6.2`, Vue `3.5.44`, Nitro.
- Nuxt UI `4.10.x`, Tailwind CSS `4.3.x`, Manrope.
- PostgreSQL, Drizzle ORM `0.45.x`.
- `nuxt-auth-utils` with Google/GitHub OAuth, explicit provider linking and validated Telegram login.
- pnpm `10.33.0`, Node.js `22.22.3+` (within Node 22).
- Vitest, Playwright Chromium and official Nuxt ESLint flat config.

The repository remains a Nuxt modular monolith. Public vacancy routes use SSR; authenticated/admin legacy-compatible routes are client-rendered where needed.

## Local Development

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Nuxt starts at `http://localhost:3000`.

Without `DATABASE_URL`, the public jobs and relocation routes use an explicitly labelled preview dataset. OAuth, profiles, applications and admin operations require a migrated PostgreSQL database and provider credentials.

For an interactive review without cloud credentials, run `pnpm dev:review` (installed
PostgreSQL 18 required). Open `http://127.0.0.1:3131` and choose a test candidate, newcomer
or content operator. This creates a fresh isolated local database and uses real APIs with
fictional content. It is not a deployed or employer-connected MVP. See the
[review guide and product gaps](docs/21-local-product-review.md).

`NUXT_SESSION_PASSWORD` is required in every running environment, including public preview deployments. The standalone Nitro server does not load `.env` by itself; export the variables before running `node .output/server/index.mjs`, or use the hosting provider's environment-variable store.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
pnpm test:smoke
pnpm exec playwright install chromium
pnpm test:e2e
```

Database commands:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

Use Neon's pooled URL as `DATABASE_URL` for the deployed application and its direct URL as `DATABASE_MIGRATION_URL` for Drizzle migrations.

Browser tests run the compiled Node output, not a dev-server mock. The public suite forces
an empty database configuration. `playwright.database.config.ts` additionally exercises
real sessions, profile edits and applications, but refuses any target other than a marked
disposable loopback `talentbay_ci` database. See [browser verification](docs/17-candidate-verification.md).

`test:integration` requires an already installed PostgreSQL18. It ignores developer DB/
provider credentials and dotenv, creates its own temporary loopback database, verifies
legacy migration upgrade, runs the SQL suite and stops its cluster. Direct Vitest
integration runs require the explicit disposable guard; shared/cloud targets are refused.

## Documentation

- [Current state](docs/09-current-state.md)
- [Independent review handoff](docs/35-independent-review.md)
- [Disposable database verification](docs/34-database-verification.md)
- [MVP scope](docs/01-mvp-scope.md)
- [Architecture](docs/02-architecture.md)
- [Local development](docs/03-local-development.md)
- [Auth and roles](docs/04-auth-and-roles.md)
- [Data model](docs/05-data-model.md)
- [Infrastructure and process](docs/06-infrastructure-and-process.md)
- [Risk register](docs/07-risk-register.md)
- [Compliance guardrails](docs/08-compliance-guardrails.md)
- [Design direction](docs/10-design-direction.md)
- [Deployment runbook](docs/11-deployment-runbook.md)
- [Sprint 2 plan](docs/12-sprint-2-plan.md)
- [Admin operations](docs/13-admin-operations.md)
- [Operator shift, handoff and support runbook](docs/31-operator-runbook.md)
- [Operational metric definitions](docs/30-operations-metrics.md)
- [Incident triage and synthetic recovery rehearsal](docs/32-incidents-and-recovery.md)
- [Private data inventory and access matrix](docs/33-private-data-and-access.md)
- [Founder demo checklist](docs/14-founder-demo-checklist.md)
- [MVP acceptance record](docs/15-mvp-acceptance-record.md)
- [Candidate verification](docs/17-candidate-verification.md)
- [CSV content operations](docs/19-content-operations.md)
- [Release readiness](docs/20-release-readiness.md)
- [Interactive local review and product gaps](docs/21-local-product-review.md)
- [Application boundary and CEO/product questions](docs/22-application-review-contract.md)
- [Architecture decisions](docs/adr/README.md)

This is an alpha/MVP codebase. The documentation distinguishes implemented behavior, preview data and decisions still blocked on external approval.
