# Data Model

Last updated: 2026-06-09

## Current Schema Files

- `server/db/schema/users.ts`
- `server/db/schema/organisations.ts`
- `server/db/schema/vacancies.ts`

## Current Entities

### users

Current fields:

- `id`
- `role`
- `name`
- `email`
- `provider`
- `providerID`
- `avatar`
- `createdAt`
- `password`
- `profile`

Notes:

- `password` exists but local password auth is not planned for MVP.
- `profile` is JSONB, which is flexible but not ideal for searchable candidate data.

### organisations

Current fields:

- `id`
- `name`
- `about`
- `country`
- `city`
- `createdAt`
- `adminID`
- `userID`
- `vacancyID`

Notes:

- Current relations need review.
- A future model likely needs organization members instead of single `userID` field.

### vacancies

Current fields:

- `id`
- `title`
- `orgID`

Notes:

- `orgID` currently references `users.id`.
- Domain-wise, vacancy should belong to organization/company.

## Target MVP Entities

Expected core tables:

- `users`
- `oauth_accounts`
- `candidate_profiles`
- `companies` or `organisations`
- `company_members`
- `vacancies`
- `applications`
- `cities`
- `relocation_cost_profiles`
- `relocation_sources`

## Vacancy Fields

MVP vacancy should likely include:

- Title.
- Company/organization id.
- Country.
- City.
- Work format.
- Employment type.
- Salary min/max.
- Currency.
- Skills/tags.
- Description.
- Relocation support flag/details.
- Crypto-friendly badge/filter if product requires it.
- Status: draft/published/archived/reported.
- Created/updated timestamps.

## Relocation Data

Relocation calculation should not be hidden inside hardcoded UI.

Expected data:

- City.
- Country.
- Currency.
- Rent range.
- Utilities range.
- Food/basic expenses range.
- Transport range.
- Insurance range.
- Tax assumption.
- Flight/transfer estimate.
- Confidence score.
- Source name/url.
- Last updated.

## Indexing Direction

Likely indexes:

- Vacancy status.
- Vacancy city/country.
- Vacancy salary range.
- Vacancy company/org id.
- Full-text search over title/description/tags.
- User email.
- OAuth provider/provider id.

Indexes must be implemented through Drizzle migrations, not only described here.

## Known Data Risks

- Migrations have not yet been exercised against a managed PostgreSQL instance.
- JSONB profile can hide data that later needs filtering/searching.
- No production seed workflow is documented yet.
- Company self-service and organization membership/ownership are intentionally deferred.
