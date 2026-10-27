# First Job Source Contract

Checked: 2026-10-27. TB-C01/C06 engineering work, not source-rights approval or a live run.
First adapter: **Lever Postings JSON API**. Existing CSV remains a correction/fallback path.
No crawler fleet, CAPTCHA bypass, browser automation, AI extraction or candidate submission.

## Source Register

| Source | Verified technical evidence | Decision / missing gate |
| --- | --- | --- |
| Lever Postings | Maintainer docs describe public published postings, JSON, skip/limit, structured country/workplace/salary and plaintext descriptions | Implement one bounded server adapter against fictional fixtures. Specific company/site and republication rights still need approval; no live source configured |
| Greenhouse Job Board | Official docs expose unauthenticated GET published jobs; descriptors are HTML and employment/country facts can require explicit mapping | Viable later alternative, not another parallel connector in this slice |
| ai-job-search | Supplied URL redirects to ai-job-search-dev. At `eb0fcd71fb37dcec582345f2b23c7b20135d2975`, GitHub contents API shows only `.gitkeep` under `job_scraper` | This is a personal Claude Code job-application workflow, not a ready ingestion service for this Nuxt product. MIT code license does not license third-party job content. No external code executed/imported |

Official evidence: [Lever API](https://github.com/lever/postings-api),
[Greenhouse API](https://docs.greenhouse.io/job-board.html),
[ai-job-search](https://github.com/ai-job-search-dev/ai-job-search),
[its code license](https://github.com/ai-job-search-dev/ai-job-search/blob/eb0fcd71fb37dcec582345f2b23c7b20135d2975/LICENSE).
Public access/API availability alone is not a blanket copyright/contract/privacy approval.

## Adapter Boundary

- Server-owned config: site, explicit global/EU region, company metadata and optional exact
  source-location mappings. Never accept an arbitrary fetch URL or applicant credentials.
- Fixed HTTPS provider roots; GET JSON only; redirects refused. Client safety budgets are
  50 rows/page, at most 200 rows plus an end-check page, 2 MiB/page and 10 seconds/request.
  These are our limits, not invented provider quotas. 429 returns bounded retry guidance;
  no unbounded sleeping/retry and no database lock during network work.
- Provider ID determines the stable source key/slug, not the mutable title. Duplicate/
  repeated pages, overflow, malformed JSON and incomplete page sets fail closed.
- Explicit country/commitment/workplace values only. Exact operator mappings can resolve
  a source location; a region string is never silently made into a city. Missing/unsupported
  facts become bounded issue codes, not guessed full-time/onsite/visa/relocation promises.
- Currency/period remain source units. Unknown salary periods, partial/decimal or invalid
  ranges require correction; no rounding or currency conversion. No source publication date
  is fabricated from fetch time. `fetchedAt` belongs to the run report.
- HTML lists/descriptions use [html-to-text](https://github.com/html-to-text/node-html-to-text),
  MIT, 10.0.1 (Node >=20.19; compatible with locked Node22); external type definitions9.0.4.
  Parser is checked with its real library, not an ad-hoc HTML regex. Images/scripts/styles
  and link destinations are excluded, no resources execute/fetch. Bounded omissions are
  surfaced for review, never silently published as a complete description.
- Output uses the existing import schema and separates valid items/issues/counts/provenance.
  It does not import or publish. Any issues require review before a runner is allowed to
  commit a batch; raw responses are not error messages/logs.

## Runner (TB-C07)

`/ktulhu/v1/sources` uses current-admin, no-store APIs at `/api/v1/admin/sources`.
The server-owned registry is **empty by default**. Adding an exact Lever site requires a
reviewed config and dated approval reference/content owner, not an arbitrary UI fetch URL.
`FETCH`, `PREVIEW`, `IMPORT` are strict same-origin commands (4 KiB). The command selects
an approved key; it never supplies company metadata, credentials or source content.

Additive migration0004 creates one latest `source_imports` checkpoint per source. Fetch
claims a 90-second lease in a short transaction; at most five 10-second requests happen
outside all SQL locks. A late worker cannot overwrite a replacement run. Malformed or
partial page sets/normalization issues fail the **whole snapshot**, without partial import
or archiving absent jobs. 429 backoff is enforced across new run IDs. A complete empty
feed does not mean the catalogue should be archived.

The normalized snapshot is limited to 200 records / 2 MiB encoded JSON, READY for 30 minutes.
This is an eligibility deadline, **not automatic storage erasure**: payload clears on complete
import, replacement or the next authorized expired-progress read. Only the latest report
is retained; this is not an import-history product. Raw provider responses are not stored.

Each preview covers the next <=50 records and current company-wide publication impact.
Confirmation verifies the exact revision and current role inside a transaction. The batch
and advancing offset/counters commit together, using the existing importer/publication
rules. Replayed last confirmation returns the checkpoint instead of writing/counting twice.
Another process/pool can resume the next batch. A stale preview requires preview again,
not a source refetch. Completed snapshot payload is removed. Record IDs/application links
survive; changed content is draft/unreviewed, unchanged published content stays published.

Operator sequence: select source -> Fetch -> Preview next batch -> Confirm -> repeat
preview/confirm until IMPORTED -> existing vacancy review queue. After a failed/lost
response, reload progress before repeating. IMPORTED means source records processed,
not publicly published or checked by a human. FETCHING/READY blocks a competing new run
until completion/expiry. An abandoned/expired run can be replaced; new fetches use stable
source IDs, and no previous completed batch needs deletion to retry.

### Runtime / Schedule Preparation

Checked official [function duration](https://vercel.com/docs/functions/configuring-functions/duration)
and [Cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing) on 2026-10-27.
Fluid Node default/Hobby maximum is documented as 300s; Hobby Cron is at most daily with
hour-level timing, not a precise hourly poller. Actual target configuration/hosting eligibility
still needs H acceptance. The fetch budget is <=50s, separate from small batch confirmations;
SQL lock wait 5s / individual statement 15s bounds are not a claimed full-transaction SLA.

Prepared launch policy: one selected board, at most one daily fetch (proposed `40 0 * * *`,
UTC, not activated), no retry loop or auto-publication. Before activation, add an authenticated
scheduler entry/secret directly at the provider, verify the exact target/runtime/approved
source and costs, and exercise it in isolated preview. Cron must call the same durable
runner, not a build hook or an in-memory timer. No cron endpoint/config, shared migration,
live schedule, provider call or cloud credential has been activated in this slice.

### Verification Boundary

Real service + disposable PostgreSQL tests cover concurrent run/confirm, a new pool between
batches, stale preview, lease takeover/late worker, page failure/invalid record/size/backoff,
revoked role, unchanged/changed re-import and application retention. Browser tests exercise
real empty-registry/authorization routes. The active-source UI walkthrough uses intercepted
fictional responses, explicitly **not** a live end-to-end provider claim; the service is tested
with injected offline fetch and real SQL separately. No production test-source bypass exists.

Before the first real pilot, record the exact company/site/region, rights reference,
content owner, allowed fields/volume and target isolated preview. Do not collect candidate
data or call Lever's application POST endpoint: managed TalentBay intake is separate.

## Dates and Maintenance (TB-C04)

The current vacancy has separate nullable facts, not a generic freshness flag:

| Field | Meaning / writer |
| --- | --- |
| `sourcePublishedAt` | Source-supplied publication instant, if actually available; input content, never inferred from fetch/import |
| `sourceFetchedAt` | Latest successful complete source snapshot used by an import; supplied by the trusted runner, not a CSV date or client command |
| `lastImportedAt` | Latest committed processing of this source record, including an unchanged re-import; not a human review |
| `talentbayPublishedAt` / public `publishedAt` | Current publication on TalentBay after a draft/archive -> published action; recheck alone preserves it |
| `reviewedAt`, `reviewedByUserID` | Last recorded current-admin publish/recheck or first flag of current content; reviewer identity is admin-only |

Archive preserves known current-content review facts, but clears current publication.
Unreviewed resets review facts. Content/source-publication or company-metadata correction
clears review/publication; sibling company records are withdrawn together, archives stay
archived, IDs/applications survive. The operator corrects via fixed CSV, reloads the review,
checks content/source/permission and republishes. No universal editor is required.

Unchanged imports advance observation timestamps only; they preserve `updatedAt`, review,
publication, content-preview revision and held review revision. An older snapshot cannot
move `sourceFetchedAt` backwards. A failed/partial fetch does not update vacancy observations
or archive jobs. A successful fetch/HTTP200 does not establish current availability or legal
permission. No automatic N-day expiry or "fresh" badge exists without an approved policy.

For maintenance, select the listing in the existing queue, compare source and content,
then use checked **Recheck listing**, **Flag** (withdraw) or **Archive**. Recheck records the
current reviewer/time without advertising a new publication. This is latest-state metadata,
not a full historical moderation ledger or independent verification certificate. The source
register's content owner owns the refresh/rights decision; the logged-in operator records
the actual review. A specific real owner still belongs to each source's approval gate.

Migration0005 adds nullable millisecond-precision timestamps/reviewer FK with no backfill.
Old `published_at` remains a compatibility ordering key: historically it mixed source and
TalentBay dates, so it is not used as evidence for either new fact. Legacy/public dates
remain null / **Not recorded** or **Publication date unavailable**, not Jan1970 or Today.
Explicit recheck can add a real review but cannot reconstruct an unknown old publication.
The DTO never includes reviewer identity. Public date display uses UTC; a future/invalid
publication cannot get a relative age. Current catalogue ordering retains the legacy key,
so unknown-date legacy rows can still have their prior ordering position.

Run0005 only after the target/backup/rollback approval gate, before deploying code that
selects the new columns. Old code can run with the additive columns; rollback means return
to the previous app build and retain the schema/data, not drop columns or erase reviews.
Never put migrations into a Vercel build hook. Local legacy-fixture and full migration/
SQL/browser evidence belongs in docs14, not a shared-database migration claim.
