# MVP data model

The [Drizzle schema](../server/db/schema/index.ts) and [SQL migrations](../server/db/migrations)
define the Web2 MVP for both web and the Telegram Mini App. This describes the repository
through migration `0009`, not the migration state of a particular hosted database.

## Who owns what

| Tables | Purpose |
| --- | --- |
| [`users`, `oauth_accounts`, `candidate_profiles`](../server/db/schema/users.ts) | A permanent local user can have several provider identities and at most one candidate profile. The provider and provider account ID together are unique. Profile and contact fields are columns, not a JSON blob on the user. There is no local password column. |
| [`organisations`, `organisation_members`](../server/db/schema/organisations.ts) | A company has a unique slug and a display name. The name is not its key. Membership links a local user to a company and records their company role. A company can exist with no members or partner login; the table does not imply a partner self-service UI. |
| [`vacancies`](../server/db/schema/vacancies.ts) | Each role belongs to exactly one organisation. The optional creator is a different relation to a user. A role may also reference a relocation location. Salary bounds, currency, pay period, work format, relocation offer and visa sponsorship belong to the role. |
| [`relocation_locations`](../server/db/schema/relocation.ts) | One row per country and city. It stores currency, monthly costs, one-time costs, tax model, source metadata and review state. Having a city label on a vacancy does not establish an approved estimate. See the [dataset contract](26-relocation-data-contract.md). |
| [`applications`, `application_handling_events`](../server/db/schema/applications.ts) | One application per user and vacancy. A submission snapshot preserves what the candidate agreed to share; older records can lack it. The application status, TalentBay handling stage and operator event history are distinct. Preparing a package or recording contact is not proof that an employer received it. |
| [`source_imports`](../server/db/schema/source-imports.ts) | A bounded, replaceable checkpoint per configured source, not permission to fetch that source, a permanent copy of its feed or a table of published vacancies. See the [source contract](25-source-contract.md). |
| [`bot_entry_receipts`](../server/db/schema/bot-receipts.ts) | A prepared reply is recorded by bot and update ID for deduplication. The receipt is not a candidate identity, chat transcript or delivery confirmation. |

## Trace a vacancy

1. **Create or import.** The operator supplies a company name and stable company slug.
   `vacancies.organisation_id` points to `organisations.id`, not `users.id`. Source
   name and external ID form a unique import key when both are present. Keep the same
   vacancy ID on re-import; do not delete and recreate it, since applications reference it.
2. **Publish.** The [shared visibility predicate](../server/repositories/vacancy-visibility.ts)
   requires all three: a `PUBLISHED` vacancy, `VERIFIED` review and an `ACTIVE`
   organisation. A draft or an unreviewed change must not appear in the public catalogue.
3. **Compare and apply.** The calculation uses the vacancy context and the destination
   dataset. A saved job is local to the browser; it creates neither a database bookmark
   nor an application. Submitting creates an application to TalentBay, not an automatic
   email to the employer.
4. **Handle.** The operator works from the application and records actions against
   revisions. Private notes are not part of the candidate view. See the
   [application contract](22-application-review-contract.md) and
   [operator runbook](31-operator-runbook.md) before handling a real profile.

## Verify a change

The vacancy schema includes indexes for organisation, location, publication ordering
and English full-text search over title, summary and description. Use the schema and
committed SQL for exact index definitions; a proposed filter is not evidence of an index.

Change the schema and migration together. Follow the [local migration workflow](03-local-development.md)
and verify on disposable PostgreSQL with `pnpm test:integration`. Never use a candidate
database for tests. A successful migration on a clean local cluster does not authorize or
prove a migration on Neon; hosted checks follow the [database verification runbook](34-database-verification.md).
