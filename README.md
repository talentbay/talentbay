# TalentBay

TalentBay is an English-first international job board MVP with relocation-cost previews.

The active product is Web2-only: vacancies, OAuth accounts, candidate profiles, applications, admin review and relocation estimates. Token, ICO, payment, custody and KYC flows are outside this application until separately specified and legally approved.

## Stack

- Nuxt `4.5.0`, Vue `3.5.x`, Nitro.
- Nuxt UI `4.10.x`, Tailwind CSS `4.3.x`, Manrope.
- PostgreSQL, Drizzle ORM `0.45.x`.
- `nuxt-auth-utils` with Google and GitHub OAuth.
- pnpm `10.33.0`, Node.js `22`.
- Vitest and official Nuxt ESLint flat config.

The repository remains a Nuxt modular monolith. Public vacancy routes use SSR; authenticated/admin legacy-compatible routes are client-rendered where needed.

## Local Development

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Nuxt starts at `http://localhost:3000`.

Without `DATABASE_URL`, the public jobs and relocation routes use an explicitly labelled preview dataset. OAuth, profiles, applications and admin operations require a migrated PostgreSQL database and provider credentials.

`NUXT_SESSION_PASSWORD` is required in every running environment, including public preview deployments. The standalone Nitro server does not load `.env` by itself; export the variables before running `node .output/server/index.mjs`, or use the hosting provider's environment-variable store.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Database commands:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## Documentation

- [Current state](docs/09-current-state.md)
- [MVP scope](docs/01-mvp-scope.md)
- [Architecture](docs/02-architecture.md)
- [Local development](docs/03-local-development.md)
- [Auth and roles](docs/04-auth-and-roles.md)
- [Data model](docs/05-data-model.md)
- [Infrastructure and process](docs/06-infrastructure-and-process.md)
- [Risk register](docs/07-risk-register.md)
- [Compliance guardrails](docs/08-compliance-guardrails.md)
- [Design direction](docs/10-design-direction.md)
- [Architecture decisions](docs/adr/README.md)

This is an alpha/MVP codebase. The documentation distinguishes implemented behavior, preview data and decisions still blocked on external approval.
