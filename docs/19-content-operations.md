# Content Operations

Updated: 2026-11-20. Covers the operator import workflow; no real source is enabled by this guide.
Implementation/design contract: [18-admin-import-contract.md](18-admin-import-contract.md).

## Pick a source before entering any jobs

**Decision, 20 November: show the product first.** A client is not required for the
demo. Use [the isolated fictional catalogue and operator walkthrough](21-local-product-review.md#walkthrough).
The demo exercises a real application receipt and operator queue without contacting
employers. It is not a catalogue of live openings.

For a later external feed, filter twice: (1) the source terms cover this use and
the structured facts we display; (2) the posting identifies a direct employer
recruiting channel for this vacancy, or a permitted employer feed explicitly maps
the channel to that posting. A generic homepage, ATS Apply button or guessed inbox
does not qualify. Skip missing/ambiguous matches; don't fill gaps using AI. Keep
contact evidence private for the operator, not in the public description. Contacting
the employer and transferring a candidate profile remain separate steps. **The Lever
normalizer does not establish this contact today.** Keep live sources disabled until
a named feed and a tested filter support both checks. Own TalentBay vacancies are a
separate future source, not proof of an outside client or an open role today.

Prefer a feed or export supplied by the employer. A person reviews the batch and releases
it; nobody should retype the advertisements. Source availability and the candidate handoff
are separate decisions:

| Source | Automation evidence | Decision before a real run |
| --- | --- | --- |
| An employer on [Lever](https://github.com/lever/postings-api) | The official demo endpoint returned HTTP 200 and structured posting IDs, URLs, locations and optional salary. The existing TalentBay adapter previews a bounded board, then imports selected batches as drafts. No scheduler or real board is enabled. | Agree the exact employer board/region, fields and display scope. Agree who may receive a candidate and how. A single permitted posting is not permission to fetch the whole board. |
| Employer's own CSV export | An export matching the template can be imported in a single batch, validated before writing. No need to recopy each role. | Confirm the employer can supply approved text, stable IDs and closure updates. Use the agreed contact for candidate outreach. |
| [We Work Remotely programming RSS](https://weworkremotely.com/remote-job-rss-feed) | The documented public feed returned HTTP 200; items exposed title, GUID, source link, region, category and publication date. There is **no RSS adapter** or source-only Apply mode in TalentBay. | The feed page permits feed use with attribution and links to WWR. It does not establish employer consent to forward profiles. Before enabling, review the [current terms](https://weworkremotely.com/terms-and-conditions) for the intended use. For an agreed link-only selection, use facts and attributed links, not descriptions, logos or internal Apply. Remote location is not a relocation/visa offer. |

This was a read-only feasibility check, not legal clearance, ingestion or publication.
Lever's [Postings API introduction](https://github.com/lever/postings-api#introduction)
explicitly discusses third-party collection of published postings. Its JSON API can
return the role, location, original link and optional salary range without logging in.
That documents a way to read the facts, not the terms for TalentBay to display a
particular employer's listing or send them a candidate. Record those decisions
separately before a pilot; no new adapter or manual data entry is needed for Lever.
WWR's October 2026 terms reserve uploaded content rights to its owners and grant a
limited right of access; the specific RSS instructions do not appoint TalentBay as a
recruiter. A first-party employer feed is the better fit for the internal Apply pilot.
Do not build a substitute feed from logged-in pages or infer permissions from a successful
GET. For a product demo without a cleared source use the isolated, labelled synthetic
review data, never the public catalogue.

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

## First employer: one vacancy

**Request to copy to the CEO or employer:**

> Please send one currently open vacancy for the TalentBay pilot:
>
> - **Listing:** Employer name; source name, original posting URL and stable job ID; role title,
>   employment type, workplace type, two-letter country code and the plain-text description
>   we may publish. Include salary, city, visa or relocation support only if confirmed.
> - **Publication permission:** Who owns the content? Give the dated permission reference,
>   applicable terms, and where and for how long TalentBay may display this listing and its
>   text. Identify who will tell us about corrections, closure or withdrawal of permission.
> - **Direct contact:** Identify a current employer recruiting channel tied to this role
>   privately. A posting URL alone is insufficient for real third-party listings.
> - **Applications (separate decision):** May TalentBay contact the employer and manually
>   forward an application for this role with the candidate's permission? If yes, identify
>   the approved recipient and channel privately; if not agreed, say so. Publishing the
>   listing does not send an application or authorize forwarding.

**Operator acceptance checklist (first create only):**

- [ ] Confirm the owner has approved **this listing and this preview environment**. If no
  authorized listing, cleared description or required fact is available, keep the real catalogue
  empty. Do not import the header alone, a demo row or placeholder text. Permission for one
  listing does not enable a board fetch or schedule; see the [source contract](25-source-contract.md).
- [ ] Use the header-only template above with exactly one data row. Assign stable
  `company_slug` and `vacancy_slug`; check the [fields](#fields) for required values and
  salary units. Leave unconfirmed optional facts blank. Keep permission evidence and private
  forwarding details outside the CSV; follow the [operator runbook](31-operator-runbook.md#handle-one-application) before any handoff.
- [ ] Select **Validate file** (no writes). Expect the intended company and role on record 2,
  no errors, **Created 1, Updated 0, Unchanged 0**, and no publication-impact warning
  (0 withdrawals). Stop on any mismatch; do not change the source ID to force a create.
- [ ] Select **Confirm import**. Find the row in the review queue as `DRAFT` / `UNREVIEWED`;
  it must not appear in public Jobs yet. Compare the facts, text and source against the
  permission. For an external role also confirm its direct recruiting channel. If the
  channel or right to display the facts is absent, leave it unpublished. Otherwise
  acknowledge the review and select **Verify & publish**. Never infer permission to
  send a candidate's information from approval to publish.
- [ ] In the same preview, find the role in public Jobs and open its detail page. Match the
  employer, title and original source link to the approved row. The public count should rise
  by one if nothing else changed; a count alone does not verify the listing.

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
an operator acknowledgement; it is not a substitute for source permission or a direct
contact for a real external vacancy.

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
