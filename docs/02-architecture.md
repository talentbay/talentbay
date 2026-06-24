# Architecture

Last updated: 2026-06-09

## Current Architecture

TalentBay DMCC is currently a Nuxt fullstack application:

- Frontend lives in `app/`.
- Server API lives in `server/api/`.
- Database schema lives in `server/db/schema/`.
- Auth utility logic lives in `server/utils/`.
- Public assets live in `public/`.

Current rendering mode:

- `ssr: false` in `nuxt.config.ts`.

Current UI:

- Bootstrap 5 and SCSS.

Current API surface:

- OAuth routes under `server/api/v1/auth/`.
- No complete vacancy/company/application API yet.

## Target MVP Architecture

Keep a modular monolith until there is a real scaling or team reason to split services.

Recommended boundaries:

```text
app/pages                Route-level screens
app/components           Reusable and domain UI components
app/composables          Client-side state/composition helpers
server/api               Thin HTTP handlers
server/services          Business logic
server/repositories      Database access
server/db/schema         Drizzle schema
server/integrations      External APIs/providers
shared/contracts         Shared types/contracts when needed
```

Do not put database logic in Vue components.

Do not put business rules directly in API handlers when they are reused or non-trivial.

## Domain Modules

Expected first domains:

- `auth`
- `users`
- `candidates`
- `companies`
- `vacancies`
- `applications`
- `relocation`
- `admin`

Nuxt already has opinionated directories, so the project should use Nuxt-way domain grouping instead of forcing strict Feature-Sliced Design.

Example:

```text
app/components/vacancies/
app/components/relocation/
app/composables/auth/
server/api/v1/vacancies/
server/services/vacancies/
server/services/relocation/
```

## Rendering Strategy

Current state:

- SPA mode is enabled with `ssr: false`.

Target direction:

- Public marketing pages and public vacancy pages should be SSR-ready or prerenderable.
- Private dashboards can stay client-heavy.
- Browser-only APIs must be isolated to client-only code.

Reason:

- Job board content may need SEO later.
- Delaying SSR readiness can create expensive hydration and browser-API bugs.

## Data Strategy

Current:

- PostgreSQL with Drizzle ORM.
- NuxtHub database integration.
- Early schemas for users, organisations, vacancies.

Target:

- Explicit migrations.
- Indexes for vacancy search and common filters.
- Separate tables for candidate profiles, company profiles, applications, relocation city costs.
- Avoid JSON blobs for core searchable/filterable data unless the shape is intentionally flexible.

## Auth Strategy

OAuth-first:

- Google/GitHub for MVP.
- Local password auth is not required for MVP.
- TalentBay DMCC still owns local user records, roles, profiles, and permissions.

See [04-auth-and-roles.md](04-auth-and-roles.md).

## External Integrations

Do not integrate external paid/regulated services until scope is explicit.

Possible later integrations:

- Flight pricing API.
- Cost-of-living data providers.
- Email provider.
- Analytics.
- OAuth providers beyond Google/GitHub.
- KYC provider.
- Payment provider.
- Web3 wallet/token layer.

## Known Architecture Issues

- `ssr: false` blocks SSR/SEO until changed.
- `server/api/v1/auth/test.post.ts` is unsafe for production unless intentionally protected/removed.
- `server/utils/registered.ts` appears to return the pre-insert user value after insert, which can produce an empty session for new users.
- `vacancies.orgID` currently references `users.id`; domain-wise it should likely reference `organisations.id`.
- Old admin pages under `app/pages/ktulhu/old` reference missing or outdated modules/routes.
- No test framework or CI checks are configured yet.

