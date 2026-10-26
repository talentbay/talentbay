# TalentBay Roadmap

Last updated: 2026-10-26
Active path: MVP first on Nuxt/Node + Vercel + Neon.

This replaces the Cloudflare-first ordering dated 2026-10-03. Phase numbers below refer
to this revision. Code progress and external environment readiness are tracked separately
in `docs/14-mvp-execution.md`. No calendar dates are promised.

Execution order: baseline/CI -> M2.1 OAuth security -> early M4.1 re-import safety ->
M2.2-M2.5 identities/Telegram/linking -> Candidate -> minimal CSV/content -> beta.
Stable task IDs remain below; phase grouping does not postpone the early M4.1 safety PR.

## Phase 0 — Candidate design (frozen)

Status: DONE as a design handoff, not implemented product UI.

Use Candidate v1.0, the active responsive page and the `99 Utilities` v1.0 handoff.
Preserve the `lg` / 1024px wide-layout contract and shared component/state ownership.
Archives are reference only. Full admin design remains deferred.

## Phase 1 — MVP baseline and delivery safety

Status: IN PROGRESS.

M1.1 — Reconcile plan, roadmap and agent rules; defer PR #24 without deleting the work.
M1.2 — Retain Node CI gates and run existing database workflow tests against disposable
PostgreSQL with committed migrations, without cloud secrets.
M1.3 — Audit project/branch/access and dependency/security gaps; record evidence instead
of treating historical docs as live verification.
M1.4 — Configure Vercel preview delivery and controlled production promotion after the
correct team/project permissions and commercial/private-org plan are approved.
M1.5 — Verify separate preview/production DB targets, rollback ownership and callback
origins; do not migrate or seed shared databases implicitly.

Exit: reproducible Node checks and a reviewed preview/release procedure. If provider
access/billing is blocked, continue M2/M3 code against isolated tests rather than waiting
or silently switching hosts. External release gates stay open.

## Phase 2 — Unified auth on the existing runtime

Status: CODE IMPLEMENTED in the unmerged MVP line; live-provider acceptance pending.

M2.1 — Patch the confirmed OAuth advisory with a bounded dependency update and real
library/route state-validation regressions. Preserve existing verified-email linking.
M2.2 — Add a backward-compatible identity model and migrations for Telegram + existing
Google/GitHub users; preserve existing user IDs and application/profile relations.
M2.3 — Server-validate Telegram initData, resolve the local account and issue normal
sessions; test invalid/expired/tampered payloads and duplicate/concurrent identity cases.
M2.4 — Implement explicit secure linking and conflicts without blind email merging.
M2.5 — Verify web and Telegram login journeys on a stable preview origin when provider
credentials/access are available.

Exit: shared local accounts with server authorization and tested auth logic; real-provider
browser/WebView verification is required before declaring auth complete.

## Phase 3 — Responsive Candidate v1.0

Status: CODE IMPLEMENTED in the current Candidate branch; local Chromium/API/Postgres checks
passed. Native host/live-provider acceptance is still pending; see the execution log.

M3.1 — Shared shell/navigation, tokens and host adapter with ordinary web fallbacks.
M3.2 — Jobs + Vacancy Detail, search/filter/sort, local Saved and restoration of list state.
M3.3 — Relocation inputs/result/provenance using supported backend fields only.
M3.4 — Profile, application preflight/review/submit, Applications list/detail/statuses.
M3.5 — Settings, first launch/deep links and loading/empty/error/offline recovery.
M3.6 — Browser and Telegram validation at 320, 390, 768, 900, 1024 and 1440px, including
keyboard navigation, focus, reduced motion, safe areas and no horizontal overflow.
M3.7 — Candidate withdrawal and read-only minimal operator access. Preserve the record
and employer-status meaning; verify both participants. Before beta, agree
and implement the actual application route for imported vs partner vacancies; an internal
review is not employer delivery. See `docs/22-application-review-contract.md`.

Exit: one application usable as desktop web, mobile web and Telegram Mini App. No duplicate
Telegram page tree, invented server capabilities or fake permission/settings controls.

## Phase 4 — Minimal real-content workflow

Status: M4.1-M4.4 CODE IMPLEMENTED in the unmerged MVP line; M4.5 approved real content
remains pending. Operator verification and exact delivery states are in the execution log.

M4.1 — Protect existing import/review/publish invariants immediately after M2.1, in a
separate small PR. Reproduce changed re-import exposure; preserve IDs/applications/dedupe,
align list/detail/total visibility and test unchanged/archived cases. See execution log.
M4.2 — Agree a fixed CSV template and design/review the minimal file-import UI delta.
M4.3 — Parse bounded files, validate all rows, report errors and provide a dry run.
M4.4 — Import through server-authorized existing operations into controlled draft/review
states, with dedupe/idempotency and explicit publishing. Keep JSON compatibility.
M4.5 — Load a small approved real vacancy set and verify edit/archive/application behavior.

Exit: operators can load vacancies without entering every one manually. A universal XLSX
mapper, asynchronous import service and large admin redesign are not release prerequisites.
No new admin UI is built from archived concepts; the small new flow needs design review.

## Phase 5 — Release verification and controlled beta

Status: PLANNED.

M5.1 — Verify DB migration/backup/restore and rollback procedure on preview.
M5.2 — Exercise real login, account linking, profile editing, Saved, apply, duplicate apply,
application ownership, admin access and import/review/publish.
M5.3 — Confirm commercial hosting entitlement, production secrets/callbacks, bot menu,
final domain ownership and deployment promotion rules.
M5.4 — Obtain approved terms/privacy and permitted data sources. Mark any remaining demo
relocation data clearly; do not imply it is reviewed.
M5.5 — User approves production release, then deploy, smoke-test and inspect logs.

Exit: evidence-backed beta, not merely a green build. Do not skip auth/authorization,
content integrity or data safety to shorten the schedule.

## Phase 6 — Expanded admin (post-MVP design gate)

Design the new responsive admin workspace before its implementation: vacancies/imports,
relocation data, users/roles and audit/operations. Reuse active design-system components.
Then add XLSX/arbitrary column mapping, import history and larger batch processing where
real operator usage requires them. Employer self-service follows stable admin operations.

## Phase 7 — Product extensions

Server-backed Saved + local-data migration, notification preferences/delivery, additional
reviewed relocation datasets, privacy operations and real localization. Enable user-facing
controls only when the corresponding backend/policy is ready. Notification permission
alone does not mean that the bot notification service is implemented.

## Phase 8 — Optional infrastructure evolution

Evaluate Cloudflare Workers/Hyperdrive, queues, separate bot/import workers, object storage
and analytics against measured needs. PR #24 is preserved as a deferred draft experiment.
A migration or service extraction requires a new explicit decision and verification; it
must not reappear as an unstated prerequisite for Candidate v1.

## Working rules

- Finish and verify one coherent code change before expanding scope.
- Use PRs; no unreviewed production switch or shared DB migration.
- Track implementation, checks, merge and deployment separately.
- Keep a visible next task and named external blockers in the execution log.
- Preserve existing tests and add regression coverage for confirmed bugs.
- Do not start trials/paid plans, move domains or request raw credentials in chat.
