# Architecture

Last updated: 2026-10-27 (code/test reconciliation; not a new deployment verification)

## System Shape

TalentBay is a Nuxt 4 modular monolith:

```text
app/pages                 route-level UI
app/components            product and domain UI
app/composables           browser/client state
server/api/v1             thin HTTP handlers
server/services           business rules
server/repositories       persistence and preview-data selection
server/db/schema           Drizzle PostgreSQL schema
server/db/migrations       versioned SQL migrations
shared/types              shared transport and session contracts
tests                     unit tests for business rules
```

Splitting services or introducing a monorepo is not justified until a separate workload, ownership boundary or scaling requirement exists.

## Rendering

- Nuxt SSR is enabled globally.
- `/jobs/**`, legal status pages and public product surfaces are server-rendered.
- `/user/**`, `/orgs/**` and `/ktulhu/**` remain client-rendered because they are authenticated application surfaces.
- `/`, legacy landing, presentation and whitepaper routes redirect to `/jobs`.

Browser-only APIs must remain inside client lifecycle code.

## UI

- New product UI uses Nuxt UI 4, Tailwind CSS 4 and Manrope.
- Redirected legacy pages no longer compile their former Bootstrap/SCSS UI.
- New UI is grouped by domain within Nuxt directories rather than strict FSD.
- Figma is the review surface for foundations, components and page concepts.
- Responsive Candidate v1.0 is implemented in the integration line, with focused workflow
  deviations in docs17; remaining UX tasks and independent acceptance are not called done.
- Relocation preserves vacancy context/back state; handoff node `2078:35` does not require
  a new top-level route. See `docs/10-design-direction.md`.

## Data

- PostgreSQL is the production source of truth.
- Drizzle schema and migrations are committed.
- Public vacancy reads use PostgreSQL when `DATABASE_URL` exists and an explicitly labelled preview dataset otherwise.
- Imported vacancies are idempotent by `(sourceName, sourceExternalID)`.
- New imports enter `DRAFT` and `UNREVIEWED`; the publish action requires `VERIFIED`.
  Changed re-imports return to draft/unreviewed (archives stay archived); unchanged
  content returns `UNCHANGED` and preserves review/publication/content timestamps while
  advancing only recorded import/source observations (see docs25).
  Changes to shared company details invalidate all of its vacancy reviews atomically.
  Public list/detail/count require published, verified content and an active company.
  Applications use the same visibility conditions, reject labelled demo content and lock
  the vacancy/company during submission so an import cannot invalidate the eligibility
  check before the application is inserted. IDs and existing applications are retained.
- Relocation reads require `VERIFIED` plus valid cost/tax/source/review date structure,
  not just the status string; invalid rows are excluded. Demo remains labelled fallback.
  D01/D02 package,11-city coverage, math/input limits and remaining data gates: docs26.
  Preview API requires explicit location/annualGross; no hidden London/110000 default.
  D03 adds the full package snapshot/import actor/time via nullable0006. Public reviewed
  data also needs matching calculation columns and current package validity; legacy metadata
  is not inferred. Privileged local-only engineer CLI has read-only preview, revisioned
  atomic apply/no-op replay and a fail-closed cloud-target gate (docs26). No new HTTP route
  or broad admin editor. The private snapshot/reviewer/import actor are not public DTO data.

### Public Vacancy Pages (TB-C02)

`GET /api/v1/vacancies` returns `items`, filtered `total`, `dataStatus`, `nextCursor`.
Each request allows1..50 records (default20). `before=nextCursor` selects the next bounded
page; no expanding limit, offset scan or catalogue-wide response. Newest order is
`published_at DESC NULLS LAST, id DESC`. SQL cursors preserve microseconds as UTC text;
JS Date millisecond truncation must not drop timestamp ties. Legacy NULL dates sort last.
Rows/count use the same read-only repeatable-read snapshot. Across requests this is a live
catalogue, not a frozen export: changed/re-published records can move; archive is always
rechecked, including when the cursor row itself disappears.

The opaque, non-secret cursor is <=512 characters, strict/versioned and bound to normalized
filters, order and page size. It is not an authorization token: public visibility filters
always apply. Invalid/stale-filter cursors and invalid limits return400, not a silent reset.
Country/currency normalize to uppercase. `salary-desc` now requires both `salaryCurrency`
and `salaryPeriod` and filters to those exact units; comparing USD/year with EUR/month is
not a ranking. This intentionally rejects the old unqualified salary-sort API; current
Jobs UI uses newest order. No FX/annualization guess is introduced.

Jobs keeps the cursor with existing filters in the URL. Older/Newest links target the
results anchor, because Nuxt4.6.2 intentionally keeps position for same-path query-only
navigation. Native router history restores the exact page/scroll after detail; tested with
111 real SQL fixtures and SSR first page. Filter/search changes omit the old cursor.
An invalid cursor retains a usable Newest restart link. Demo data uses the same cursor
contract, not a separate unbounded fallback. C04 separates source publication, fetch,
import, current TalentBay publication and current-content human review (docs25). Public
`publishedAt` is now nullable, from `talentbay_published_at`, never the ambiguous old
ordering column. Missing legacy facts stay unknown; no epoch sentinel or fabricated
freshness. New additive migration0005 has no backfill. Public DTO includes provenance
dates but no reviewer identity; current-admin API records the actual actor, not a body ID.

Existing indexes include public status/date, company/location and GIN description/title
search. Real EXPLAIN on a 111-record fixture verifies a bounded 51-row query; it is not a
representative production benchmark or proof of index selection at scale. No speculative
index migration or external search engine is added; remeasure the approved pilot volume
and search mix before changing indexes. [PostgreSQL ordering](https://www.postgresql.org/docs/18/queries-order.html)
and [LIMIT](https://www.postgresql.org/docs/18/queries-limit.html) semantics checked27.10.

## Auth and Authorization

- Provider-first through Google, GitHub and server-validated Telegram initData.
- OAuth identities map to permanent local users.
- Existing provider subjects retain their local user IDs. New provider subjects are never
  auto-linked by email; explicit linking proves the current account and the new provider.
  Telegram-only users have a NULL email. See ADR 0007 and migration 0002.
- Server session shape is normalized and typed.
- Candidate profile/application endpoints require a user session.
- `/api/v1/admin/**` requires the `ADMIN` role in server middleware.
- Admin pages also declare role metadata for client navigation.
- Admin handlers and middleware share a request-scoped guard which verifies the current
  database role/account, including immediate revocation of old ADMIN sessions.

Client route guards are UX only; server authorization is the security boundary.

### Admin Lists (TB-C03)

Users/review queues expose bounded pages (default25, max50), filtered total and nextCursor.
Date/ID keysets preserve PostgreSQL microseconds. Their cursors are scope/filter/page-size
bound and cannot be exchanged with public or other admin lists; invalid input returns400.
Users sort by creation; vacancies by last update, so changed imported content returns near
the review queue's top. Counts/rows use one read-only snapshot, not a frozen multi-page export.
Search is literal bounded text (LIKE wildcards escaped), committed through a form into
the URL. Filters/search reset the cursor; selected review ID/page/filter/hash survive reload.
Account changes clear the resources. Existing application queue/handling is not rewritten.

Every protected admin API response is no-store, including stale-role/anonymous denials.
Each handler still independently checks current admin authorization. User transport keeps
only the existing account fields; no profile/contact/session/identity corpus is added.
Horizontal table regions remain local to the tool, focusable and keyboard-scrollable;
they do not widen the mobile page. Dashboard metric links use an explicitly imported
NuxtLink, not a dynamic global component lookup that can silently produce non-links.

## Current Domains

- `auth`
- `candidates`
- `organisations`
- `vacancies`
- `applications`
- `relocation`
- `admin`

## Known Constraints

- Neon service-level integration passed in July; that does not prove present readiness.
  October metadata shows archived branches; SQL/schema/data have not been reverified.
- Disposable PostgreSQL CI and real API/session/browser tests pass on the integration
  line with synthetic providers/data; real Google/GitHub/native Telegram acceptance remains open.
- Current integration uses nuxt-auth-utils0.5.32; the old0.5.29 baseline is historical.
  Dependency residuals are in docs16. Do not equate tested code with deployment.
- Vercel metadata Node 24.x differs from Node 22 engines/CI; do not change cloud settings implicitly.
- The relocation calculator uses demo figures until approved sources are loaded and reviewed.
- Company self-service is deferred; admin-managed vacancy ingestion is the first workflow.
- The main CSS entry is about 197 kB before gzip (about 29.5 kB gzip), primarily Tailwind and Nuxt UI.
- Public legal documents are pending founder/legal approval and block production launch.

Current SHA, provider evidence, checks and next task: `docs/14-mvp-execution.md`.
