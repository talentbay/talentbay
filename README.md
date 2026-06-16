# TalentBay

TalentBay is an early-stage SaaS/job board product for international hiring and relocation planning.

The current MVP direction is intentionally Web2-first: vacancies, candidate/company accounts, admin tools, and a relocation calculator that helps candidates understand approximate net income after taxes and living costs.

Web3, token mechanics, KYC/AML, payments, custody, and pre-ICO investor flows are out of the first product MVP unless they are separately specified and legally approved.

## Current Stack

- Nuxt `^4.4.2`
- Vue `^3.5.32`
- Nitro server routes inside Nuxt
- PostgreSQL with Drizzle ORM
- NuxtHub database integration
- `nuxt-auth-utils` for OAuth/session utilities
- Bootstrap/SCSS in the current UI
- pnpm lockfile for dependency installation

See [docs/02-architecture.md](docs/02-architecture.md) for the current and target architecture.

## Local Development

Install dependencies:

```bash
pnpm install
```

Create local environment file:

```bash
cp .env.example .env
```

Fill OAuth/session values in `.env`, then start the dev server:

```bash
pnpm dev
```

By default Nuxt starts at `http://localhost:3000`.

Useful commands:

```bash
pnpm build
pnpm preview
pnpm generate
```

See [docs/03-local-development.md](docs/03-local-development.md) for environment variables and known setup notes.

## Documentation

- [docs/00-project-vision.md](docs/00-project-vision.md)
- [docs/01-mvp-scope.md](docs/01-mvp-scope.md)
- [docs/02-architecture.md](docs/02-architecture.md)
- [docs/03-local-development.md](docs/03-local-development.md)
- [docs/04-auth-and-roles.md](docs/04-auth-and-roles.md)
- [docs/05-data-model.md](docs/05-data-model.md)
- [docs/06-infrastructure-and-process.md](docs/06-infrastructure-and-process.md)
- [docs/07-risk-register.md](docs/07-risk-register.md)
- [docs/08-compliance-guardrails.md](docs/08-compliance-guardrails.md)
- [docs/adr/README.md](docs/adr/README.md)

## Project Status

This repository is an alpha-stage codebase. Treat documentation as a living map of current reality and target direction, not as a guarantee that every described module already exists.
