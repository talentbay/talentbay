# MVP Execution Log

Updated: 2026-10-27
Active decision: `docs/adr/0006-mvp-first-vercel-neon.md`.
Work branch: `feat/mvp-vercel-baseline`; PR: https://github.com/talentbay/talentbay/pull/25
Security branch: `codex/oauth-state-security`; PR: https://github.com/talentbay/talentbay/pull/26

## Autonomous Run Started - 2026-10-27

### Managed handling / progress slice

Branch `codex/application-handling`, product commit `42520a2` / [#40](https://github.com/talentbay/talentbay/pull/40),
baseline `31af293` / [#39](https://github.com/talentbay/talentbay/pull/39).
Both #39 CI jobs SUCCESS, run `40469299092`; only integration was fast-forwarded, not main.
B04/B05/B06 core code: strict bounded current-admin commands, assignment/ownership,
expected revision, per-command replay/digest, locks, separate contact/manual handoff,
snapshot package preview/copy and private journal. Missing/legacy/changed/withdrawn
packages are denied; preparing is read-only; employer stage is not reinterpreted.
B07: owned public event projection, 25-record candidate/history keyset pages, server-side
active/closed counts and a separate per-vacancy lookup (old applications cannot fall out
of duplicate detection). Account changes clear selected private detail. B08/B09 cover
withdrawal/share races, closure reasons, replay after a lost committed response and
synthetic received/in-progress/shared/closed/legacy fixtures. No external company contacted.

Checks: 119 unit, 51 SQL, 24 tooling, typecheck/lint, Node build/smoke, 16 public
browser, final full 12 DB browser PASS, plus focused handling browser rerun after a users API
shape fix. Manual dev review caught that hidden transfer control; tests now assert its
visibility and capture client runtime errors. Consistent read-only progress transaction,
closure without employer rejection, and operator/candidate 320/390/1440 modal viewport
checks passed. Synthetic record count/seed and candidate history were also read in dev UI.
The screenshot-only follow-up waits for dialog opacity 1: the first 320px capture was
taken during the normal fade, not evidence of a transparent final panel. Focused browser
rerun passed; no UI animation suppression or production behavior change.
Vercel adapter build/assertion PASS (Node22, 67 routes, one function), no deploy.
Fresh `pnpm dev:review --port 3132 --portal-port 3133` seeded all five fictional states
through real APIs except the explicitly legacy row. Six published fictional jobs; London
remains unapplied. Native/live provider, actual data/policy/operational acceptance stays open.

Limits: no automatic sender or verified employer receipt; real-data sharing still G05.
Reopening/correcting a closed/handoff record is not a generic edit endpoint; event
correction/reopen acceptance remains a B04/B09 follow-up before calling that group complete.
Full admin redesign and relocation part of E01 remain separate. Next independent code
slice: first-time Apply/profile return path, then source/relocation/bot tasks by the backlog.

### Foundation complete; snapshot intake in progress

Foundation `85fceef` / [PR #38](https://github.com/talentbay/talentbay/pull/38): both CI jobs
SUCCESS, run `40468000146`. Advanced only `codex/mvp-integration` by fast-forward; main and
production unchanged. Vercel adapter build/assertion PASS: Node22, 63 routes, one function.
A02 is now verified on the actual topic-PR workflow; no independent-review claim.

TB-B01 contract and application part of E01 are in docs22. TB-B02/B03 branch
`codex/managed-application-snapshots`: additive migration0003, server snapshot/contact and
versioned acknowledgment, receipt/withdraw events, admin submitted-vs-legacy profile.
Before migration, inserted a synthetic old-schema application in disposablePG56381;
after migration ID/user/vacancy/status/note survived, snapshot remained NULL, history empty.
Local 116 unit/41 SQL, typecheck/lint, Node build, HTTP smoke and 10 DB browser tests PASS.
Focused preflight 320/390/1440 screenshots and geometry assertions PASS after fixing a
title/Close overlap found at 320px. These tests use fake profiles/providers;
no real contact, delivery, shared migration or public release. B04 commands remain next.

Direct owner instruction: execute the agreed plan autonomously. Current executor continues
without a model switch or a separate background automation. Production/paid/shared DB and
real external contact gates remain unchanged. Scope: 11 cities, profile (CV later), basic
SaaS bot, first source pipeline, managed applications, all checks per slice.

A01: verified live refs #25-#37; all required heads are ancestors of `4e1be73`.
Created `codex/mvp-integration` at that head, no main merge. Topic PRs target integration;
#24 remains deferred. A02 adds the integration push/PR filter, not deployment rights.
A04 corrects stale developer-test instructions and documents the environment passport.
A03 registry audit found fresh findings; compatibility/security checks in progress.

Foundation local checks: frozen install, typecheck, lint, 112 unit, 37 disposable-PG,
24 tooling, 16 public browser and 10 database browser tests PASS; Node build and compiled
HTTP smoke PASS. Tooling needed an authorized loopback rerun after sandbox EPERM, not a
code change. Dependency audit: 8 -> 3 advisory entries; exposure/remaining exceptions in
`docs/16-security-review.md`. No shared migration, main merge or deploy.

Task state until the project board is synchronized: A01 verified; A02 code/local checks
ready (remote topic CI pending); A03 narrow patches/local checks ready, residual tooling
exceptions documented; A04 runbook corrections/local workflow browser regression ready.
A05 org Projects read is inaccessible: current GitHub token lacks `read:project`. No
account/scope changes attempted; this execution log is the explicit queue fallback.
B01/E01 handling contract is next. No future tasks are marked done because the run started.

## Scope Answers and Basic Bot Decision - 2026-10-26

The owner confirmed the preserved 11-city set and that a profile is sufficient for MVP;
CV file upload is optional later, not a current storage/upload feature or fake disabled UI.
Bot design was delegated to the agent. Chosen first scope: start/menu into the common
Mini App, Jobs/Applications links, Help/Privacy. Application progress stays in-product and
the team performs manual follow-up; no proactive notifications/newsletter service in v1.
Next notification scope is explicit opt-in important application updates, then separate
job alerts if needed. Do not request write access at entry or build a speculative queue.

Verified Telegram documentation for menu launch, commands and write-access capabilities.
This is an engineering product choice under delegation, not a quoted CEO command list.
Updated route/backlog; task IDs/count unchanged. Geography/CV/bot scope questions are now
resolved. Data/policy/operator/provider/production gates remain separate. No implementation,
model switch, actual bot configuration/send, shared DB or release operation was performed.
Documentation checks passed: 50 unique task IDs, valid acyclic dependencies, 12 relative
links resolve, diff/whitespace checks. No runtime suite rerun for the Markdown-only change.

## CEO Excerpt Reconciliation - 2026-10-26

The owner supplied another founder-conversation excerpt. Read it in full and compared
relevant product statements with the preserved scope/Obsidian; personal/financial chat
and historic monetization prices are not copied into the implementation specification.
The excerpt explicitly confirms job ingestion, website, Telegram bot and Mini App as
the first Web2 blocker; Blockpass/expansion follow later. It repeats managed applications.

Corrected the too-broad deferral of all source connectors/bot work: delivery proposal now
has **50 task contracts**, adding C06/C07/I01 while preserving previous IDs. CSV remains
operator fallback/correction, not a substitute for the required source pipeline. A basic
bot is not proof that application/job notification delivery is agreed or implemented.
This is a corrected proposal on draft #37, not implementation or a new approved freeze.

The excerpt contains no city/country list. The 2026-06-09 scope and canonical Obsidian
preserve an 11-city Working list, not an independently verified final CEO approval.
The agent's 2-3-city suggestion was not adopted and no longer replaces that candidate list.
Remaining product questions: confirm that working list/latest version; CV file requirement;
bot commands/notification delivery. Provider/policy/operational gates remain for release,
not repeated product-discovery questions. No code/runtime/cloud/secret/billing operations.
Document validation passed: 50 unique tasks, valid acyclic dependencies, all pre-review
AUTO tasks feed R01; 12 local Markdown links resolve, diff/whitespace checks pass. Runtime
tests were not rerun for this documentation-only reconciliation.

## Detailed Continuation Planning - 2026-10-26

Branch `codex/mvp-execution-route`, proposal commit `3dd9b7d` /
[draft #37](https://github.com/talentbay/talentbay/pull/37), product baseline `af2c4ec` / draft #36.
Prepared [delivery proposal](23-mvp-delivery-plan.md) and [47 task contracts](24-mvp-backlog.md)
with dependencies, acceptance, module scopes, autonomy gates and independent-review handoff.
The owner requested planning first, then model selection, then autonomous implementation.
No application/runtime code, dependencies, schema, cloud settings or billing changed.

Fresh Git/GitHub reads confirmed #25-#36 open with a cumulative 18-commit line and #24
still deferred. Both #36 CI jobs are SUCCESS on `af2c4ec` (run `40298267987`). Earlier local
test evidence remains dated baseline evidence, not new tests of future tasks. Cloud/Figma/
native clients were not re-audited. Obsidian planning check reports the personal calendar
plan stale; it is not used to assign project deadlines, and no unrelated calendar is edited.

The proposed first run ends at K1 after tested AUTO tasks. An independent reviewer is then
selected/run for R; controlled preview/beta H still requires provider/data/owner gates.
Planning checks: 47 unique tasks; all dependency IDs resolve, the graph is acyclic, and
all pre-review AUTO tasks feed the K1 review boundary. New relative Markdown links resolve;
diff/whitespace checks passed. A local Node shim initially refused an untrusted mise config;
the read-only document checks passed using the already installed explicit Node 22 PATH.
No runtime suite was rerun for this documentation-only proposal.
Draft #37 is published/attached; no merge or deployment. Next action: agree scope/open
business gates, choose the executor and start A01/A03/A04, then A02/B01 by dependencies.

## Managed Application Intake Confirmed - 2026-10-26

Branch `codex/managed-application-intake`, product commit `a7ac7be` /
[draft #36](https://github.com/talentbay/talentbay/pull/36), base `c256387` / draft #35.
The owner supplied the missing product answer: TalentBay receives the application,
contacts the company and proposes the candidate; the company is also a potential client.
Keep in-product Apply, not a default source redirect. This supersedes the open model below.
[Contract and next operator slice](22-application-review-contract.md).

Preflight, success, NEW and detail copy now name TalentBay as the receiver and explain
manual company outreach/follow-up. They do not claim an employer already received/read
the application or guarantee a response, interview, hire or turnaround. No backend,
schema, delivery integration or contact log was added in this small follow-up. Actual
handling/share records, approved information sharing and follow-up remain unimplemented.

Actually passed: `pnpm test` **112**, `node --test tests/tooling/*.test.mjs` **24**,
`pnpm lint`, `nuxt typecheck --build --dotenv /private/tmp/talentbay-test.env`, Node build
with explicit empty dotenv/DB/provider values, compiled `pnpm test:smoke`, public browser
**16**, DB/session/browser **10** on the isolated loopback PostgreSQL cluster. Updated
browser assertions cover receipt/preflight copy and persisted NEW status; mobile screenshot
visually inspected. The separate 37-SQL domain suite was not rerun locally: no DB code changed.

The first public run found a geometry-test readiness race: it measured the SSR button
before interactive state/fonts settled. Wait for enabled/fonts before the same exact
geometry assertion; all 16 then passed and the focused test passed three additional runs.
Tooling initially hit sandbox loopback EPERM; the unchanged suite passed with local-port
permission. No tests/assertions were removed. Earlier #35 CI is now confirmed successful
(`build`, `PostgreSQL integration`, run `40285515181`), not evidence for this branch.

Draft #36 published; it targets main for CI and includes the prior unmerged stack.
No merge, deploy, shared database/secret/domain/billing operations or real company contact.
Local synthetic review remains at 3130/3131. The next runnable product task is minimal
operator handling, with actual contact/handoff distinct from employer hiring stages;
this is not a finished MVP or a new approved design freeze.

## Application access and product-intent correction - 2026-10-26

Branch `codex/application-review`, base `71b9b8a` / [draft #34](https://github.com/talentbay/talentbay/pull/34).
Added a small read-only application inbox/detail for current ADMIN and confirmed,
owner-scoped withdrawal. Existing Nuxt UI and current data/schema are reused. No migration,
new library, employer delivery, automated hiring decision or employer status writer.

The owner asked to recover the CEO's philosophy before choosing external-source Apply.
Read the canonical Obsidian map/roadmap/decision log and two reconciled October packages,
repository scope/plan and the supplied founder conversation. The intended common journey
includes profile, application and following it; importing jobs is not agreement to replace
it with external redirects or become a manual recruitment service. No exact delivery
mechanism for nonparticipating companies was found. [Evidence and open questions](22-application-review-contract.md).

The earlier uncommitted operator NEW -> VIEWED experiment was removed: the preserved
handoff defines VIEWED as employer viewing. The final queue has no status mutation;
opening detail cannot change candidate progress. Synthetic seed now uses NEW only.
Nothing from that experiment was committed, merged or deployed.

Queue is bounded/keyset-paged (25); list omits contact/cover data. Detail reads the current
profile, not an invented historical snapshot. Withdrawal requires same-origin strict
bounded JSON, locks the owned row, is idempotent and retains the record. It does not allow
a second application to the role or imply erasure. Revoked admins fail with old cookies.

Actually passed: **112 unit/HTTP/OAuth, 24 tooling, 37 PostgreSQL, 16 public browser,
10 DB/session/browser** tests; full lint, explicit build-mode typecheck, Node production
build and compiled HTTP smoke. The DB/browser suite includes owner denial, revoked roles,
CSRF/strict body/size limits, absent admin review mutation, read-without-state-change,
withdraw/cancel/failure/retry/reload and bounded viewport checks. All DB writes used a
new disposable loopback PostgreSQL 18 cluster, separate from the interactive review.

Initial SQL test imported transitive h3 unavailable to that test config; fixed to the
existing integration error-stub pattern. Initial 320px screenshots exposed a real wide
table overflow, not a modal width failure (dialog itself was 288px). The new queue is a
responsive unframed row grid, not a clipped desktop table. Tests/screenshots remain and
pass at 320/390/768/1024/1440. Retry and narrow modal screenshots visually inspected.

No merge/deploy, shared DB, real candidate/employer, billing or domain changes. Real
provider acceptance/content/relocation data and product delivery decision remain open.
#34 was retargeted to main because CI filters PR bases; its earlier absent checks must
not be reported as passed. The branch still contains the prior unmerged stack.

## Interactive product review correction - 2026-10-26

Branch `codex/interactive-product-review`, base `c602b42` / draft #33. Owner reported that
the preview exposed about two useful screens and no coherent user journey. The previous
3130 server deliberately had no database/provider credentials; all fallback jobs blocked
applications. Presenting that as the reviewable product was inadequate. Product acceptance
remains open, independently of the earlier CI results.

Added `pnpm dev:review`: fresh disposable loopback PostgreSQL 18, committed migrations,
synthetic vacancies/accounts, real API seeding and a separate local account chooser.
Candidate/newcomer/operator/guest sessions use the normal signed-initData auth boundary
with per-run fake credentials. No developer dotenv/cloud DB/real bot is used. The chooser
requires exact Host/Origin and CSRF nonce, rejects arbitrary identities/oversized requests,
and never ships as a Nuxt route. Dev-only UI identifies fictional data and account switching.
Production smoke confirms the banner stays absent even when its env value is present and
the helper GET/POST routes return 404 without a session.

Existing Nuxt UI/Lucide retained. Saved now uses a shared filled/color bookmark toggle;
search/back/settings/edit/remove icon targets are centered and stable. Regression tests
check SVG path fill and search-arrow geometry. No schema/backend domain changes.

Actually passed: `pnpm test` **112**, `node --test tests/tooling/*.test.mjs` **24**, full
`pnpm lint`, `nuxt typecheck --build --dotenv /private/tmp/talentbay-test.env`, Node build
with explicit empty dotenv, compiled `pnpm test:smoke`, and `pnpm test:e2e` **16**.
The full 32-SQL/8-DB-browser suite was not rerun locally for this slice. Manual actual
HTTP/session/PG browser review covered profile save, salary calculation, new application,
cover-note detail and persistence after reload; empty newcomer profile/application list;
CSV no-write preview -> draft import -> review -> publish -> visibility (5 to 6 jobs).
Screenshots inspected: profile, application list and corrected narrow jobs controls,
retained locally under `/private/tmp/talentbay-product-review/` (not release evidence).

Initial checks found/fixed an incorrect fixture PATCH vs PUT, a root-SVG assertion that
missed Lucide's path-level `fill="none"`, and portal `no-referrer` producing an opaque form
Origin. The latter now uses same-origin referrer policy and an explicit loopback redirect
destination in CSP, without accepting null/foreign Origin. No failing tests were removed.

Crucial product gap: applications are only recorded, not delivered or operationally
processed by employers/admins. Real source-backed relocation/job data, live providers,
native Telegram, hosted release and owner UX acceptance remain unverified/incomplete.
[Walkthrough and prioritized audit](21-local-product-review.md). No merge/deploy/billing,
domain or shared database change. Local review server intentionally remains running.

## Candidate hydration follow-up — 2026-10-26

Branch `codex/candidate-hydration`, base release-preparation `b5f1aea91b7b0c6bb6a3b7c624a6468ceda12d3c`
/ [draft #32](https://github.com/talentbay/talentbay/pull/32).
Starting a real dev preview exposed compact-currency SSR mismatches: Node rendered
`£95.0K–£125.0K`, while Chromium hydrated `£95K–£125K`. Explicit minimum/maximum fraction
digits fix the differing ICU defaults without removing SSR or hiding the warning.

Added an exact salary-format regression and hydration-console capture to every public
viewport journey. Prior pageerror-only tests did not cover console hydration warnings.
Actually passed on this change: **112 unit/HTTP/OAuth**, full lint, explicit Nuxt build-mode
typecheck, Node production build/compiled HTTP smoke, **16 public browser tests** with
hydration warning detection. Dev preview at loopback 3130 also returned 200, no overflow,
no hydration warnings/page exceptions at 390/1440px after the fix. A standalone diagnostic
initially used a nonexistent link label; it timed out/closed, then was rerun with actual
visible card/button selectors and an explicit bounded timeout.

No DB/API/schema changes. Database tests were not rerun locally for this formatting-only
patch; the preceding release branch's 32 SQL/8 browser tests are dated evidence, and this
PR's own CI will independently rerun them. Nothing merged/deployed/live-provider verified.

## Release preparation — 2026-10-26

Base operator head `b99776f57ca838ffed828cfc37a46dbff92aeecc` / [draft #31](https://github.com/talentbay/talentbay/pull/31)
has its own [successful CI 40245116366](https://github.com/talentbay/talentbay/actions/runs/40245116366),
both build and PostgreSQL integration jobs. Branch `codex/mvp-release-readiness` continues
without merging/deploying or changing cloud data.

The operator bootstrap script now supports exact permanent local `--user-id` as well as
existing unique email. This handles Telegram-only users without invented emails or unsafe
username matching. Node's standard argument parser rejects mixed/ambiguous/repeated flags;
default is dry-run, apply is explicit, existing account only, transactional and idempotent.
Admin runbook now documents current DB-role revocation and the canonical route.

Actually passed locally: **111 unit/HTTP/OAuth**, **17 tooling**, **32 PostgreSQL** tests,
full lint and explicit Nuxt build-mode typecheck. Tests cover nullable-email promotion,
dry-run/no write, idempotent apply and invalid/missing targets. No real account promoted.

Synthetic local restore: dump from disposable loopback PG 18.6 restored to another new
local cluster. Inventory/counts/all-row digests of **9 tables** including migration history
matched; repeat migration succeeded and all **32 integration tests** passed on the restored
copy. Both PG clusters stopped. Initial sandbox shared-memory denial and one transient
loopback EADDRNOTAVAIL were followed by successful unchanged checks, not hidden/disabled.

Local `NITRO_PRESET=vercel` build passed. Generated output is API v3, **1 real Node22 bundle /
59 route entries**, required Candidate/auth/admin functions and CSV template present.
`scripts/assert-vercel-output.mjs` verifies this and is added after existing browser tests
in CI; it does not link/deploy or require cloud secrets. Package engines override project
Node metadata: generated runtime is `nodejs22.x`, not 24. Real deployed runtime is still
unverified. [Readiness/rollback sequence](20-release-readiness.md).

At 02:35 MSK `HEAD https://talentbay.org` returned 404 / DEPLOYMENT_NOT_FOUND. No DNS repair
was attempted against an unconfirmed owning scope. Hosting budget request remains open;
no paid plan/trial, archived branch restore, shared migration or production promotion.
The code/test milestones do not mark M5 accepted: actual preview backup, live OAuth/native
Telegram, permitted content, legal approval, domain ownership and release approval remain.

## Minimal operator workflow — 2026-10-26

Branch `codex/admin-file-import`, base Candidate `5ab31646e15a7a3b0a4e4ea8c79723b178f2318e`.
Candidate is published as [draft #30](https://github.com/talentbay/talentbay/pull/30), whose
own [CI 40242019559](https://github.com/talentbay/talentbay/actions/runs/40242019559) passed.
These are unmerged stacked changes, not a production release.

M4.2-M4.4 code: fixed-template UTF-8 CSV, 50 records/512 KiB; maintained `csv-parse` parser
and `raw-body` request limits; all-record validation, duplicate/conflict errors, no-write
preview and SHA-256 revision confirmation in the same transaction as the bounded import.
Existing JSON imports remain supported. Company-wide withdrawal impact is shown; imported
records retain source-based IDs and applications. No arbitrary XLSX mapping/source fetch.

Review now reads complete content/company/source data and requires its revision before
mutation. Company then vacancy locks reject stale review, including same-timestamp content
changes. Publishing cannot reactivate an archived company. Operator UI has file/errors/
preview/confirmation/retry states and complete-record review. The dashboard measures a
consistent DB snapshot; public count shares the public visibility predicate. No fake
visits/conversion/import-history graphs. See [operator guide](19-content-operations.md).

Focused design contract: [18-admin-import-contract.md](18-admin-import-contract.md).
Figma local Core primitives/variables/fonts were inspected; the connector rejected
`createPage` with `Can't call createPage in read-only mode`. No Figma writes succeeded.
Implementation uses existing Nuxt UI controls and is browser/screenshot reviewed; this is
not a new founder-approved Figma freeze or the deferred full admin redesign.

### Type gate correction

The installed Nuxt CLI exited 0 for `nuxt typecheck`, but explicit
`vue-tsc --build --noEmit` exposed nullable profile input types and an unsupported write to
Color Mode's readonly `value`. Earlier log entries accurately record the command's result,
**not proof that all referenced projects were checked**. The package script now explicitly
passes `--build`; both Nuxt build-mode checking and direct Vue/TS project checking passed
after repair. Profile drafts normalize null to empty input strings. Host appearance now
uses the supported `preference` API and independently persists the user's Host/system
choice instead of storing Telegram's transient resolved theme as their preference.
Sources: [TypeScript project references](https://www.typescriptlang.org/docs/handbook/project-references),
[Color Mode migration](https://color-mode.nuxtjs.org/advanced/migration).

Latest completed local checks: Node 22.23.1 / pnpm 10.33.0, empty explicit build dotenv,
disposable loopback PostgreSQL 18.6 only. 101 unit/HTTP/OAuth, 13 tooling and 30 PostgreSQL
tests passed; full lint, explicit build-mode typecheck/direct Vue checker, Node build and
diff whitespace check passed. Final compiled HTTP smoke, **16 public Chromium tests** and
**8 real HTTP/session/PostgreSQL browser tests** passed on the final production build.
Operator views passed overflow checks at 320/390/768/1024/1440px; Candidate matrices also
include 900px. Screenshots of import, complete review modal and overview were inspected.
Browser tests cover no-write preview, source identity, creator attribution, stale publish,
changed re-import withdrawal, truthful aggregate counts, CSRF/types/size rejection and
host theme changes/manual override/return to Host-system without persisting a false choice.

Initial browser failures were fixed, not removed: expected 404 heading differed from the
actual recovery UI; invalid request shape now returns 400 rather than an unhandled Zod
500; screenshot capture waits for modal opacity before visual review. A malformed source
URL now produces row errors rather than throwing from the credential check.

M4.5 remains pending: no approved real vacancy set imported into a shared environment.
No schema change/migration is introduced by this operator slice. No merge/deploy/shared
database writes, billing or domain changes performed.

### Provider refresh — 2026-10-26 (read only)

- Vercel project ID remains `prj_lHZmzknETqd40Hag5xPRACGgynU9`, owning scope
  `team_cjyqd17DfaDhcsylDIgQmBTl`; Nuxt / Node **24.x** metadata still differs from tested
  Node 22. Latest returned deployment `dpl_DvU86EvSJFgns2nsjxP8Kd8vwQnf` is old, not this code.
- `get_git_deployment_context` independently confirms **Hobby**, no linked TalentBay Git
  project and no origin connection. Project/team reads alone omit billing information;
  they were not treated as evidence of Pro entitlement. No unrelated projects changed.
- Neon `list_branches` still returns production `br-proud-poetry-as21qww0`, preview
  `br-jolly-glade-ash2y5iy` and integration `br-restless-rice-asthw10g` as **archived**.
  No restoration, SQL readiness check or shared data mutation performed.
- Hobby is non-commercial and cannot connect this private organisation repository:
  [Hobby](https://vercel.com/docs/plans/hobby), [Git](https://vercel.com/docs/git).
  CLI deployment does not waive plan terms. A budget decision was requested separately;
  no paid plan/trial started. Pro public pricing starts at $20/month, before possible
  usage/taxes: [pricing](https://vercel.com/pricing).

Next: finish/review the operator PR and release-readiness checks; cloud preview, real
providers/native Telegram, permitted content and approved public release remain gates.

## Responsive Candidate local verification — 2026-10-26

Current branch `codex/candidate-responsive-shell` is based on security head `b4a49a5` /
[draft #29](https://github.com/talentbay/talentbay/pull/29), whose own
[CI 40237496254](https://github.com/talentbay/talentbay/actions/runs/40237496254) passed.

Implemented the shared Candidate shell, canonical routes, local Saved + Undo/resolution,
URL search/staged filters, profile editor, application preflight/submit/current statuses,
working local Settings and explicit provider-connection UI. Telegram remains a host adapter,
not another frontend. Optional native methods, theme, safe areas and signed job deep links
are covered by Chromium host simulation against the real HTTP/session/database boundary.

Browser verification exposed and fixed pre-hydration lost interactions, early storage
initialization, native-versus-router Back history and the old disabled server app config
breaking server icon resolution. A failed profile save preserves its draft. Contact-only
profiles now survive Drizzle's nullable join mapping. Private responses are no-store;
profile/application writes require same-origin after authentication. Legacy unsafe profile
links are not rendered, and incoming profile links only accept HTTP(S).

Relocation uses stable destination keys, preserves vacancy inputs, annualizes monthly
salary and does not invent hourly workload or FX conversion. Invalid inputs return 400
rather than default figures. Same-named/diacritic destinations have database regressions.
Postgres search now includes company and skills, not just the role text. Public result
visibility remains aligned with the earlier publication-safety fix.

Actually passed locally, Node 22.23.1 / pnpm 10.33.0, using an explicit empty dotenv for
prepare/typecheck/build and the isolated loopback PostgreSQL 18.6 fixture only:

| Check | Result |
| --- | --- |
| Nuxt typecheck / full ESLint / Node production build | PASS |
| `pnpm test` | 89 unit/HTTP/OAuth tests PASS |
| `node --test tests/tooling/*.test.mjs` | 13 target-safety tests PASS |
| Vitest integration config | 23 PostgreSQL tests PASS |
| `pnpm test:smoke` | Compiled HTTP smoke PASS |
| `pnpm test:e2e` | 16 public Chromium tests PASS |
| Playwright database config | 6 real API/session/Postgres browser tests PASS |
| `git diff --check` | PASS |

Screenshots and overflow checks cover guest routes and authenticated Profile, Applications
and Detail at 320/390/768/900/1024/1440px. Visual inspection included narrow detail, wide
profile and Jobs. Tests include network retry, quota fallback, cross-tab Saved, staged
filters, keyboard search, 404 recovery, duplicate apply, account isolation, CSRF rejection,
native Back/theme/deep links and retained relocation inputs. Both browser suites are in CI.
An initial concurrent-run artifact collision was a test-harness issue; separate output
directories were added and both complete suites subsequently passed. No tests were removed.

The owner explicitly authorized design iteration: mobile Figma contexts/screenshots were
used with existing Nuxt UI/Lucide/tokens; desktop/mobile primary colors were unified and
profile/settings use unframed sections. This is not a new approved Figma freeze. See
`docs/17-candidate-verification.md` for the implemented contract and reproducible commands.

Code ready / local tests passed / not merged / not deployed / no real-provider acceptance.
Next: focused fixed-template CSV/dry-run/import review, operator metrics and real-content
readiness. Native Telegram/mobile Safari, provider callbacks, cloud DB/domain/plan and
content/legal release gates remain open. No shared database or production settings changed.

## Security maintenance before Candidate — 2026-10-26

Branch `codex/mvp-security-hardening` from identities `36f93b2a5815dfed5388d577076db32ca63bdfad`.
Identity PR #28 has its own successful CI:
https://github.com/talentbay/talentbay/actions/runs/40236627784

Updated Nuxt 4.6.2, Vue 3.5.44, router 5.4.0, Zod 4.6.7, the old Tiptap/brace overrides
and compatible vulnerable transitive packages. Node minimum now matches Nuxt (22.22.3).
Production dependency advisory entries fell from 57 to 2, with no critical entries;
remaining node-forge/esbuild tooling exposure and output-trace checks are documented in
`docs/16-security-review.md`. Alerts were not suppressed; no claim of a clean full audit.

Admin authorization now exists in each handler as well as middleware, checks the current
database role/account and caches only within a request. Case-variant bypass was not
reproduced (old runtime returned 404); compiled smoke accepts 403/404 and rejects exposure.

Passed locally: 78 unit/HTTP/OAuth tests, 19 disposable PostgreSQL integration tests,
lint/typecheck, Node build and compiled HTTP smoke. No shared migrations/deployments.
Next: shared Candidate shell/navigation, local Saved and Telegram host adapter, then the
remaining responsive Candidate flows and minimal reviewed content/admin operations.

## M2.2-M2.4 local implementation — 2026-10-26

Branch `codex/telegram-identities`, based on content safety `cb462cc` / PR #27. The user
explicitly granted full TalentBay project authority, including branch publication, PRs,
Figma/design changes and testing. Content safety #27 has its own successful CI run:
https://github.com/talentbay/talentbay/actions/runs/40235987466

Implemented: nullable email/TELEGRAM migration 0002, permanent local provider subjects,
serialized concurrent identity creation, no new email-only auto-linking, explicit OAuth
linking with a server-sealed provider/account/expiry intent, validated Telegram login/link,
account-switch protection, private identity list and boolean provider capabilities.
Existing account IDs/profiles/applications remain in place. ADR 0007 describes the contract.

Current maintainer evidence found a further OAuth state advisory, fixed in 0.5.32:
https://github.com/atinux/nuxt-auth-utils/releases/tag/v0.5.32
Exact auth dependency is now 0.5.32; the app presence guard remains. pnpm lock regeneration
added auth's @nuxt/schema 4.6.2 dependency and its small transitive tree; other direct
dependencies stayed unchanged. No deprecated Telegram SDK dependency was added.

Actually passed locally with Node 22.23.1: 74 unit/HTTP/installed-OAuth tests, 18 PostgreSQL
integration tests (including 8 identity regressions), lint, typecheck, Node production
build and compiled HTTP smoke. Migration 0002 applied only to the existing disposable PG
18.6 database; no shared schema/data or provider credentials were changed. Route tests
include real sealed-session writing, origin/signature/expiry rejection and link intent
consumption/conflicts. Provider transport is mocked: no live Google/GitHub/TG acceptance.

Code ready / local tests passed / not merged / not deployed / live-provider verification
pending. Candidate UI and Settings connection controls follow in M3.

New audit follow-up: production dependency graph has 57 advisory entries (4 critical,
22 high, 23 moderate, 8 low). This includes dev/build tooling pulled through Nuxt; it is
not a claim of 57 exploitable production endpoints. Triage and compatible security
updates are the next separate slice before release. Check admin case-variant paths and
current DB-role authorization rather than relying only on the old session role.

## Autonomous continuation / early M4.1 — 2026-10-26

The user authorized continued implementation of the shared web/Telegram product,
candidate flows, content operations and admin metrics. No new calendar deadline was set.
Fresh GitHub reads found #24 draft and #25/#26 open at the heads recorded above. Work
continues from OAuth head `9e6dbcd1d90effb6e0b829febaa06dd449afb5c4` in the existing managed
worktree, branch `codex/content-publication-safety`. The original checkout and its private
env/data/untracked Sonnet note were preserved. No main merge or cloud mutation occurred.

Early M4.1 is now implemented in this branch (supersedes the older "not implemented"
entries below):

- Changed imported content becomes DRAFT/UNREVIEWED; ARCHIVED stays ARCHIVED.
- Unchanged content reports UNCHANGED and preserves publication/review/timestamps.
  Source publication date alone is not treated as a reviewed content edit; publication
  on TalentBay remains the explicit review/publish action.
- Removed optional values become NULL, rather than silently retaining an old salary.
- Shared company metadata changes invalidate sibling vacancy reviews in the same transaction.
- List, detail and total require PUBLISHED + VERIFIED + ACTIVE organisation, including
  legacy inconsistent rows. Apply shares the visibility rule and rejects demo fixtures.
- Apply locks the vacancy/company until insertion, retaining IDs, applications and dedupe.

Regression evidence: the initial run on the unmodified services had 4 failures out of 5
tests (published/unreviewed, unchanged import, legacy visibility and inactive-company apply).
After the fix, 8 focused regressions plus the 2 prior workflow tests passed on disposable
local PostgreSQL 18.6, created under `/private/tmp`; no Neon/env/data were used.

Checks actually passed with Node 22.23.1 / pnpm 10.33.0: Nuxt prepare and typecheck using
an empty explicit dotenv file, lint, 43 unit/OAuth tests, 13 tooling safety tests,
Node production build, compiled HTTP smoke and 10 database integration tests. The smoke
SQL expectation now includes review status. No dependency/schema migration was needed.

Status: code ready / local tests passed / not merged / not deployed / no new live-provider
verification. Next independent slice: backward-compatible provider identities, validated
Telegram login and explicit account linking, then frozen Candidate v1 and content operations.

## Evidence baseline

- GitHub main inspected at `2aca646f2c1ad0b5e59c375a30598a0f47da060a`.
- Candidate v1 freeze and active source/component/breakpoint contracts are in
  `docs/10-design-direction.md`; this pass does not change Figma or candidate UI.
- PR #24 is unmerged and now a draft. Its branch is preserved; no Cloudflare production
  deployment or Hyperdrive connection is claimed.
- Vercel deployment metadata for `talentbay-seven.vercel.app` reports READY, source CLI,
  commit `c8a21522266a39e32cc5a20374470641d116ee98`. This is an old technical demo, not current
  main or implemented Candidate v1.
- July backend/partial UI is on main (PR #22); Candidate v1 is frozen design, not fully
  implemented. Telegram-only auth, new identities and explicit linking are absent.
- Current OAuth auto-links by verified provider email, not arbitrary client email.
  Admin authorization uses the session role; immediate DB-role revocation is not implemented.

### Provider metadata — 2026-10-06

Read-only audit at 15:11-15:20 MSK (12:11-12:20 UTC), not SQL/live verification:

| Resource | Observed metadata | Still unverified |
| --- | --- | --- |
| Neon project | `royal-field-51154253`; PostgreSQL major 18; project metadata readable | Runtime/schema/data readiness |
| Neon production | `br-proud-poetry-as21qww0`; archived on 2026-10-02 | No restoration, SQL or writes performed |
| Neon preview | `br-jolly-glade-ash2y5iy`; archived on 2026-10-02 | No restoration, SQL or writes performed |
| Neon integration | `br-restless-rice-asthw10g`; archived on 2026-08-12 | No restoration, SQL or writes performed |
| Vercel project | `prj_lHZmzknETqd40Hag5xPRACGgynU9`; get_project without teamId succeeded; accountId `team_cjyqd17DfaDhcsylDIgQmBTl`; Node 24.x | Explicit-team get_project returned 404; settings/write scope unresolved |
| Vercel deployment | Production source CLI, READY at `c8a21522266a39e32cc5a20374470641d116ee98`; Preview at `dd1c98e8acc72a8f207af25e1b114ee73844b17a` | Neither SHA is current main/PR; no new deployment or live journey |

Independent `get_git_deployment_context(teamId)` read during this pass, before 17:28 MSK
(14:28 UTC), returned `plan=hobby`, no linked TalentBay Git project and no origin
connection. This confirms the plan separately from get_project; partial reads do not mean
all access is unavailable. Node 24.x metadata disagrees with Node 22 engines/CI.
No tariff, project settings, domain, archived branch, secrets or shared DB was changed.

## M1.1 / M1.2 verification — 2026-10-06

Implementation commits:

- `5fac1d4302651d498f5a02137c7b03974b643378`: MVP-first plan, roadmap, agent guidance,
  ADR 0006 and this execution log.
- `d87fc0712c6d5ae3fe46697cc59c9c46b69f8781`: isolated PostgreSQL CI, safety guard/tests,
  liveness endpoint and compiled HTTP access-guard smoke checks.

Verified PR CI run: https://github.com/talentbay/talentbay/actions/runs/37458601760
Both jobs finished successfully. GitHub tested the PR merge ref for the above head against
main; no production merge/deployment is implied by that temporary test ref.

| Check actually run | Outcome |
| --- | --- |
| Frozen-lockfile dependency installation | Passed in both jobs |
| `pnpm typecheck` | Passed |
| `pnpm lint` | Passed |
| `node --test tests/tooling/*.test.mjs` | 13 passed; also passed locally with Node 22 |
| `pnpm test` | Passed |
| `pnpm build` | Node production-output build passed |
| `pnpm test:smoke` | Passed: liveness/no-store, public SSR/API and unauthenticated 401/403 guards |
| CI database target guard | Passed; runtime/migration URLs point only at runner-local `talentbay_ci` |
| `pnpm db:migrate` | Committed migrations applied successfully to disposable PostgreSQL 18 |
| `pnpm exec vitest run --config vitest.integration.config.ts` | 2 existing service-level workflow tests passed |

The database scenarios cover import/review/publish and profile/save/apply/list. They do not
prove live Google/Telegram login, cross-account authorization, real Neon connectivity or
the new responsive UI. HTTP smoke launches the compiled Node server locally on the runner;
it does not make changes to the public production deployment.

The workflow uses contents:read permissions, no persisted checkout credential, job timeouts
and cancellation of stale PR runs. No Neon/production credentials are used. The safety
guard rejects remote hosts, wrong DB/role, URL options and mismatched targets without
logging connection strings. Database containers are removed after the job.

Verification above is pinned to the implementation commit and run. Any later code change
requires its own successful run. A documentation-only log update does not retrospectively
claim a new run passed.

## Current work

| Task | Implementation | Verification / remaining work |
| --- | --- | --- |
| M1.1 MVP-first docs | Implemented in PR #25 | Review/merge pending |
| Cloudflare deferral | PR #24 converted to draft | Branch preserved, production unchanged |
| M1.2 isolated PostgreSQL CI | Implemented and tested in PR #25 | Both CI jobs successful; not merged yet |
| M1.3 access/security audit | Partial, findings here | Resolve provider access and finish dependency/auth review |
| M1.4 preview/release automation | Blocked externally | Correct team/project access and eligible plan approval |
| M2.1 OAuth security | Implemented in separate PR #26 | Local + own CI passed; review/merge pending, not deployed |
| M2.2–M2.5 unified auth | Code implemented in #28 | Local + own CI passed; live providers/merge/deploy pending |
| M3 Candidate UI | Implemented in #30 | Own CI passed; native host/provider acceptance pending |
| M4 fixed-template content import | Code implemented in operator branch | Local checks above; final PR evidence and approved real content pending |

### Executor coordination

| Task | Executor | Branch / PR | Base SHA | Affected areas | Checks result | Next step |
| --- | --- | --- | --- | --- | --- | --- |
| Context reconciliation | Codex (sole editor; other chat reviews) | `feat/mvp-vercel-baseline` / #25 | main `2aca646f2c1ad0b5e59c375a30598a0f47da060a`; starting head `fea34354ccfe51358dedb277e32d86ba7dd3defe` | Existing docs/AGENTS only | Published docs ffbefd8; CI 37479681093 passed | Review #25; no merge performed |
| M2.1 OAuth state | Codex | `codex/oauth-state-security` / #26 (Depends on #25) | baseline `ffbefd85889f4aee88214ccb08ceb95f0374f8cd` | Dependency, two auth routes, presence guard, regression/smoke tests | Local passed; head 0542eff / CI 37482005196 passed | Stop for review, then early M4.1 separately |

Old `chore/sprint-1-cleanup` worktree and untracked Sonnet context remain untouched.
Cloudflare PR #24 remains draft at `4ab26daa2957a5eef2e023afc23b5e0f9b442a5f`.

Merge status: PR #25 is unmerged at the time of this entry. Deployment status: unchanged.
No new Vercel deployment, billing change, shared DB migration or production promotion.

## M2.1 implementation and local verification — 2026-10-06

The baseline frozen install used `nuxt-auth-utils` 0.5.29. Maintainer release v0.5.30 states
that it fixes OAuth callback state validation / login CSRF:
https://github.com/atinux/nuxt-auth-utils/releases/tag/v0.5.30
https://github.com/atinux/nuxt-auth-utils/security/advisories/GHSA-xc49-mgwh-9pjv

Implementation: `011bc78d69365282965dbee964a573463f393a6e` in PR #26, based on
`ffbefd85889f4aee88214ccb08ceb95f0374f8cd` from unmerged #25. Target main to match the CI
branch filter; security-only comparison excludes inherited baseline:
https://github.com/talentbay/talentbay/compare/ffbefd85889f4aee88214ccb08ceb95f0374f8cd...codex/oauth-state-security

Exact dependency 0.5.29 -> **0.5.30**; not a general upgrade or latest-version claim.
pnpm regenerated the lockfile. It reused already-present @nuxt/kit 4.5.1 for auth (was
4.4.7) and fonts/icon/color-mode peer snapshots (were 4.5.0); h3 deduplicated node-mock-http
1.0.4 to already-present 1.0.5. Package-key comparison found only auth 0.5.30 added,
auth 0.5.29 and unused node-mock-http 1.0.4 removed. All other direct versions are unchanged.
Existing WASM peer, deprecated tooling and ignored-build-script warnings remain.

The installed 0.5.30 handlers compare query state to cookie state. With **both absent**,
undefined equals undefined: an initial real-route regression produced 16 passes / 2
failures (Google and GitHub reached the mocked persistence entrypoint). A small shared presence guard now
rejects missing/empty/non-scalar state or missing/empty cookie before token exchange.
The actual library still generates, compares and consumes state; verified-provider-email
account linking and schema are unchanged. Other invalid-state callbacks retain the
existing onError popup-close HTTP 200 response, which does not mean authentication success.

Verified locally in the isolated worktree with Node 22.23.1 / pnpm 10.33.0:

| Command | Actual result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed; no developer secrets copied |
| `pnpm typecheck` / `pnpm lint` | Passed |
| `pnpm test` | 43 passed, including 18 new OAuth regressions |
| `node --test tests/tooling/*.test.mjs` | 13 passed |
| `pnpm build` | Node-server production build passed |
| `pnpm test:smoke` | Passed; baseline checks retained plus unbound Google/GitHub callbacks return 400 without a session |
| `node scripts/assert-ci-database.mjs` | Explicit disposable marker and loopback-only target accepted |
| `pnpm db:migrate` | Existing migrations applied to disposable local PostgreSQL 18.6 only |
| `pnpm exec vitest run --config vitest.integration.config.ts` | 2 existing workflow tests passed; temporary local PG stopped |

OAuth tests import installed runtime + real TalentBay routes + the real sealed-session
writer. Only provider transport and the persistence entrypoint are mocked. Correct state
succeeds; incorrect/missing/empty/array state, missing/empty cookie and completed-browser
replay have no new persistence/session effects. This does not prove real Google login,
actual user creation/linking against Neon, or stolen-cookie replay prevention.

Baseline docs at ffbefd8 have their own successful CI:
https://github.com/talentbay/talentbay/actions/runs/37479681093
This is **not** a security PR run. PR #26's creation initially had no checks; verify its
own synchronize run instead: head `0542efff877d2c5b259474aa309ba2e86bdb12a5`, base main
`2aca646f2c1ad0b5e59c375a30598a0f47da060a`, pull_request run
https://github.com/talentbay/talentbay/actions/runs/37482005196
Both build and PostgreSQL integration jobs succeeded. Logs confirm frozen install,
typecheck/lint, 13 tooling tests, 43 unit/OAuth tests, Node build and compiled HTTP smoke;
database guard, migrations and 2 existing integration tests passed on runner-only PG 18.
GitHub tests the PR merge ref, not a merge into main. No deployment or shared DB write.

CI annotations warn about older action runtimes and the upcoming ubuntu-latest image
change; action upgrades are separate maintenance, not silently added to M2.1. Application
checks still explicitly select Node 22, independently of the GitHub Actions runtime.

For M2.1: **code ready / tests passed / not merged / not deployed / not live verified**.
Real Google/GitHub login, Telegram, current Neon SQL readiness and deployed journeys remain
unverified. This evidence is pinned to the tested head/run; later log-only commits need
their own run and do not retrospectively change this SHA.

GitHub push reported 31 main-branch dependency alerts (13 high / 13 moderate / 5 low),
not individually triaged here. M2.1 is not a complete dependency/security audit.

## Next runnable task (after review) — early M4.1

Next is early M4.1 re-import safety in a separate PR, not a full admin redesign.
Then implement a backward-compatible local identity model, server-side Telegram initData
validation and explicit linking. Use disposable database tests for schema/identity work.
Do not wait for hosting billing to implement/test independent code, and do not report auth
complete until the real provider/browser/WebView journeys pass on a stable preview origin.

## Next safety change — early M4.1 (not implemented by M2.1)

The current upsert resets review to `UNREVIEWED` without clearing an existing `PUBLISHED`
status. Public list/detail reads filter published status, whereas apply also requires
verified review. This is a confirmed code-path risk, not a completed safety fix.

Acceptance criteria for the separate change:

- First reproduce import -> verify/publish -> changed-content re-import in a regression.
- Unreviewed changes are no longer public; list, detail and total share visibility rules.
- Preserve vacancy ID, applications and source dedupe; do not delete/recreate records.
- Archived vacancies cannot reappear publicly without an administrator decision.
- Review and publish restore an eligible vacancy to the catalogue.
- Define and test unchanged re-import behavior separately from changed content.
- Keep explicitly labelled demo fixtures distinct from verified real content; do not
  mislabel fixtures merely to pass tests.

Implementation details require their own proposal/review; no universal content versioning
system or new admin design is implied.

## External launch gates

1. Confirm the intended Vercel team/project access and an eligible plan. Current connected
   scope is Hobby; no billing/trial changes are authorized by this work.
2. Neon IDs are discovered. Verify authorized runtime/schema/data readiness separately;
   archived branch restoration and shared migrations/seed need explicit approval.
3. Configure real OAuth callbacks and Telegram bot credentials/menu in provider secret
   stores; do not paste credentials in issues, PRs, logs or chat.
4. Confirm final domain ownership, approved terms/privacy and permitted vacancy data.
5. Identify production promotion/rollback owner and approve release explicitly.

## Reporting format

For every milestone record: task ID; changed files/PR; checks actually run and outcome;
merge status; deployment status; next runnable task; exact external blocker if present.
A failed check is fixed or documented, not removed. Do not label a phase complete while
its release criteria remain unverified.
Keep five states distinct: code ready / tests passed / merged / deployed / live verified.
