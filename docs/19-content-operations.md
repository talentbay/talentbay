# Content Operations

Updated: 2026-10-26. Applies to the unmerged minimal CSV operator workflow.
Implementation/design contract: [18-admin-import-contract.md](18-admin-import-contract.md).

## Access and preparation

An existing authenticated local account must have the current database role `ADMIN`.
The private `/ktulhu/v1` route is navigation, not a security control: every API handler
checks the current account/role. Promote accounts only through the documented controlled
admin procedure; never add a public test login or automatically promote a new provider.

Use only sources that the product owner has approved for republication. Public visibility
on another website is not an import license. Owner16 November direction: automated feeds
are facts-only, never copied descriptions/requirements or AI paraphrases. Do not use
logged-in scraping or scrape LinkedIn/Indeed; prefer approved employer ATS APIs, not merely
accessible feeds. CSV/JSON is not a workaround: manual descriptions must be first-party or
permission-cleared, not pasted job-board prose. The shared source URL schema blocks the
known main linkedin.com/indeed.com domains and subdomains only; this is not an exhaustive
provider or rights check. See [source contract](25-source-contract.md) and
[compliance boundaries](08-compliance-guardrails.md). Record a real original source URL and stable
source record ID. Do not put credentials, private candidate information or passport data
in files. Synthetic data belongs in isolated tests, not the real-content catalogue.

Download `/templates/vacancies.csv` from **Vacancies → Import CSV**. This is a header-only
template, not a set of fictitious vacancies that could accidentally be published.
Save a copy as comma-delimited UTF-8 CSV; Excel/LibreOffice must not export semicolon CSV
or an XLSX file renamed to CSV. Maximum 50 records and 512 KiB per file.

## Fields

All template columns must exist; order may change. Duplicate/unknown columns are errors.
Every data record needs the following values:

| Columns | Meaning |
| --- | --- |
| `source_name`, `source_url`, `source_external_id` | Source name, HTTP(S) original URL, stable ID; name + ID identify re-imports |
| `company_name`, `company_slug` | Company name and stable lowercase hyphenated identifier |
| `vacancy_slug`, `title`, `description` | Unique lowercase hyphenated URL slug, title, complete plain-text description (20–50,000 characters) |
| `employment_type` | `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP` |
| `workplace_type` | `ONSITE`, `HYBRID`, `REMOTE` |
| `country_code` | Two-letter country code, normalized to uppercase |

Optional fields: company website, summary, seniority, city, salary, skills, support flags
and source publication date. `skills` separates values with `|`. Support flags accept
`true` / `false`; blank means false. Salary needs **all four** fields or none:
`salary_min`, `salary_max`, three-letter `salary_currency`, `salary_period` (`YEAR`,
`MONTH`, `HOUR`). Amounts are integer gross values in the stated period, not converted or
annualized at import. Optional `source_published_at` is an ISO timestamp with an offset.
HTTP(S) links cannot contain embedded credentials. CSV quotes escape commas/newlines.

**Re-imports replace all imported content**, not only nonblank cells. Blank optional
values clear previous optional fields. Keep company identifiers and metadata consistent
across a file. Changing company name/website withdraws all its affected vacancies for
review, including siblings outside this file. Do not invent source IDs on each run.

## Validate, preview, import

1. Choose the file and select **Validate file**. No database writes occur.
2. Correct every error. Record 1 is the header; data starts at record 2. A quoted newline
   does not start a new logical record. File-level errors use record 0.
3. Review the create/update/unchanged counts and withdrawal impact. Slug/source conflicts
   and archived companies must be resolved rather than skipped.
4. Select **Confirm import**. The server revalidates the file and preview revision, then
   writes one bounded transaction. A stale preview returns 409 without partial writes.
5. If the response is uncertain, validate again. Source IDs deduplicate retries; do not
   create a new source ID merely to get past a failed response.

New/changed records remain draft/unreviewed. Unchanged re-imports preserve publication;
archived vacancies remain archived. Imports update existing IDs and retain applications.
Changing a file invalidates its previous preview. Large files must be split deliberately;
there is no background import, XLSX mapper, automatic scraping or durable import-history UI.

## Review and publish

Open the queue and **Review** a record. Check company, original source, full description,
location, salary period/currency, skills and support claims. The publish action requires
an operator acknowledgement; it is not a substitute for source permission.

**Verify & publish** makes an eligible record public; **Flag** withdraws it for correction;
**Archive** keeps it and its applications but hides it. Correct content through the source
file and re-import; the current minimal UI does not implement an arbitrary record editor.
An archived company cannot be silently reactivated by publishing a vacancy.

If content/company details changed after the modal opened, publishing returns 409. Reload
the record, inspect the new content and acknowledge again. Do not blindly retry a stale
publish. Review and import lock shared company/vacancy rows consistently.

The queue shows at most 100 records ordered by latest update. Publication/review filters
are in its URL. It is a bounded operator queue, not a complete export or search interface.

## Metrics and limits

Overview counts are one consistent read-only database snapshot: local accounts, profile
rows, organisations, vacancies/review states, applications and their **current** statuses.
Public vacancy count uses the same published + verified + active-company predicate as
public search. Profile rows do not imply complete profiles; statuses are not a historical
funnel. No visits, conversion, delivery statistics or durable import history are claimed.

No raw CSV or candidate data is written to application logs. Authentication, host/theme,
Saved locality and relocation demo limitations remain as documented in the Candidate
verification. Loading data here does not resolve hosting, data-license or legal gates.

## API compatibility

Existing `POST /api/v1/admin/vacancies/import` accepts the documented JSON items array,
up to 50 rows. It now explicitly requires same-origin JSON with a bounded body and current
admin role. New CSV `POST /file` uses `mode: preview | import`; import requires the returned
64-character revision. Private responses are `no-store`.

`GET /api/v1/admin/vacancies/:id` returns complete review content and its revision.
`PATCH /api/v1/admin/vacancies/:id` now **requires `revision`**, alongside `status` and
`reviewStatus`; callers must first read the current record. It no longer accepts blind
publish operations. No shared database schema migration is introduced by this slice.
