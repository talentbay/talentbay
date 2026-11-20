# Focused Admin Import Contract

Date: 2026-10-26. Scope: fixed-template CSV and safe review, not an admin redesign.
Based on existing Nuxt UI admin navigation, tables, buttons and source-publication services.
The owner authorized autonomous product/design work. This is an engineering-reviewed
implementation contract, not a new founder-approved Figma freeze or legal/source approval.

## Design review

Local Figma Core Button/Tag/Input/Form Field, semantic Product mode and Manrope styles were
inspected. Code Connect files were absent. Library search returned unrelated libraries;
they are not imported into TalentBay. Writing a new isolated import page failed with
`Can't call createPage in read-only mode`; no canvas mutations succeeded. The flow below
is the focused review input until the connection permits editing. The working UI must be
screen-captured and tested at desktop/mobile sizes before claiming this slice ready.

```text
Vacancy queue → Import CSV
                 |
           Choose file + template download
                 |
        Validate all rows (no data writes)
          /                     \
  File/row errors            Preview changes
  row + column + reason     create/update/unchanged + affected published records
  replace file                  |
                         Confirm import
                                |
                 Atomic bounded import → draft/review queue
                                |
              Open complete record + company/source metadata
                                |
              Verify & publish / flag / archive
              Reject stale review and require a fresh read
```

Use the existing admin header and navigation. Add one Import route/action, a real file
input, template download, validation summary, row error table, preview table and final
confirmation. No decorative hero/cards, universal column mapper, background queue or
separate content platform. On narrow screens, controls wrap and tables scroll inside
their own region; text/action hit targets must remain usable. Full content review is a
focused modal/panel rather than a new full admin information architecture.

States: no file; validating; invalid; valid preview; importing; completed; failed/retry;
stale preview/review conflict. Changing the file invalidates the prior preview. Import is
disabled until all rows validate. Double submit is blocked; failed/uncertain execution
must be retryable without duplicate records or automatic publication.

## File and API contract

### Company labels and write access (20 November)

Use one vacancy format for the team and, later, partners. An operator or an agent
can prepare multiple records for the existing CSV/JSON import. The company name
and stable company key group vacancies; they are not proof of a partnership or a
right to manage that company. A label is plain text for candidates while no
public employer profile exists. An original source URL is not a company profile.

| Operation | Available now | Next acceptance |
| --- | --- | --- |
| Create and correct a vacancy | Admin batch import; a single row is also valid. A changed import returns to review. | One operator form uses the same item validation and review rules as the batch; editing a record preserves its ID and submitted applications. |
| Read and retire | Public list/detail; admin queue, review and archive. | Archive withdraws public visibility without deleting candidate history; no hard-delete shortcut. |
| Identify a company | Import resolves the unique company slug to an internal organisation; no partner account is required. Text search includes company names. | An exact company filter groups its jobs even if another company has a similar name; do not link to a nonexistent company page. |
| Partner authorship | Not a self-service flow today. | Keep the content format. Enforce separately verified membership and company scope on the server for both single and bulk writes; a supplied name, slug or source ID never grants access. |

This is a scope clarification, not an instruction to expose generic CRUD for users,
profiles, application history or every database table. Single-record authoring and
company filtering come before building a partner dashboard.

- UTF-8 comma-delimited CSV, optional UTF-8 BOM, quoted commas/newlines supported by
  `csv-parse/sync`; no custom CSV parser, XLSX, ZIP, formula evaluation or URL fetching.
- Maximum file text 512 KiB, 50 data records; bounded HTTP body and parser record buffer.
- Exact documented header names, arbitrary column order, no duplicates or unknown columns.
- Blank optional values clear prior optional data; booleans accept true/false or blank=false.
  Salary is all four fields or absent; integer range, currency and period must validate.
- Validate every row before any write; report record number/field/reason, no silent skips.
- Reject duplicate source keys/slugs and contradictory company metadata within a batch.
- The existing JSON import endpoint remains compatible and server-authorized.
- Both file and JSON imports keep source-based idempotency and all-or-nothing transactions.
  Content changes withdraw published records, unchanged records preserve their state,
  archives stay archived and application-linked IDs are retained.
- A preview lists operations and publication consequences. Execute revalidates input and
  rejects a changed preview revision before writing. Dry run must not mutate the database.
- Admin authorization precedes parsing; mutations require same origin and private no-store
  responses. No raw files, tokens, connection strings or profile data in application logs.

Columns:

```text
source_name,source_url,source_external_id,company_name,company_slug,company_website_url,vacancy_slug,title,summary,description,employment_type,workplace_type,seniority,country_code,city,salary_min,salary_max,salary_currency,salary_period,skills,relocation_offered,visa_sponsorship,source_published_at
```

`skills` uses `|` between values. Identifiers and enum values follow the JSON import schema;
URLs must be HTTP(S), not embedded credentials or executable schemes. Publication dates
use offset-aware ISO timestamps. Validation is not permission to copy/publish a source.

## Review and metrics

Review shows full description, summary, salary period/currency, location, skills/support,
company details and source identifiers/URL. Publication uses a SHA-256 content revision
and current locked content. A company explicitly archived is not silently reactivated.
Conflicts retain the operator's context and require reload, not a blind publish retry.

Dashboard measurements must be actual database aggregates with definitions: accounts,
profiles, applications/current statuses and vacancy publication/review queue. Public counts
must use the same visibility predicate as public search. No visits, conversion funnel,
delivery performance or import-history chart without the underlying event data.

Acceptance: parser/limits/row errors/duplicates/no-write dry run, atomic idempotent imports,
stale review rejection, publication/applications preservation, unauthorized/CSRF denial,
real browser import→review→public listing and truthful dashboard counts. Shared Neon and
real source ingestion remain separate release operations.
