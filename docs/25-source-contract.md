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

## Next Runner Gate (TB-C07)

Build source -> bounded fetch -> normalization -> existing dry-run/revision -> bounded
idempotent draft import -> human review/publish. Prevent overlapping runs and keep a
sanitized outcome/checkpoint. Test interruption/retry, changed/unchanged re-import and
application retention. Do not archive a catalogue because a provider failed or a page
was missing. At this slice no schedule, shared schema/data write or live API was activated.

Before the first real pilot, record the exact company/site/region, rights reference,
content owner, allowed fields/volume and target isolated preview. Do not collect candidate
data or call Lever's application POST endpoint: managed TalentBay intake is separate.
