# Operations Metric Contract

Updated:2026-10-27. F01/F02, not product analytics, hiring evidence or an SLA.

## Clock, grain and read contract

PostgreSQL is the source of truth. All queries in one response use one read-only
REPEATABLE READ transaction, a5s statement timeout and its transaction timestamp.
`asOf` is UTC, millisecond precision; the small remainder of that millisecond belongs to
the next report. Activity uses rolling7/30/90*24h, `[from,before)`, not local calendar days.
Period selection changes activity/cohort measures only; current work/inventory is all-time.
Refresh opens a new snapshot; clicking a link opens a fresh authorized read, not a frozen
historical report. Concurrent changes can legitimately change the next queue's total.

Every count is a number of records or distinct applications as specified below. There
is no inferred denominator/conversion rate; in particular a stored profile is not a
complete or contactable profile. No visit/session/device tracking is added.

| Metric | Source / numerator | Denominator / exclusions | Action |
| --- | --- | --- | --- |
| Accounts | `users` rows, including operators | Count, not active candidates | Users registry |
| Stored profiles | `candidate_profiles` rows, even empty | Not completeness or contact permission | Data inventory only |
| Organisations | All organisation rows | Not active employer clients | Inventory only |
| All vacancy records | All vacancy rows | Includes draft/archived | Review registry |
| Unreviewed / flagged | Exact current `review_status` | Includes non-public records | Same review filter |
| Public vacancies | PUBLISHED AND VERIFIED AND organisation ACTIVE | Same predicate as public list/detail/total | `publicOnly=true` in admin queue; status alone is insufficient |
| Applications | All actual application rows | Includes legacy and withdrawn; retries are not new rows | Full bounded queue |
| Current application statuses | Rows grouped by `applications.status` | Current distribution, never a historic funnel | Exact status filter |
| Current handling stages | Rows grouped by `handling_stage` | Includes legacy/default states; not event counts | Exact stage filter |
| Awaiting start | Active work AND stage RECEIVED | Active = not WITHDRAWN/REJECTED and stage not CLOSED | `work=active&stage=RECEIVED` |
| In progress | Active work AND stage not RECEIVED | Includes contacted/shared/follow-up; not just IN_PROGRESS enum | `work=in-progress` |
| Needs an operator | Active work without an assigned current ADMIN | Includes NULL, deleted or role-revoked assignees; no automatic reassignment | `work=needs-owner` |
| My active work | Active work assigned to current authenticated operator | No selected arbitrary operator parameter | `work=active&assignee=mine` |
| Oldest awaiting start | First5 awaiting-start rows by created_at ASC,id ASC | Age=max(0,asOf-created_at); no guessed overdue threshold | Exact ID opens review, even outside current first25 |
| Applications received | Rows whose created_at is in selected window | All statuses/legacy; no event backfill/inferred registration | Fixed receivedFrom/receivedBefore |
| Company contact recorded | DISTINCT application_id with effective CONTACTED event recorded in window | Event.created_at, not operator-supplied occurredAt; retries/multiple contacts count once | Same recorded filter/window |
| Profile handoff recorded | DISTINCT application_id with effective SHARED event recorded in window | Not delivery/read/hire; corrected SHARED excluded from this metric, but still blocks resending | Same recorded filter/window |
| Average wait to first recorded start | AVG(first STARTED.created_at - application.created_at), seconds | Only received-window rows with non-NULL snapshot and a non-future, non-negative actual STARTED event; excludes unstarted/legacy missing history | Display actual sample count beside all received records; not a conversion/SLA |

An effective contact/handoff has no CORRECTED event targeting the same application and
revision. Corrections outside the selected window still invalidate that historical fact
in the current report. Results are therefore restatable, not immutable reports. Reopening
or another stage does not erase real prior contact. STARTED is not correctable; assignment,
RECEIVED, CORRECTED and REOPENED are not first-start samples. An application's eventual
withdrawal does not erase its earlier recorded work. See docs29 for consent semantics.

## Bounds and failure behavior

Application drilldowns return25 rows plus a full matching total in one consistent read;
the numeric `before` cursor remains backward compatible and never changes the total.
Windows require both valid ordered bounds, maximum90 days; recorded filters also require
an allowed event kind. No arbitrary JSON/SQL filter or operator ID. Unknown API filters
are rejected. Dashboard returns at most5 oldest records with ID/job/company/date/age, no
candidate names, contacts, submission snapshots, notes, references or provider identifiers.
All routes require current server ADMIN authorization and `no-store`, including denials.
The UI clears account resources, preserves filters in URL and exposes retry; a failure is
not displayed as zero/empty data. Counts are never fabricated when PostgreSQL is missing.

Migration0009 adds created-time indexes for the actual cohort/oldest/event-window reads.
It is schema-only and has no backfill, deletion or new telemetry table. Existing
application/revision index supports targeted-correction lookup. A shared deployment needs
separate migration approval and an index-build/lock window; code build never migrates.
Representative volume/explain checks belong to G03, not an invented production capacity.

## Evidence and limits

Implementation uses existing Drizzle typed queries/SQL and PostgreSQL, not a BI dependency.
Confirmed against [Drizzle select/aggregate documentation](https://orm.drizzle.team/docs/select)
and [PostgreSQL18 isolation](https://www.postgresql.org/docs/18/transaction-iso.html),27Oct.
Task completion/evidence is recorded in docs14 after checks, not implied by this contract.
No growth/hire/delivery charts, automatic employer status, on-call promise or approved
retention/support policy. Candidate privacy and current-role checks still apply to all
detail/package actions after a dashboard link. The expanded admin redesign remains gated.
