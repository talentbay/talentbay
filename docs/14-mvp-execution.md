# MVP Execution Log

Updated: 2026-11-21
Active decision: `docs/adr/0006-mvp-first-vercel-neon.md`.
PRs #65, #67, #69 and #71 are merged. Older checkpoints below describe the state at
the time, not outstanding merge instructions. See the [current handoff](09-current-state.md).

## Engineering release (21 November)

#69's reconciled head `2fbb03b` and #71's `210aa54` exactly matched their independently
reviewed Git trees. Both passed build, PostgreSQL integration and Vercel Preview on the
updated main; each DB-backed browser suite passed 88 tests. [#69 CI](https://github.com/talentbay/talentbay/actions/runs/44932936791)
and [#71 CI](https://github.com/talentbay/talentbay/actions/runs/44933503884). Production
reported success for squash commits `fbf28c7` and `f83a3a0`, respectively. After #71,
anonymous GETs for Jobs, health, vacancies, relocation locations and auth capabilities
all returned HTTP 200. No source registration, production test writes or public pilot.

## Local pilot eligibility check (21 November)

Separate from release PRs #67/#69. Lever requires source approval, a matching
role-specific contact, and explicit relocation or corroborated worldwide remote
evidence; see [operator rules](25-source-contract.md#mobility-evidence). No real
feed registered, no schema migration, no automatic publication. Fetch does not withdraw
excluded listings; confirming changed records returns published listings to review.

Local checks: `pnpm lint`, `pnpm typecheck`, `pnpm exec vitest run --maxWorkers=2`
(312), `pnpm test:integration` (112 on disposable PG18, migration replay passed),
`pnpm build` and `pnpm test:smoke` passed. Playwright: Chromium source exclusion
report (mock transport), and real local CSV -> review -> candidate estimate/application
-> operator contact on Chromium and mobile WebKit, with fictional records. The mobile
run needed the matching Playwright WebKit binary before it could start. No external
company was contacted. Independent pre-merge review closed four findings after a
second pass: old terminal reports are readable only for the same source approval,
absent support is "Not confirmed", and the two policy descriptions are corrected.
The registry remains empty; this is not a release or primary bot acceptance.

## Replace hosted review with a local native Telegram bridge (21 November)

The dedicated Vercel review project was paused, not deleted (retain ownership of the
hostname referenced in older chats). Its public jobs route returned HTTP 503 with
`DEPLOYMENT_PAUSED`. The tester bot's old webhook was removed without dropping pending
updates. A subsequent Telegram read returned a commands menu and no webhook. The
production site, primary bot, DNS and Neon were not changed.

The [local review guide](21-local-product-review.md) separates the loopback role
chooser from a compiled Node app and disposable PostgreSQL exposed through a
TalentBay-only ngrok agent. The installer checks the local fixture and public edge
before changing bot bindings. Free ngrok may show a Visit Site screen on first use.
No native pass is claimed until an actual Apply link reopens that same vacancy in
Telegram on the new tunnel. Source policy and relocation scope: [content](19-content-operations.md)
and [estimate](27-relocation-candidate-workflow.md). No production content was added.

Verified locally on the uncommitted pilot checkout: isolated Node 22.23.5 / Nuxt
4.6.4 build; 35/35 native tooling tests; scoped ESLint; installed ngrok v3 config
check without credentials. A real loopback run verified the exact tester with
Telegram getMe, migrated a disposable PostgreSQL 18, rendered the fictional job
page, returned tester capabilities and prepared the correct same-job Mini App URL
for a synthetic /start update. No message was sent. Child exited cleanly and port
4317 was free afterward. The dedicated ngrok credential/domain were not yet
configured, so no public edge or actual Telegram-client pass on this build.

Follow-up, 21 November: with a dedicated TalentBay dev domain, the public edge
returned this run's local Node health and exact synthetic vacancy. Telegram confirmed
the tester's default menu and webhook point to this edge; its pending queue was
empty and it reported no delivery error at the check. In the first device walkthrough
the browser opened the bot but the Mini App showed the paused Vercel deployment.
This is a failed end-to-end attempt, not proof of a broken production login or a
completed native check. Retest with the new reply's **Open vacancy** button. No
public beta or catalogue seed is planned; the old project remains paused.

## Reconcile the data-model reference with the migrations (20 November)

The [MVP model](05-data-model.md) replaces a June design sketch. On a fresh disposable
PostgreSQL 18 cluster the ten committed migrations produced all eleven documented
application tables. The vacancy foreign keys for organisation, creator and relocation
destination, key uniqueness and full-text index were checked against PostgreSQL's
catalogues. The schema and migration files were identical on main `a34d59a` and pilot
`280a097`. No runtime or schema change, shared migration or real candidate data.

## Start Mini App sign-in without waiting for browser idle time (20 November)

On the previous pilot head, [CI](https://github.com/talentbay/talentbay/actions/runs/44780951025)
timed out waiting for an auth response; the server logged the expected rejection at the
test deadline. That timing alone does not establish a cause. Independently, a valid
synthetic launch could not open Profile in the old build when the browser never scheduled
idle work. Start the host adapter once hydration finishes instead. Server verification,
launch freshness and session handling are unchanged.

On the patched Node build: the same valid-launch case passed in Chromium and mobile
WebKit. Full local suites: 88 database browser scenarios, 41 guest browser scenarios
and 311 unit tests passed, as did typecheck, lint, build and HTTP smoke. No production
token or shared database was used. Real-device main-bot acceptance remains open.

## Filter by an exact company in Jobs and the operator queue (20 November)

The public picker searches only employers with publicly visible vacancies. Candidate
and operator result counts and cursors use the exact company key. Companies with the
same display name remain separate. No new account, employer page, schema or index.

Local verification: 311 unit, 111 disposable PostgreSQL tests including upgrade/replay,
typecheck, lint, Node build and HTTP smoke. Four Chromium and two mobile WebKit scenarios
passed: company selection/paging and the synthetic candidate-to-operator pilot on both,
plus the admin editor and previous public navigation regression on Chromium. The
operator contact event is a local record, not an actual delivery to an employer.

GitHub's latest successful Production deployment record still points at `a34d59a`
(deployment 7939151536). #67 requires review; #69 is a draft. Neither the local
walkthrough nor a preview build verifies the main bot's login. The next release
checks are the native launch in the [bot runbook](28-telegram-entry-bot.md) and
reconciliation/review of the pilot against the security release, not a new job parser.

## Operator single-vacancy editor (20 November)

Queue → Create vacancy / Edit uses the same import schema and content transaction
as the batch uploader. No separate partner profile or website is required to file
a first-party draft. Publication remains a separate decision. Stale forms, duplicate
creations, changes to stable keys and changes to shared company details are rejected.
The next content task is an exact company filter, not a partner dashboard.

Local evidence: typecheck, lint, Node build and HTTP production smoke; 310 unit tests; upgrade/replay and
109 integration tests on a disposable PostgreSQL 18; three Chromium scenarios incl.
CSV regression, single-record creation/publication/conflicting correction and access checks.
The database test retains the existing application and a sibling's publication. Previous
head [90c065e passed CI](https://github.com/talentbay/talentbay/actions/runs/44777219761).
No production DB, employer, bot or domain was used.

## Compare the salary bounds on a vacancy (20 November)

The relocation estimate can use either end of a posted salary range, its midpoint or a manually entered amount. A fixed offer has one listed value. Local verification: 307 unit tests, typecheck, lint and Node build passed. Against disposable PostgreSQL, five Chromium scenarios passed, including vacancy refresh and manual input; the guest salary-range scenario also passed in mobile WebKit over HTTPS. These checks did not exercise the native production Telegram client or verify real city costs. The [previous head's CI](https://github.com/talentbay/talentbay/actions/runs/44774184165) was green; this is not a deployment.

## Prepare review-site demo content without seeding a shared database (20 November)

`pnpm --silent demo:vacancies:csv` exports seven marked, fictional roles offline. The five historical source keys are unchanged. The retired seed now stops without loading credentials or writing SQL. Operators validate the CSV, confirm the import into drafts and explicitly publish. Review-site examples have no application context or external source link; the local rehearsal uses separate fixtures to exercise submissions. The reserved sources cannot be mixed with other sources or imported on an unapproved database. [Target and operator steps](11-deployment-runbook.md#postgresql).

Local checks: 304 unit, 52 tooling and 108 disposable PostgreSQL tests, including upgrading and replaying migrations. Typecheck, ESLint, Node build, HTTP smoke and two Chromium operator flows passed. The database test preserved an existing demo ID, withdrew its changed public content, reapplied unchanged data, and rejected an application after explicit republication. Independent review caught an archived-company write in JSON import; regression coverage verifies that the whole batch rolls back. No hosted configuration change, cloud import or production verification.

## Filter external postings by their own direct recruiting contact (20 November)

For an approved Lever board the importer now requires an explicit, pre-agreed
mailbox in a named section of the specific posting. It never stores that section
or publishes the mailbox. The operator can distinguish scanned, committed and
excluded records and open an excluded ID in the review queue. A previously public
role needs an operator recheck; neither exclusion nor a missing posting archives it.
No board is enabled and no real applicant or employer was contacted.

Local: 298 unit and 106 disposable PostgreSQL cases, including changing the rule
between fetch and commit, mixed/all-excluded batches, and preserving observation
dates. Typecheck, lint, Node build, HTTP smoke and the focused Chromium operator
flow passed. Inspected the 320px report; the active board in the browser test is
intercepted, while the service and database exercise the real importer offline.

## Demonstrate without a live job source (20 November)

The isolated local demo starts with six fictional listings; the operator imports
a seventh using the sample CSV. Both list and detail identify demo content. Cards
describe distinct roles; details and flags agree on relocation and visa support.
Checked the six cards and the Lisbon detail at 390px and 1280px against disposable
PostgreSQL. Fixture/CSV tests and lint passed. This does not enable a live provider.
For real third-party openings, see the [direct-contact and source-use criteria](19-content-operations.md#pick-a-source-before-entering-any-jobs).

## London: distinguish rent, travel and a refundable deposit (20 November)

The [review sheet](examples/london-2026-27-review.md#housing-and-commute-two-costs-not-a-total-budget)
now pins the October one-bedroom observation to its ONS workbook edition and column.
An offline read verified the file hash and exactly one matching region/month. The
rent plus one selected Travelcard is a two-item subtotal; a five-week deposit cap
is a separate cash requirement, not another monthly expense. Independently checked
against ONS, TfL and the tenant guide. No runtime inputs or city status changed.

## Mobile WebKit pilot path (20 November)

The PostgreSQL browser suite now runs the existing seven `@mobile-pilot` cases
with Playwright WebKit and an emulated iPhone, alongside the full Chromium project.
They exercise signed launch, hashless reload, navigation during sign-in and the
same synthetic vacancy from operator publication to candidate receipt and recorded
contact. The auth server, session and database are real local code; the Telegram
host, people, employer and city figures are fixtures.

Local: all 80 database browser cases passed without retries (73 Chromium, 7 WebKit),
as did typecheck, lint, CI browser/scope tests and a WebKit startup probe.
No application, production configuration or real bot was changed. Native main-bot
sign-in remains unverified; use the [runtime triage](28-telegram-entry-bot.md#main-bot-distinguish-launch-sign-in-and-session-20-november-2026)
for a fresh failed attempt on the serving deployment.

The [initial Linux run](https://github.com/talentbay/talentbay/actions/runs/44761045951)
passed all 73 Chromium cases but all seven WebKit cases failed over plain HTTP.
WebKit now uses a loopback HTTPS server; the signed-launch case also checks that
the browser kept a Secure, HttpOnly session cookie without printing its value.
This is a test-transport change, not a diagnosis of the main bot.

## Keep a relocation estimate attached to the current offer (20 November)

- Reproduced on the previous build: an open London listing changed its offered pay
  from GBP to USD. After Apply rejected the stale listing and the candidate reloaded
  it, the calculator still showed the previous 70,000 GBP.
- Vacancy suggestions now follow the current salary and destination after an in-place
  refresh or mobile-sheet reopen. Incompatible pay clears a stale suggestion/result.
  A manually entered scenario survives unrelated edits. Both presentations use one
  vacancy-specific estimate; standalone Jobs retains its separate draft.
- Local: typecheck, clean lint, Node build + HTTP smoke, 296 unit, 105 disposable
  PostgreSQL (including upgrade/replay), 41 public + 73 DB-backed Chromium tests without
  retries. Inspected the 390px reopened sheet. Independent review found no open P1/P2
  within this change. No new live dataset, production operation or schema change.
- [London review sheet](examples/london-2026-27-review.md): six comparison tests and
  independent arithmetic review. Official income tax, regular monthly employee NI and
  upfront visa-fee examples are evidence for the reviewer, not a public take-home result.
  The public catalogue still has 3 DEMO / 8 UNAVAILABLE / 0 REVIEWED pilot destinations.

## Bind Apply to the candidate details actually reviewed (20 November)

- The dialog captures both the vacancy and candidate version at acknowledgment. A
  material change to either prevents a new receipt or handling event. Same-owner
  retries reload the details and keep the note; a different account gets a blank
  form. Receipt creation and manual contact with an employer remain separate.
- Saving a profile also checks the displayed owner before writing. Old tabs missing
  that owner must reopen. A failed session read is not evidence of sign-out; a verified
  expired session offers sign-in on the same vacancy. New receipts share the preview's
  safe-link rules. No migration, live-source change, or production operation.
- Local verification on fictional data: typecheck, lint, 284 unit tests, 105 PostgreSQL
  tests plus migration upgrade/replay, Node build, HTTP smoke, 41 public Chromium
  scenarios, 69 PostgreSQL-backed Chromium scenarios (no retries), and backup/restore
  on two disposable databases. Inspected the 390px inline editor. The independent code
  review rechecked the owner precondition, session recovery and safe-link projection.

## Recover an open application without changing its target (20 November)

- After a rejected submission the note stays in the current user's dialog. A removed or
  ineligible target cannot receive another submission from that form. The note can be
  copied before leaving and does not follow another vacancy at the same address.
- A changed role can be reloaded without leaving the application. A failed read or a
  15-second timeout can be retried without sending the application. A successful read
  must identify the same vacancy and preserves any Telegram version pin. The candidate
  reviews the refreshed details and gives consent again.
- Isolated verification: typecheck, ESLint, unit tests, Nuxt build, HTTP smoke, 41 public
  and 61 PostgreSQL-backed Chromium scenarios with retries disabled. New checks cover
  archive, replacement, temporary failure, timeout and stale Telegram pin. Inspected the
  390px terminal dialog. Independent static review found no outstanding P1/P2 in this
  change. No database schema, host settings or production content changes.

## Preserve a guest vacancy when switching into Telegram (20 November)

- A browser visitor can open the entry bot from an eligible vacancy and continue with
  the same role and company. The parameter contains a public ID and a compact material
  version, not a credential. The webhook and the eventual page/API read each verify the
  version. Changing the recipient, modifying or archiving the job cannot silently
  retarget the link. The original browser remains a guest; no automatic application.
- A failed Telegram sign-in no longer recommends a nonexistent alternative or sends a
  signed-out candidate to Settings. A genuine account conflict retains Settings. Only an
  actual failed sign-in response can provide its UUID request ID; a pre-request failure
  cannot. The [phone walkthrough](28-telegram-entry-bot.md#check-one-vacancy-on-a-phone)
  is still required on the primary bot. No production credentials or bot changes.
- Checked locally: typecheck, lint, build and HTTP smoke; 269 unit tests, 103 PostgreSQL
  integration tests plus migration upgrade/replay, and 41 public
  plus 56 PostgreSQL-backed Chromium scenarios without retries. Regression cases include
  a changed company with the same displayed name, a previously delivered button and
  same-document history navigation. Independent review found no open P1/P2 in this change.

## Application handling: what happened vs. what was recorded (20 November)

- The receipt confirms TalentBay received the application. A closure marked **No company
  response** needs a contact on that application that has not been corrected. Historical
  unsupported reasons remain in the operator journal, not in candidate-facing claims.
- A corrected handoff never permits another transfer. The candidate sees the correction
  even outside the latest page, and cannot merge different versions of the journal by
  loading earlier entries. Operators must reload and prepare a fresh candidate package
  after a definitive access, not-found or conflict response; a lost response still permits
  a retry of the original command without a second handoff.
- The [acceptance record](15-mvp-acceptance-record.md) separates the verified synthetic
  pilot from the main bot sign-in failure, missing source permissions and human acceptance.
  No schema change, real job import or real candidate transmission in this change.
- Verified on isolated Node 22: typecheck, lint, compiled build and HTTP smoke, 241 unit,
  103 disposable PostgreSQL integration tests with migration upgrade/replay, and 35 public
  plus 55 database-backed Chromium scenarios without retries. The tests exercise a real
  stale-revision conflict and a simulated not-found followed by a same-revision reload.
  Independent static re-review found no outstanding P1/P2 within this change.

## First employer pilot rehearsal and receipt navigation (20 November)

- One compiled Chromium test now follows the **same** synthetic vacancy and receipt across
  separate operator and candidate sessions: CSV validation/import, private draft, explicit
  publication review, search, illustrative London relocation, profile contact, consent,
  submission, operator assignment and recorded contact, then the candidate's status. No
  message is delivered to an employer; the candidate cannot see private journal entries.
- The vacancy opens its actual receipt, including one outside the first 25. The point
  read uses the same owner-scoped historical projection as the list; it neither reveals
  another candidate's cover note nor substitutes today's vacancy text for the snapshot.
- Local release checks: typecheck, lint, Node build, compiled HTTP smoke, 241 unit tests,
  100 disposable PostgreSQL tests plus legacy migration upgrade/replay, and 35 public +
  54 database-backed Chromium scenarios without retries. Three focused scenarios then
  passed again with exact receipt response fields and no-store assertions. Independent
  static review found no blocking issue with the direct receipt path.
- Operator follow-ups identified here and addressed in the subsequent change above: prevent or qualify a public
  "No company response" reason without a valid recorded contact; distinguish corrected
  handoff entries in the summary without ever enabling repeat sharing. Confirm receipt
  at submission without implying the employer has already received a profile.
- This is local acceptance with synthetic data, not a source clearance, verified city,
  native main-bot login or permission to transmit real applications. See the
  [source decision](19-content-operations.md#pick-a-source-before-entering-any-jobs) and
  [main bot triage](28-telegram-entry-bot.md#main-bot-distinguish-launch-sign-in-and-session-20-november-2026).

## Main bot: signed launch with unavailable SDK (20 November)

- Reproduced an independent reason for the generic banner: the old client made no
  sign-in request when the SDK download failed despite a current launch carrier.
  Three unit regressions failed on the previous code. The new client allows that
  carrier through the same server validation and session refresh. A missing SDK cannot
  confer native controls; an explicitly empty carrier cannot select a stale SDK identity.
- Checked Node build, HTTP smoke, typecheck, lint, 241 unit tests and 35 public + 52
  database-backed Chromium cases without retries. Tests held the real auth POST, checked
  the signed-out session before release, then opened Profile and Applications. Navigation
  and account-conflict cases preserve the intended page and original account. A cache
  hint alone with no SDK made zero auth requests. Independent read-only review completed.
- This does not establish that the main bot lost its SDK. [Production triage](28-telegram-entry-bot.md#main-bot-distinguish-launch-sign-in-and-session-20-november-2026)
  needs the native attempt and serving logs. No real token, bot settings or profile used.

## Pilot follow-up: salary transport and data coverage (20 November)

- Candidate estimates now send a same-origin JSON POST after hydration, including retries
  and vacancy-prefilled income. No salary in the request URL, no database write. GET
  remains for compatibility; provider-wide log privacy is not implied.
- Tested on Node 22.23.5 from a clean frozen installation: typecheck, lint, Node build,
  compiled HTTP smoke, 239 unit tests, 100 disposable PostgreSQL integration tests plus
  legacy upgrade/replay, and 35 public + 49 database-backed Chromium cases (no retries).
  An independent read-only review found two issues: respecting an adapter's declared body
  length, and waiting for the superseded browser request before asserting the stable result.
  Both fixes were reviewed again and are included in these runs.
- The eleven public pilot destinations split into three DEMO and eight UNAVAILABLE, none
  REVIEWED. [London evidence packet](26-relocation-data-contract.md#london-first-evidence-packet-not-a-reviewed-estimate-20-november-2026)
  identifies an automatically readable rent series, not a complete dataset. No real
  records imported. Main bot sign-in still failed in the owner's native check; no live
  failure reason or subsequent successful native test has been provided.

## Candidate pilot and source decision: 20 November

- Release reconciliation `129234a` was published to PR #67. GitHub reported it mergeable;
  scope, build, PostgreSQL integration and Vercel Preview passed. Ready for review does
  not mean merged, approved or deployed to the primary domain.
- Candidate changes are on `codex/candidate-pilot-readiness`. Empty catalogue, no matches
  and errors have distinct actions; optional profile completeness no longer determines
  application eligibility. History links only to current public jobs, with no invented
  submission-time details for legacy receipts. Invalid salary inputs stay at the field.
- The owner reports sign-in failure inside the main bot. Public capabilities returned
  200 with only Telegram enabled. That does not prove correct bot credentials, a
  successful sign-in POST or a persistent session. Inspect the serving deployment at
  the failing minute: POST status, request ID and allowlisted rejection reason only.
  Do not share launch fragments, HARs, credentials, cookies or user profile data.
- No approved real source. [Source options and automation](19-content-operations.md#pick-a-source-before-entering-any-jobs)
  distinguishes a permitted feed display from an employer handoff. No real import,
  forwarding, manual deployment or production database write was performed.
- Candidate pilot [PR #69](https://github.com/talentbay/talentbay/pull/69), code through
  `f5d1d89`, checked with Node 22.23.5 and a frozen lockfile: typecheck, lint, 238 unit
  checks, 100 integration checks with migration upgrade/replay, Node build, 33 public
  and 47 database-backed Chromium scenarios without retries. The first concurrent runs
  hit startup/browser timeouts; both full browser suites passed sequentially on the
  final code. Recovery passed on two disposable clusters (12 tables, 52 synthetic rows,
  matching rows/sequences/indexes, no lost application history). These numbers are not
  a hosted load test or proof of external employer delivery.

## Release build and dependency reconciliation: 20 November

Migration credential guard, local verification on PR #67 base `129234a`:
`pnpm run db:migrate` with only a synthetic runtime URL exited 1 at config load.
Against a new, empty, owned PostgreSQL 18 cluster, the same command with an explicit
`DATABASE_MIGRATION_URL` and an unreachable runtime URL applied all 10 committed
migrations; replay kept the journal at 10. The cluster was stopped and removed.
The actual `drizzle-kit generate` CLI produced SQL for a fixture without either URL.
No shared database, release, or deployment was involved.

- From main `a34d59a`, the clean frozen install failed before the build: duplicate
  `@esbuild/aix-ppc64@0.28.2` mapping at lockfile line 394. Do not delete the lockfile,
  hand-deduplicate YAML or use an unfrozen install in CI. Reconciled against the reviewed
  manifest and lockfile from `464a0f7`; kept the owner's later Git ignore change.
- A regression test failed against main's `drizzle-kit migrate && nuxt build` command.
  The build invokes only Nuxt again; the lifecycle guard runs before CI installs packages.
  See [release runbook](11-deployment-runbook.md) for the explicit schema step.
- Verified in a temporary checkout without project dotenv: official Node 22.23.5,
  pnpm 10.33.0 frozen offline install, typecheck, lint, 206 unit and 46 tooling tests.
  Both dependency audit scopes passed their exact policy (full: 1 low and 3 moderate;
  production graph: 1 low and 1 moderate; no high or critical findings at check time).
- Building with both DB URLs set to an unreachable loopback port succeeded; compiled HTTP
  smoke then passed without a DB. With an explicit local locale, the disposable Postgres
  run passed the 0001-to-0009 upgrade/replay and all 95 integration tests and stopped.
- This records local checks, not a new deployment or an approval to migrate. Public GETs
  returned an empty verified catalogue and location data; real content and native
  production acceptance remain separate.

## Security Verification and Primary Recovery - 2026-11-17

Owner requested all code-side release/security checks. Dependency topic starts at57441af,
not the older main graph. Nuxt4.6.4/Nitro2.13.6/Vite8.3.8 and patched Nuxt/schema subtree
reduce full-tree audit43findings(8high/26moderate/9low) to4(0high/0critical/3moderate/1low).
Production-only audit reports2tooling findings; it is not a deployed-code reachability audit.
Remaining exact esbuild/minimatch exceptions and primary references are in docs16. No
blanket major override, suppression or zero-vulnerability claim. Node security floor and
all CI selectors now require22.23.5..22.x. The verified official temporary runtime and
Gitleaks8.30.1 archives matched their published SHA256 checksums; no system runtime change.

Independent reviewer found no dependency-diff defect, but identified two pre-existing
gate gaps. New audit:dependencies evaluates BOTH full/prod reports, exact reviewed GHSA/
version/severity/reported paths and consistent counts; registry failures fail closed.
An initial implementation checked only full-tree; reviewer demonstrated the production-only
Nitro archive path was missed. Explicit archive exception plus two-scope collection and
production-path regression close that P2; independent replay/four tooling tests PASS.
It is not an exhaustive proof of every possible dependency path.

New raw HTTP smoke revealed //api/v1/profile returned404/application-json/no-cache rather
than the private no-store/safe error contract. Unit raw-path matrix failed before the fix.
Conservative origin-form separator/dot classification in private-api now covers those paths;
no router/auth proof or actual request target is rewritten. Unit and compiled raw HTTP
tests now PASS:11API separator/dot/encoded-slash paths plus4external-redirect probes.
Reviewer independently checked15private variants,7negative/public cases and safe errors,
with no final findings. This is not evidence of a reproduced account/data exposure.

Final unchanged code candidate on Node22.23.5: frozen offline install/explicit no-dotenv
prepare, Nuxt+operations typechecks, lint,206unit,44tooling,95SQL+legacy0001→0009 upgrade/
replay,20public browser and46DB-browser PASS (48.3s for the full DB run). Node build/compiled
HTTP smoke, synthetic recovery12tables/52rows, Vercel1Node22function/74routes and both
public-output guards80files/69scripts PASS. Optional Cloudflare build PASS; Node output
restored and owned DB/server processes stopped. Latest full logs: private temporary
tb-repository-checks-uzJiQh. Earlier full22.23.1 pass,22.23.5 raw-path RED and a later lint
failure are historical attempts, not retroactively all-green. An ad-hoc smoke also raced
a rebuild/missing artifact; the sequential final run is the acceptance evidence.

Gitleaks all-ref scan109reachable commits has one generic-api-key false positive: a fixed
unit-fixture UUID commandKey. No credential detected by these rules; report fully redacted.
GitHub secret-scanning API reports disabled, not a clean alert list; no setting changed.
Screenshots of mobile Candidate and wide operator were inspected after framework update.
Independent reviewer did not repeat the entire coordinator build/browser/SQL suite.

External state changed during this work, not by the agent: repository now PUBLIC,
Dependabot63 merged to main99b2f0c, PR65 remains OPEN and is no longer draft. GitHub exposes
a new Production deployment7851282427 at11:00UTC, Vercel status SUCCESS/"Deployment has
completed". Primary11:18UTC: /302→/jobs and /jobs200;11:19health200/runtimevercel and public
catalogueDEMO returned. Previous primary404 no longer reproduces. Exact cause of the earlier
failure was not isolated; do not claim visibility/reconnect alone proved its cause.
Owner screenshots show Hobby/Gitconnected/mainProduction; team invitation unavailable
without Pro. The present public repo is not blocked by private-org Hobby rules. Actual
private provider logs/settings remain inaccessible; no bypass, account switch or token
handoff. No agent main merge/deploy/env/domain/DB/billing mutation. Primary main deployment
is NOT the pending full MVP source. Topic PR/CI publication is recorded separately below.

## Repository Consolidation — 2026-11-17

Owner requested cleanup of stale PRs and the repository workflow. The open-PR snapshot
contained19items:18human cumulative changes and Dependabot63. Exact Git ancestry showed
17human heads already included in source-rights43f74aa; the remaining baseline25 head
5f5f3b5 carries main57b03a0 and its tested CI/health resolution. Integration fast-forwards
the existing remote line, then merges25 to preserve every head without rebasing history.
CI reconciliation retains public/browser/privacy/Vercel output gates, PostgreSQL integration
and the already-merged optional Cloudflare build. No new source activation or provider change.

One integration-to-main draft PR will replace the cumulative human review queue after
verification; close reasons must link the replacement and never claim a main merge.
Do not delete the preserved source branches. Dependabot63 contains newer security updates
than the MVP lockfile and is not a duplicate; retain it for an isolated update/retest.
Local verification of the consolidated working tree: Nuxt/operations types, lint,
205unit tests,40tooling tests,95SQL tests plus legacy migration upgrade/replay PASS.
Node build/HTTP smoke/public-output checks PASS;20public browser and46database browser
tests PASS (the full46run, not the16November timeout rerun). Vercel build/output guards
PASS1Node22/74routes/81public files; Cloudflare build PASS and local Node output restored.
The old test runtime and primary provider settings were not used for these checks.
CI YAML assertions preserve all gates;52relative documentation links in7changed files
resolve. Independent read-only review of the consolidation and closure policy reported
no findings; it did not rerun the tests. Published-head CI remains a separate checkpoint,
not inferred from local results. No dependency or migration version changed in this consolidation.

### Historical PR25 reconciliation earlier on17November

PR24 was merged by the owner as57b03a0. Earlier October entries saying it is unmerged
are historical. Baseline25 merge5f5f3b5 preserved Cloudflare+PostgreSQL checks and health
runtime/timestamp/liveness/no-store. Local28unit/13CIguard/2SQL/types/lint/Node+Cloudflare
build/compiled smoke passed; independent focused review had no findings. GitHub
[CI44036893450](https://github.com/talentbay/talentbay/actions/runs/44036893450) passed both
jobs, PR25 was CLEAN/MERGEABLE and unmerged at that checkpoint. Not a current MVP release.

## Source Rights / Current-State Reconciliation — 2026-11-16

Owner requires no copied third-party job descriptions, no logged-in scraping and preference
for employer ATS feeds. Official LinkedIn/Indeed terms and Lever/Greenhouse API docs were
checked; public access, anonymous access, facts-only selection and robots instructions do
not establish republication rights. hiQ2022 is preliminary CFAA relief, not blanket scraping
permission/prohibition. Project-specific permission remains CEO/legal/content-owner work;
see docs08/25 for primary references and bounded engineering policy, not legal advice.

Implemented b7e00be in [draft PR64](https://github.com/talentbay/talentbay/pull/64): automated
Lever factual whitelist + constant TalentBay notice, original link/IDs preserved; no source
description/HTML/list/additional/salary or unmapped location prose in snapshots/items.
Public-ATS/facts-only approval, terms URL, existing permission reference/owner/date mandatory.
Policy fingerprint invalidates old/changed-permission snapshots. Fetch explicitly omits
credentials; fixed origins/redirect/budget constraints retained. Shared source URL validation
rejects known main linkedin.com/indeed.com subdomains, including normalized case/trailing dot;
this limited blocklist is not an all-provider authorization or a text-origin detector.
CSV/JSON/manual publishing remain server-authorized and require first-party/cleared text;
source registry stays empty, scheduling off. No new dependencies/migrations or live source run.

Actual checks:202unit PASS, Nuxt and operations typechecks PASS, lint PASS, clean Node build
PASS2m01s,95SQL integration plus legacy upgrade/replay PASS,4compiled DB-backed admin/source
browser checks PASS37.3s. Initial8 focused regressions failed before implementation; malformed
URL refinement regression was caught and fixed with existing tests retained. The first smoke
could not become ready with no stdout under concurrent local work; unchanged repeat PASS.
Independent read-only review found no production-code defect. Its optional legacy-snapshot
test was added; reviewer then found a test-only generic409 assertion gap. Exact config-mismatch
message now required; focused8source SQL tests PASS after full95suite, final static review
closed the gap. This is not an independent rerun of our full tests.

Expanded compiled browser run:45passed/1failed out of46; long CSV/publication scenario hit
its unchanged30s test budget. The same scenario passed in the earlier focused run. Trace
shows cumulative navigation/viewport work reaching the budget, not a source-fetch/legal
gate rejection. Address-specific unchanged rerun PASS9.8s (13.5s including setup); the
original45/46 run remains recorded as failed, not retroactively relabelled all-green.

Second CLI0.149.1 was attempted in workspace-write sandbox, explicit cached gpt-5.6-sol/high;
existing authorization was revoked (token_revoked/exit1), so no delegated implementation ran.
No login/account switch/auth copy/retry workaround; coordinator implemented and the separate
built-in read-only reviewer checked it. Do not call self-verification independent review.

Fresh live read-only evidence: review/jobs200/noindex, Telegram capability true, Google/
GitHub false, profile401/admin403. First vacancies request500 at18:44UTC; one repeat returned
200/5DEMO at18:47UTC. Exact preview compute active; Vercel MCP logs403, same-scope CLI65.5.0
fallback succeeded. Logs show generic500 then200/648ms, not a proven cause or a deployed
reliability fix. Primary talentbay.org404/DEPLOYMENT_NOT_FOUND. No candidate data read,
Neon SQL, runtime env/bot/protection, billing or domain mutation. Demo Apply remains off.
GitHub reports74default-branch dependency alerts (25high/37moderate/12low); not triaged here
and not established as the advisory count of this different MVP branch/runtime.

Current five states: code ready / listed local checks passed / draft64published / not merged /
not deployed. Stacked base #62 is outside current CI filters; no new successful CI claimed.
Next: source64 review/consolidated integration+CI, one CEO-approved employer feed with terms/
field-use evidence, isolated factual pilot→review/publish, human candidate/operator acceptance.
Separately diagnose recurrence of the initial catalogue failure before beta. No new date,
hours/full-time commitment, pre-ICO/payment/custody scope or public release is implied.

## Native Mini App Auth Recovery - 2026-10-28

Owner reports guest Profile/Applications and a Telegram sign-in error even after fully
restarting Telegram. Two initial native requests returned401 before session creation;
old runtime logs did not classify the rejection. Same-key negative-link probes confirmed
the configured bot HMAC key matches the owner's local test-bot key without authenticating
a fake identity or writing an account. Provider/local clocks agreed within3seconds.

Reproduced SDK-load/navigation race: fresh launch hash disappears during navigation and
the SDK restores an expired cache; real compiled request returned401/expired. Capturing
only at onNuxtReady then failed401/format because Nuxt already normalized the nested hash.
Final code captures original bytes at client-module evaluation before router setup and
uses them for startup, start_param and explicit linking. Independent review found the
old Connect action still selected another SDK identity: a compiled RED regression proved
the wrong valid identity was posted. The action now uses the adapter's closure-held source.
No raw launch data in reactive state, new storage, logs, artifacts or public error bodies.

Hashless reload can load the official SDK using its existing bounded cache as a hint only;
HMAC,300second age limit, account-conflict and origin checks are unchanged. Cleanup tracks
the normalized URL carrier separately, clearing unchanged success/failure fragments while
preserving navigation. Expired SDK caches remain fail-closed: reopen from the bot; do not
write private SDK storage or reuse a browser session as proof of the Telegram identity.

Source `15b8ca3e0bd0bf48aece2b13be8ea6f43be77ef9`, draft
[PR62](https://github.com/talentbay/talentbay/pull/62), base #61's branch, not merged.
Current CI branch filters exclude that stacked base; no new GitHub CI success is claimed.
Actual clean-env local checks:198 unit,94 SQL integration plus migration upgrade/replay,
46 compiled DB-browser,20 public browser,40 tooling tests; Nuxt/operations typechecks,
lint, Node build and production HTTP smoke PASS. Loopback-restricted sandbox first blocked
smoke/tooling; permission-correct reruns passed without source/test weakening. An initial
link-test setup referenced removed legacy columns; fixture corrected to current oauth_accounts.
Independent read-only review reproduced linking/cleanup findings, then passed ten focused
scenarios with no remaining confirmed actionable defect. Owned test PG/servers stopped.

Fresh clean Vercel build/output guards PASS:1Node22/74routes after restoring the ignored
test-only noindex rule,81 public files/70scripts; actual bot token absent from public output
and commit. Published only to the already-approved `talentbay-review`:
`dpl_8Wz9SXdX64hmMvDRNSa7W6RENqua` READY, stable
<https://talentbay-review.vercel.app/jobs>. Eight HTTPS API/browser checks PASS30.3s;
public200/noindex, Telegram capability true, anonymous profile401/no-store and unique SSO302
reconfirmed. Main/domain/billing, provider env/menu/webhook and Neon schema/grants/data were
not changed by the recovery. Demo Apply guard remains. Rollback target is the prior test
deployment `dpl_CBXZ9Kq4RhJwYevBKDWNEqMhHHrs`; no DB rollback/secret rotation needed.

One additional hydrated guest Profile/Applications HTTPS check PASS4.4s: configured Telegram
offers opening the bot, not unavailable-preview copy; no auth POST was made. A raw-HTML
assertion was inapplicable because these private routes intentionally use client rendering.
Negative-only format/HMAC probes returned401/no-store with generic public bodies; scoped
runtime logs confirmed the corresponding fixed stages for those two exact probe request IDs.
No successful native request is inferred from these negatives. Final94SQL/legacy upgrade/
replay repeated PASS on the committed source with owned PostgreSQL stopped afterwards.

Fixed failure-stage logs accept only eight enum values on auth401 and expose no raw data.
Post-deploy owner reply on2026-10-28: "Yes, Profile and Applications open" in response to
the fresh bot-open/profile/no-warning check. Native sign-in and those two screens are now
owner-confirmed manual acceptance, not an agent-read of the user's profile or session.
This does not prove command delivery, all Telegram platforms, explicit linking, real Apply,
operator handling or full MVP/beta acceptance. Reproduced defects still do not identify the
exact rejection stage of the original request. No code/provider changes followed this reply.
Code ready / local tests passed / draft published / test deployed / native entry owner-passed.

## Test Telegram Bot Connected - 2026-10-28

Owner populated the approved ignored/mode600 token file. getMe verified the exact separate
test bot `talentbay_tester_bot`, ID9279549942; no Pre-ICO bot/account switch. Prior state:
no webhook/pending updates, menu commands, no default/private commands. Five new server env
keys were created only in `talentbay-review` (token/webhook secret sensitive, bot ID/username/
app origin config); no old credentials or paid settings changed. No real secrets entered
CLI arguments, Git, notes or the build. Actual bot token absent from all81 public build files.

Same prebuilt19eecf3/runtimeb869a10, new test-only deployment
`dpl_CBXZ9Kq4RhJwYevBKDWNEqMhHHrs` READY. Capabilities now Telegram=true, Google/GitHub=false.
Ten actual HTTPS probes PASS: wrong HMAC/origin rejected, missing/wrong webhook secret403,
correct secret/no-message update200 and malformed400, private/admin denial/no-store and
no secrets in SSR. No fake identity/session or receipt was created by these probes.
Eight DB-backed HTTPS API/browser checks repeated PASS30.9s; only the temporary capability
expectation changed false->true to match the newly configured environment. Runtime source
and the existing code/SQL tests were not changed. Public alias/noindex and unique SSO302 retained.

Telegram accepted five all_private_chats commands, menu Open TalentBay -> /jobs and webhook
-> /api/v1/bot/telegram, secret header/max_connections2/allowed_updates message only;
drop_pending_updates=false. Immediate menu read still showed commands; a guarded menu-only
attempt aborted before mutation because state had changed. Subsequent read verified the exact
web_app menu, all commands and webhook, pending0/no error reported. No blind webhook reset.
has_main_web_app=false: share the bot chat URL, not an unverified startapp direct link.

Owner asked to check real Telegram Start -> Open TalentBay -> Profile. Native successful
login/profile, command delivery and operator/human acceptance remain pending, not inferred
from HMAC-negative probes or provider settings. No real candidate data was read, no admin
promotion/outreach/primary project/domain/billing change. Demo Apply protection unchanged.
Rollback: first delete only this test webhook preserving pending updates, restore previous
commands menu/private command scope, then restore prior DB-backed/no-bot deployment
`dpl_Fa64rRp3SiwfssVLX9qoVy71mZSr`; retain accounts/data, do not rotate secrets/drop tables.

## Restricted DB Runtime Connected - 2026-10-28

Owner explicitly answered "Yes, a separate restricted DB user" to the11-table DML/sequence
permission. This supersedes the earlier rejected/pending operation below; no workaround or
existing-role/password rotation was used. Read-only preflight confirmed the exact new DB,
PG18.6,10 migrations,11 public tables/7 sequences and no existing runtime role.

Created SQL role `talentbay_review_runtime` only on preview `br-jolly-glade-ash2y5iy` with
LOGIN and no superuser/CREATEDB/CREATEROLE/REPLICATION/BYPASSRLS. Explicit named grants only:
44 SELECT/INSERT/UPDATE/DELETE privileges on the11 current tables and USAGE/SELECT on7
current sequences; no default/future-object grants, grant option, TRUNCATE/REFERENCES/
TRIGGER/MAINTAIN or sequence UPDATE. Same-transaction assertions verified no inherited
memberships, database/schema CREATE or migration-schema/journal access. Baseline PUBLIC
privileges were not rewritten; roles are branch-scoped, grants are in the new DB only.
The generated credential is sensitive configuration of the new Vercel project, not Git,
local dotenv or migration credentials. No grants/SQL to old neondb or other branches.

Before cloud seed, existing import Zod/content mapping and Drizzle compiled the five
fictional non-Amsterdam fixtures. One disposable PG18 rehearsal proved wrong-DB rejection,
late-error rollback, DRAFT/UNREVIEWED before deliberate test publication, and rejection of
replay into a nonempty target without overwriting. First local startup failed due to macOS
locale before SQL; LANG/LC_ALL=C fixed the temporary process only. Owned clusters stopped.
The17-statement plan then committed only in `talentbay_mvp_preview`, with exact-database,
migration-count/empty-table guards and locks. Actual counts:5 organisations/5 vacancies,
0 users/profiles/applications. Titles/descriptions are explicit DEMO, source is the existing
preview dataset, no real external URL/fetch/source publication/reviewer identity is invented.
Demo source status and the server-side Apply prohibition are preserved, not renamed around.

Same prebuilt19eecf3/runtimeb869a10 deployed only to `talentbay-review`:
`dpl_Fa64rRp3SiwfssVLX9qoVy71mZSr` READY, stable <https://talentbay-review.vercel.app/jobs>.
Live200 returns the5 prefixed DB rows; pg_stat_activity independently shows2 idle connections
as `talentbay_review_runtime`.44 non-grantable DML grants/0 inherited memberships/no CREATE/
journal access reconfirmed read-only. Noindex persists; unique URL retains SSO302.
Eight HTTPS API/browser checks PASS26s: detail, country/full-text search, three cursor pages
without duplication, private/admin denial/no-store and320/390/1024/1440 layouts/Saved/back.
The first probe used unsupported `cursor` and got400; corrected to contract `before`, retaining
a separate400 assertion for the unknown field. No application assertion/code was weakened.
Two existing HTTPS calculator/hydration tests PASS10.3s; screenshots inspected. Output guards
remain1Node22/74routes/public81files70scripts PASS. Runtime source/dependencies unchanged;
these10 hosted checks are separate from the previous deployment's20 guest checks and R03/CI.

Actual operational commands (temporary probe files, not committed product runners):

```bash
node --import tsx /private/tmp/talentbay-review-seed-plan.mjs
pnpm exec playwright test --config /private/tmp/talentbay-review-db-playwright.config.mjs
pnpm exec playwright test relocation-outcome.spec.ts relocation-hydration.spec.ts --grep 'currency boundaries|SSR relocation controls' --config /private/tmp/talentbay-review-public-playwright.config.mjs --output /private/tmp/talentbay-review-db-relocation-results
node scripts/assert-vercel-output.mjs
node scripts/assert-public-output.mjs .vercel/output/static
```

Auth capabilities are all false; test-bot token still absent. No real user/admin bootstrap,
Telegram/OAuth/provider login, operator/Apply/native/CEO acceptance or real content acceptance.
No primary production/domain/billing change. Live test DB may scale to zero normally; no
background polling or forced suspension of the running site's requests. Next: test bot token
through the ignored file, exact getMe verification and docs28 setup/native acceptance.
Rollback: restore prior test-only guest deployment `dpl_7VyosvQp3LbjPryHWLoWYYGEvVph` (its DB
config is empty); retain role/data pending approved cleanup, never drop/reset another DB.

## Public Internal Review Stand - 2026-10-28

Owner explicitly approved the separate free `talentbay-review` project and its public
test URL, knowing Vercel calls its first deployment Production. This is not the primary
TalentBay production, a commercial beta or provider/legal certification of Hobby use.
The owner's non-commercial classification is reported; do not re-request the same hosting
permission. No paid plans/trials, main merge, primary project/domain change or outreach.

Created project `prj_e1D1S2QPVCWeIQPD7ACbF08ydyuW` in existing Hobby scope
`team_cjyqd17DfaDhcsylDIgQmBTl` / `alexs-projects-76662c2b`, no Git integration.
MCP project creation returned403 without creating anything; same-account CLI65.5.0 creation
succeeded. CLI auth/link and exact new project ID were verified; no account switch/login.
CLI-generated OIDC file is ignored/mode600; its extra gitignore line was removed without
changing the existing ignore policy. CLI is temporary under `/private/tmp`, not a dependency.

Published source `19eecf39c8fdae53ce9754c6b7e9dae9ce8e5588` (runtime `b869a10`, R03):
deployment `dpl_7VyosvQp3LbjPryHWLoWYYGEvVph`, READY, stable public review URL
<https://talentbay-review.vercel.app/jobs>. Unique deployment URL retains Vercel SSO302;
the stable alias returns200 without Vercel login. No protection setting was weakened.
Fresh clean-env `NITRO_PRESET=vercel pnpm build --dotenv /dev/null` PASS, one generated
Node22 function/73 routes; public-output guard81 files/70 scripts PASS. Only the ignored
test deployment artifact then gained a continuing `X-Robots-Tag: noindex, nofollow, noarchive`
route (74 routes). Header verified over HTTPS. This rule must be reapplied after a rebuild;
it is not an application-code change or an access-control mechanism.

New project session secret was generated independently and stored as sensitive provider
configuration. An owner-role URL for the new preview DB was briefly prepared in this new
project, then replaced with an empty value **before the first deployment**. Runtime DB is
disabled: guest/demo catalogue only, no DB reads/writes/seed or candidate records. Automatic
security review rejected the proposed least-privilege login-role provisioning before
execution. No role/grants were created; a separate explicit approval was requested for
`talentbay_review_runtime` and DML/sequence access to only the11 existing test tables.
Do not bypass that rejection by deploying owner credentials or creating the role indirectly.

Actual HTTPS verification: public catalogue200/DEMO5, private profile401/admin403/no-store;
17 candidate-shell browser tests plus3 relocation tests PASS (32.4s/7.7s). Six viewport widths
320..1440, save/remove/undo/cross-tab state, keyboard/filter/back navigation, hydration,
currency boundaries, delayed/error/retry calculations and mobile context were exercised.
Desktop/mobile screenshots inspected. These are guest tests, not DB/native/user acceptance.
Existing fallback fixtures include Amsterdam; they do not expand the agreed launch geography.

Owner supplied test bot `@talentbay_tester_bot`; token still absent from the ignored/mode600
`.env.preview-review.local` at the last presence check. No getMe identity verification,
bot env/menu/commands/webhook mutation, OAuth setup or real Telegram acceptance yet.
Next: explicit runtime-role approval, guarded fictional DB content/runtime connection,
token via the local file only, exact bot verification/setup and real native/operator/CEO
walkthrough. Existing source/data/privacy/retention/beta gates remain. Rollback for this
guest publication: leave the new review DB disconnected and stop sharing this isolated URL;
do not touch the primary project, domain, legacy neondb or other branches.

## Isolated Neon Preview Database - 2026-10-27

Owner separately authorized preview-only read/wake/suspend, then creation of an empty
`talentbay_mvp_preview` database and committed migrations0000..0009 using the Free quota.
Exact target: project `royal-field-51154253`, branch `br-jolly-glade-ash2y5iy`, compute
`ep-rapid-sound-asrzobxf`. No production/integration SQL, copied candidate rows, seed,
role changes, exported credentials, application connection or deployment.

Read-only legacy inspection proved PG18.6,8 application tables and only0000/0001; both
hashes match committed SQL. A new database was created from template0, not from neondb.
The MCP transport rejects multiple SQL commands in a prepared statement. Before applying
DDL, two fresh local PG18 clusters proved a single-statement DO/EXECUTE transport equal
to the installed official Drizzle migrator: rows/sequences/indexes, columns/defaults/
constraints/enums and migration history match. Wrong database, partial-DDL rollback and
nonempty-target rejection PASS. Both local clusters stopped; no reusable custom migrator
or migration-file edits were introduced.

The installed Drizzle migrator generated the SQL and journal entries. Its93 statements
were applied atomically behind exact-database and empty-target guards to the new DB only.
Actual Neon read-only verification:10 journal hashes/timestamps match,11 public application
tables/132 columns with types/nullability/precision, all22 declared indexes,16 foreign keys
and3 checks present; all11 application tables empty. Legacy neondb catalog and its two
journal entries compared unchanged without reading candidate rows. Preview compute is
again idle with no pending operation. Production compute metadata is also idle; its branch
metadata became ready during the earlier preview wake, not a production SQL/start request.

Runtime remains independently reviewedb869a10; this is provider preparation, not new code
or HTTPS/native acceptance. New DB is not yet connected to an app. No real data, admin
bootstrap, source approval, OAuth/bot setting, provider secret, DNS, plan or billing change.
Owner selected no paid plans and prefers Hobby until users are invited. Zero revenue does
not establish Hobby eligibility under Vercel's commercial-purpose rule; hosting remains
an explicit gate, not permission to silently upgrade or migrate platforms (docs20).
Next: eligible protected HTTPS target and approved environment/credential operations,
then actual browser/provider/native/operator acceptance. Existing neondb remains untouched;
rollback for this isolated preparation is to leave the new DB disconnected and compute idle.

## Resumed Feedback / Independent Review - 2026-10-27

CI-only7a3a2ef / draft #60 exact CI40572511707: scope/build/PostgreSQL all SUCCESS.
Observed build2m16/SQL3m13, not a benchmark. Separate read-only CI reviewer found no
confirmed defects;6 focused tests PASS, hosted permissions outside review scope.
R01 has now returned two P1 application findings (docs35); fixes are in R02, not accepted
as K2 readiness. PostgreSQL unchanged-recheck regression first failed409 as reported.

Owner explicitly resumed work and authorized a separate read-only reviewer. R01 reviewed
frozen `6278108e3576c3ecca7ebbc2c6885e86c41e183c`, not the mutable CI branch;
its findings/limits are in docs35. Exact #59 CI40527239793 is now confirmed SUCCESS
for both jobs. Its SQL job took13m58, with11m31 spent on Chromium's system package step;
logs show slow Ubuntu mirror downloads. Build took3m7. These are observations, not an SLA.

Separate CI-only slice: conservative complete-PR documentation classification with stable
required check names/failure propagation, headless-shell-only download and actual browser
startup before conditional official Linux dependency installation. Protected pushes and
unknown/code/config changes still run every suite. No browser cache/new action/dependency,
changed DB guard or weakened assertion. Workflow in docs03: one slice/checkpoint/concise
vault update; full tests once per finished applicable change, not every note.
Local40 tooling, lint zero warnings and actual installed Chromium startup/close PASS;
actual27dec55..6278108 documentation diff classified correctly. Runtime/SQL/schema unchanged;
their suites are retained in the new exact-head CI, not relabelled local reruns here.

## Autonomous Run Started - 2026-10-27

### R02: bind shown Apply context and preserve unchanged review eligibility

R01 confirmed two P1 defects, not external policy gates. Actual PostgreSQL unchanged
recheck regression first rejected409. The public DB-backed vacancy now carries a versioned
material-context fingerprint; Apply requires the shown value and compares it under existing
vacancy/company share locks before any snapshot/receipt. Changed duties, company name or
recipient ID return412; malformed/missing precondition is400, genuine duplicate remains409.
New snapshots retain that exact fingerprint; share/package checks compare material content,
not observation/moderation times. Timestamp-only historical snapshots keep conservative
checks and are not backfilled. An unchanged recheck preserves updatedAt while refreshing
review provenance. No schema migration or automated repair of old consent.

The modal retains its cover note after412, resets acknowledgment, refreshes the actual
listing and requires explicit renewed review. A compiled browser test exposed a stale
accessible checkbox name despite updated visible text; keying only the consent control by
context fixes it without remounting/losing the note. The original assertion passed, then
full41 DB browser and20 public browser PASS. Mobile renewed-recipient screenshot inspected.
Updated existing positive fixtures use real public context, not dummy hashes; strict input,
origin/ownership/duplicate expectations retained. SQL tests cover role change without
timestamp change, same-name company replacement, no receipt on conflict and current/legacy
unchanged recheck. Existing immutable snapshots, withdrawal/share concurrency and publication
invariants remain tested.193 unit,94 SQL with legacy upgrade,40 tooling, typecheck/lint zero
warnings/Node build/smoke PASS. Actual two-cluster recovery12tables/52rows PASS, including
new Apply contract; owned verification databases/processes stopped. No real data/providers.

Exact R02b869a10 / draft #61 CI40575115232: scope/build/PostgreSQL SUCCESS (8s/3m4/3m16;
browser install7s in both jobs). Independent R03 on exactlyb869a10 found no confirmed defects:
193 unit,94 SQL on its own PG18 and6 additional probe groups PASS, including actual lock
waits in both Apply/write orders, stale/same-name company, legacy/metadata, strict inputs
and changed/unchanged re-import. The reviewer did not independently run browser/build/
typecheck/recovery; coordinator evidence above is separate. Both reviewer-owned DBs stopped.

Next: K2 external/provider/data/policy preparation, not another speculative feature slice.
The separate loopback review3132/3133 was restarted and its actual fixture import/Apply/
handling requests returned200; chooser opened in the in-app browser. It remains active for
owner inspection. Automated test clusters are stopped; don't target this review DB for
cleanup. Main/production/shared DB, billing/domain/providers/outreach remain untouched.
This documentation closeout changes no runtime since reviewedb869a10; read final PR own CI.

### K1 Queue Reconciliation (implementation, not independent acceptance)

One current fallback queue is this section; docs24 remains task contracts, not a second
status tracker. GitHub org Project access was blocked by missing project scope (A05
evidence below); no token scope or duplicate board was created. Read final PR59 own head/CI
before claiming the candidate remote-verified. Exact review procedure: docs35.

| Task IDs | Current state | Evidence / next boundary |
| --- | --- | --- |
| TB-A01..A04 | CODE_VERIFIED | Integration ancestry, actual CI, dependency/environment/runbook evidence |
| TB-A05 | FALLBACK_ACTIVE | Explicit repo execution queue; org Project is not claimed configured |
| TB-B01..B09 | CODE_VERIFIED | Managed intake/snapshot/handling/correction/progress/withdrawal + SQL/browser/negative/concurrency tests |
| TB-C01..C04, TB-C06..C07 | CODE_VERIFIED | Source contract, bounded public/admin pages, provenance/review, offline Lever connector/durable runner; registry empty |
| TB-D01..D03, TB-D05 | CODE_VERIFIED |11-city contract/math/local dataset importer/outcome; real reviewed data not invented |
| TB-E01..E05 | CODE_VERIFIED | Local prototype fallback, complete routes, hydration/host/navigation/keyboard/width/error/retry tests and repeatable chooser/tour |
| TB-F01..F04 | CODE_VERIFIED | Operational definitions/dashboard/runbooks/redacted telemetry/actual two-cluster synthetic recovery |
| TB-G01..G04 | CODE_VERIFIED | Access/PII/cache/raw-body/output/audit/upgrade/volume review; actual provider/policy limits remain gates |
| TB-I01 | CODE_VERIFIED | Protected default-off bot contract/receipt/API + offline entry preview; no native transport acceptance |
| TB-C05, TB-D04, TB-D06, TB-G05 | GATE | CEO source permissions, reviewed city data, approved sharing/privacy/retention/support/content |
| TB-R01 | REVIEWED_FINDINGS | Owner-authorized independent read-only review6278108 found two P1 defects; bounded probes/limits in docs35 |
| TB-R02 | CODE_VERIFIED | Displayed-context precondition and unchanged-recheck fix; SQL/browser/legacy/recovery regressions above |
| TB-R03 | REVIEWED_CODE | Independent b869a10 read-only verdict: no confirmed defects;193unit/94SQL+6 probe groups, browser/provider limits above |
| TB-H01..H05 | GATE | Eligible target/budget/approved operations -> protected HTTPS/native/data/human verification -> explicit beta go/no-go |

Coverage:37 pre-review AUTO code slices + A05 explicit fallback =38;9 external-gate tasks;
2 independent-review tasks and1 post-review repair task =50. CODE_VERIFIED is synthetic
implementation/check evidence only, not merged-main/deployed/owner-accepted/legal-approved.
No X post-beta work is silently promoted. No deadlines/hours/people are assigned here.

### Repeatable whole-product review entry (E05)

#58 both CI SUCCESS40524069539, only integration FFa172ad8; main/production unchanged.
The separate loopback chooser now has fixed role-scoped destination selectors for existing
Jobs/Profile/Applications/Saved/Settings and operator Overview/Handling/Content/Import/Sources/
Users. Invalid/arbitrary external/privileged/duplicate destination is400 before session work;
default legacy forms remain compatible. Offline `/bot` preview is generated through the
real pure five-command contract using existing TSX, no database/webhook/Telegram calls or
receipt/delivery claim. Escaped text and fixed local paths only. Actual application bot,
source registry/cron/providers remain off. Rejected portal logs no longer echo raw headers.

docs21 has the5–10-minute newcomer -> job -> estimate -> profile/Apply -> operator -> public
progress/withdrawal -> CSV/draft/review route, plus explicit source-permission blocker and
offline SQL connector evidence. Static old "no event history" audit copy corrected to actual
TalentBay journal versus employer facts. No product page duplication/new admin redesign.

PASS190 unit/34 tooling (including generator/escaping/destination guard), Nuxt+standalone
CLI typecheck/lint zero warnings/Node build. Actual fresh `dev:review` started with all
migrations and fictional fixtures, ignored developer credentials; owned prior launcher was
identified before graceful stop and its synthetic DB retained. Chromium320 chooser -> new
profile -> offline bot -> shared Applications -> direct operator destination PASS; chooser/
bot/operator screenshots inspected, no horizontal overflow. Production smoke now asserts
/bot,/sample.csv and session helper absent, no local-review auth route. Full domain/browser/
recovery/adapter evidence remains G04 parent plus exact CI, not relabelled reruns here.

No runtime dependency/schema/provider/shared data/main/deploy/outreach/billing changes.
Next: K1 task/evidence reconciliation and exact independent-R handoff after CI. Real content,
city data, legal/privacy/support people, eligible hosting/providers/native/H remain gates;
code-ready synthetic review is not accepted/deployed/public MVP.

### Remaining public-body / output / abuse review (G04)

#56 both CI SUCCESS40519754874 (build15m36 largely Chromium installation, SQL3m30), #57 both
SUCCESS40522162621. Only integration FF9d0ee72, no main/deploy. G04 reproduced70KB whitespace
+valid signed Telegram auth accepted200. Remaining Telegram/resolve JSON reads now use
existing bounded fatal-UTF8/uncompressed parser32KiB/16KiB and strict inputs, no new auth
protocol/current-account/link semantics. All current JSON handlers now have explicit raw
bounds. Compiled oversized/type/compression/malformed/unknown-role fields reject before
persistence/query; positive resolve/auth still PASS. Legacy markup-shaped title/description
renders literal text, no executable injection/tracker request; unsafe source scheme is not
a link. No CSP change blocking Telegram and no fake per-process distributed rate limiter.

CI Node and Vercel builds inject fixed fake server-only canaries. The output probe detects
the marker in regular JS/maps/HTML/binary, requires actual browser JS and withholds raw
asset/env contents. Actual canary Node and Vercel static outputs81files/70scripts PASS;
Vercel73routes/one actual nodejs22.x bundle/fallback ordering PASS. No forge/fontless runtime
import found in executable Vercel chunks. Ordinary Node output restored and HTTP smoke PASS.
Fresh registry audit still3 known tooling entries (1high/1moderate/1low), not43 default-branch
alerts or zero risk; maintainer references rechecked. No dependency/lock/schema change.

PASS190 unit/90 SQL+legacy upgrade/31 tooling/typecheck/lint zero warnings/Node builds/smoke.
Full20public/39DB PASS before adding only the extra XSS assertion; final focused2 HTTP/XSS
PASS on unchanged runtime. These counts are not a claimed full40 rerun; exact PR CI remains
required. docs16 records provider distributed abuse/quotas/WAF/alerts/cost/owner gate, not
proof from local unique keys/timeouts. No provider/shared data/main/outreach/billing changes.
Next AUTO E05 complete review walkthrough and K1 reconciliation; independent R and real
source/dataset/legal/provider/hosting/native/operator H acceptance remain separate.

### Browser / Telegram launch and popup failures (E04)

G03 `e612e6f` / #56 CI40519754874: PostgreSQL job SUCCESS; build still running at Chromium
installation when checked. Integration remains0cdbb55; no premature FF/main/deployment.
Seven actual client lifecycle tests cover blocked/thrown popup open, cancel, refresh after
closure, duplicate click, link identity proof,120s timeout/intent error/unmount/stale close.
Thrown open first failed; now safe false/error/busy reset. Intent/identity transport10s
bounds; original server proof/session protocol retained, no new provider SDK/framework.

Seven compiled host/SQL matrices cover unsigned SDK guest, expired/tampered401/no-store/no
identity, SDK download failure, optional methods throwing, clamped insets/repeated launch,
slow auth/user navigation and separate cookie stores409/no silent switch. Initial three
negative launches retained fragment; finally now clears only the original launch hash
after SDK use on both success/failure, not a later unrelated anchor. First full37/38 had
one incorrect Settings locator; changed to existing banner link. Next focused6/7 exposed
a genuine slow-auth race: user-clicked Profile was pending while launch job redirect won.
Short-lived router beforeEach tracks navigation intent. Actual profile JS is held to make
that race deterministic; three repeated matrices21/21 PASS, final full38 DB browser PASS.
Positive signed job launch/back/theme tests remain intact; no timeout/assertion weakening.

Final full20 public browser, Nuxt+CLI typecheck/lint zero warnings/Node build/HTTP smoke PASS;
188 unit PASS including7 new lifecycle cases.90 SQL/30 tooling/upgrade evidence is parent
G03 (no schema/backend logic change here), not claimed as new reruns. docs17 records exact
simulation limits/deviations; no Figma freeze/provider/native/owner/independent R acceptance.
Existing local chooser3133 verified200. No deps/schema/provider/main/shared data/outreach
changes. Next AUTO E05 full walkthrough, G04 remaining body/abuse/output review and K1;
real sources/hosting/provider/policy/H and independent R remain gates.

### Safe default SQL tests / legacy upgrade / representative volume (G03)

#55 both CI jobs SUCCESS40518198669, only integration FF0cdbb55; main/production unchanged.
Legacy `test:integration` implicitly read .env.integration and direct Vitest config had no
target assertion. Default entry now creates its own fresh PG18 from the existing clean
environment/owned-cluster helper, no dotenv/target arguments/shared/cloud. Config itself
guards before test collection. Negative subprocess tests reject shared URL without secret
echo and injected target args.180s stages and SIGINT/SIGTERM cleanup owned child group/PG;
actual interrupted rehearsal returned1/no false PASS after upgrade, normal final run90/90
SQL PASS and owned cluster stopped. CI keeps disposable service and now verifies upgrade.

Actual committed0000/0001 with six legacy row types -> all through0009: fields/IDs/provider/
profile/application preserved, no invented snapshot/events; new nullable Telegram identity
and exact migration replay inventory PASS. Existing concurrent Apply/withdraw/share/assign/
correction/reopen/import/review/source/dataset/bot regressions retained.5000 synthetic roles/
1000 applications:3428 public matches walked completely,50-row/<128KiB public and25-row
admin pages, full counts/dashboard/private projection and actual indexes/FTS plan PASS.
One observed full walk+queues3502ms, selective GIN1.205ms; not production SLA and complete
cross-join OR search is not proven GIN by this separate selective probe. docs34 records
scope, rollback reader compatibility and limits. Initial new volume tests used wrong
cursor/index names; corrected to actual contracts, no production API/schema change.

PASS181 unit/90 SQL/30 tooling/typecheck/lint zero warnings/Node build/HTTP smoke.
First tooling run without listener permission hit sandbox EPERM; permitted loopback rerun
30/30 PASS, no weakened test. App runtime unchanged since #55 full20public/31DB/recovery/
Vercel check; these are parent evidence, not rerun claims for this tooling-only slice.
No deps/schema/provider/shared migration/main/deploy/real data/outreach changes. Next AUTO
E04 host/popup edge cases, E05 walkthrough and G04/K1; independent R/real H remain gates.

### Private API / processing inventory (G01/G02)

#54 final HEAD both CI jobs SUCCESS (`40512658640`); integration only FF to5a503c1,
main/production unchanged. Direct compiled negative matrix first reproduced401/404
no-cache (not promised no-store) and a70KB whitespace profile JSON accepted200. New profile
and linking writes use existing fatal-UTF8/uncompressed bounded parser64KiB/2KiB plus strict
field allowlists, not a new auth framework. Identity/role/email/passport fields cannot be
submitted as profile edits; current-user/provider proof and origin checks remain intact.

Installed Nitro2 source confirms404 overwrites earlier cache policy and default errors
can echo URL/data or print raw unhandled API diagnostics. An API-only handler is prepended
through the standard config hook, retaining the original Nuxt HTML renderer after it;
compiled chain order verified. API failure status is preserved, message/body keys are fixed,
no URL/stack/input/SQL/cause. Early cache-only middleware covers private session/auth/profile/
application/admin and sensitive anonymous salary responses. No new auth requirement for
public jobs/calculator, no public positive listing cache bypass or relaxed API protections.

All3 focused HTTP matrices red->green: guest, owner, other candidate, current/revoked ADMIN,
package/progress/private notes, body/transport/unknown fields, ownership/no-store/unchanged
roles/profile. Full20 public/31 DB browser PASS,181 unit/88 SQL/28 tooling, lint zero warnings,
Node/Vercel builds (73routes/one Node22 bundle/fallback order) PASS. Node restored, serial
Nuxt+CLI typecheck and final HTTP smoke PASS. Initial concurrent build/typecheck regenerated
shared Nuxt metadata mid-check and produced missing auto-import/inference errors; serial
check after build passed without fake globals/casts or disabled tests. Build/typegen are
now serialized for this config change. Final `pnpm test:recovery` after the private-cache
addition PASS:12 tables/52 rows, restored inventory/identities/history/new Apply/withdraw,
DB-unavailable negative probe and redacted logs; owned processes stopped before PASS.

docs33 inventories actual profile/snapshot/event/provider/receipt/client/log/backup copies,
authorized projections and existing destructive cascade risks. No deletion/export endpoint
or invented legal basis/retention period/support owner is added. Salary is absent from
navigation/localStorage, but existing GET API query can be seen in browser/provider logs;
no-store/app query stripping is not a promise to erase those metadata. H02/G05 must resolve
the real logging/transport policy. No dependencies/schema/provider/main/shared DB/outreach
change. Next AUTO G03 disposable test entry/upgrade-volume-concurrency checks, then remaining
E/G/K1; independent R and real data/provider/privacy/operational gates remain separate.

### Bounded diagnostics and repeatable synthetic recovery (F04)

#53 both CI jobs SUCCESS (`40509644513`); only integration FF from fecfb57 to b961bb8,
main/production unchanged. Request logs now use fixed route templates rather than raw
IDs/slugs/unknown paths, plus allowlisted error names/sources/status and six bounded
operation tags/outcomes. No candidate/contact/note/source/provider identifiers or input
payloads. HTTP completion is not message delivery; replay/invalid preview/failed source
state remain distinct. Connection establishment now has5s bound, not a promised whole
request SLA. Existing authorization, no-store, transaction bounds and WAF stay intact.

`pnpm test:recovery` accepts no existing DB/archive/credential target, ignores inherited
secrets/PG services/Node injection, creates two new owned loopback PG18 clusters and uses
real compiled HTTP auth/profile/import/review/handling fixtures + actual synthetic DRAFT
dataset CLI. Custom dump -> empty second DB -> full canonical row digests/counts/sequence/
index equality -> unchanged migration replay -> permanent IDs/corrected history/privacy/
no repeat package/new profile+Apply+withdraw. Then stop DB while process lives: health200,
dashboard500/request ID/no fake counts/connection leak. Actual operation/replay and private
log absence asserted, owned apps/clusters stopped before PASS. No shared data/real provider
or user/company contact. Final rehearsal:12 tables/52 rows PASS; only synthetic local
artifacts retained in the printed temporary folder, not Git/vault/PR attachments.

An extra real-runtime negative probe first failed unknown API privacy: fallback echoed a
path and reached renderer diagnostics. Fixed a specific JSON404/no-store catch-all after
known API handlers, no URL echo/SSR fallback. Same probe then PASS, including log absence.
Vercel build output PASS73 routes/one actual nodejs22.x bundle; catch-all presence/order
now required by output guard with negative regression. Node output restored and smoke
passed again. PASS178 unit/88 SQL/28 tooling/types/lint zero warnings/Node build/smoke,
full20 public/28 DB browser. Full browser runs preceded only pure operation-result helper
extraction; final unit/types/lint/build/rehearsal/HTTP cover the identical helper behavior.
No dependencies/schema/provider/main/deploy/shared backup changes. docs32 contains triage,
app-vs-DB rollback and real backup/alert/people gates, not fictional on-call/RPO/RTO/legal
retention approval. Local chooser3133 still HTTP200. Next AUTO G01/G02 authorization/PII
matrix, remaining E/G and K1; independent R and real data/provider/policy/H remain separate.

### Relocation pre-hydration input safety (focused E02/E03 follow-up)

#52 both CI jobs SUCCESS (`40508773000`). Integration remains fecfb57 until this follow-up
is checked as well; no main/production promotion. The earlier public failure is confirmed
as a real exposed hazard, not dismissed after warm reruns: with client JS held, SSR salary
input was enabled before Vue handlers. New deterministic regression failed on that actual
compiled output. Existing Jobs search already uses mounted interactivity; the same small
pattern now disables relocation income/destination until mounting. No disabled SSR control
accepts a value that hydration can discard. Ordinary hydrated UI/calculation is unchanged.

Node build/types/lint zero warnings/HTTP smoke PASS, focused SSR+original outcome15/15
repeated tests PASS, final full20 public and28 DB/browser PASS concurrently. Unit176/SQL88/
tooling25 from parent remain unchanged (no domain/schema/dependency changes in this fix).
Test holds actual JS responses and releases them, then asserts first input/result; no
sleep, timeout extension or weakened original assertion. Implementation reference:
[Playwright hydration guidance](https://playwright.dev/docs/navigations#hydration),27Oct.
No provider/main/shared data/outreach/design-freeze/R/owner acceptance claim. Next AUTO F04
bounded telemetry/incident/recovery, then remaining E/G/K1; real content/policy/H gates remain.

### Operational work overview (F01/F02 and F03 runbook)

#51 both CI jobs SUCCESS (`40505854280`); integration only FF to fecfb57, main/production
unchanged. Current dashboard uses one read-only repeatable-read snapshot/DB UTC clock,
rolling7/30/90-day activity and all-time current work, with5s statement bounds. Shared
queue predicates cover awaiting start, all in-progress stages, no current-admin assignee,
mine and exact received/effective-contact/handoff windows. Distinct applications exclude
corrected facts/retry inflation; no delivery/hiring/conversion funnel is invented. First
STARTED latency exposes its actual sample count, excludes missing legacy/bad chronology.
Oldest5 links open an exact off-page ID; queue URL/reload/modal context and full totals
survive25-row pages. Public counter/drilldown now uses the same organisation-aware
visibility predicate. Profile inventory is not labelled complete profiles.

Existing Nuxt UI/Lucide/admin tokens/flat bands reused; no full admin redesign or BI
dependency. Actual SQL and browser tests compare drilldowns with aggregates, half-open
bounds, duplicates/correction, revoked assignee/actor, withheld company, private projection,
error/retry and six widths. Screenshot320/1440 inspected; counter touch targets44px added.
First browser pass exposed400 on the new public filter: strict HTTP schema omitted it.
Fixed and strengthened test to assert HTTP200/full matching total, not checkbox alone.
Initial SQL fixture used nonexistent SUSPENDED enum; fixed to actual DRAFT, no production
enum expansion. New0009 is two created-time indexes only, applied on disposablePG56381;
current interactive review DB remains0008 (index-only compatibility), not shared/Neon.

PASS176 unit/88 SQL/25 tooling, typecheck/lint zero warnings, final Node build/HTTP smoke,
full28 DB/browser/HTTP. Full public run18/19: relocation input disappeared before result;
unchanged focused relocation rerun10/10 PASS. This intermittent failure is NOT hidden or
called a full public pass. Next focused E02/E03 hydration investigation/fix before claiming
that suite green or K1, then F04 telemetry/recovery and remaining E/G work. docs30 defines
metrics; docs31 provides operator/support/privacy/content steps. Human owner/deputy/channel,
real outreach/retention/approval and non-author acceptance are G05/H04 gates, not assigned
by this runbook. No dependencies/provider/main/deploy/shared migration/outreach changes.

### Append-only Application History Recovery (B04/B09 follow-up local code)

#50 both CI jobs SUCCESS (`40501413307`); only integration FF to2a3d199. Focused recovery
adds CORRECTED/REOPENED enum values0008, no old row/history/snapshot backfill or deletion.
Current ADMIN may append a fixed-reason correction to a contact/handoff/follow-up/closure
entry of this application, with a required private reason, current revision, command UUID
and actual actor. Original event data/actor/time stay byte-for-byte unchanged in SQL tests.
Active handling returns to human review; closed/withdrawn/rejected records do not reopen
by correction. Another explicit command reopens eligible closure and assigns the actor,
without changing employer status or immutable submission.

Withdrawn/rejected and any ever-recorded CANDIDATE_REQUEST closure cannot be reopened or
shared without a separate renewed-permission policy. A correction alone is not that proof;
server eligibility checks all history, even outside latest50. Ever-recorded SHARED still
blocks another package/handoff and warns about possible external copies. No recall/send/
new consent is fabricated. Candidate history selects only fixed public fields and marks
corrected older-page events via a scoped EXISTS, never operator note/reference/actor.

Recovery reuses existing Nuxt UI/Lucide/current modal, not an admin redesign. Private
draft survives network failure and retry reuses UUID; account/application changes clear
drafts and late responses cannot mutate a new context.15s client timeout and5s lock/15s
statement limits are explicit. Role-revoked UI disables commands. Close/reopen resets the
next action to current-stage work, not an accidental default re-close. Local review was
restarted on a new fictional cluster including0008; old cluster retained, testPG56381 separate.

PASS173 unit/85 SQL/25 tooling, typecheck/lint zero warnings, Node build/HTTP smoke,
full19 public +26 DB browser/HTTP tests. Focused recovery path3 also passed before the
final role-revocation/contrast refinements, which are included in the full26 pass. Tests
cover immutable original/snapshot/status, replay/concurrency/withdrawal, forbidden targets,
revoked actor, candidate-request closure outside latest50, lost committed response/retry,
candidate-safe journal and320/390/1440 screenshots. SQL EXISTS initially inferred unknown;
the actual boolean SQL expression now has its explicit result type, not an any cast.
Screens inspected320/390/1440; low-contrast warning text changed to existing muted token.

No dependency/provider/main/deploy/shared migration or real candidate contact. Rollback
must not expose pre-correction readers after real correction events (docs29), delete enum
values or erase audit history. No owner/native/independent-R acceptance claim. Next AUTO:
operational metrics/dashboard/runbook (F01-F04), then remaining E/G and K1 acceptance work.

### Basic Telegram Entry Bot (I01 local code)

#49 both CI jobs SUCCESS (`40498893290`); only integration FF to9e53485. I01 adds a
default-off Nitro webhook for private `/start`, `/jobs`, `/applications`, `/help`, `/privacy`
and fixed unknown-text guidance. Inline Web App buttons open the same existing routes;
Privacy is a normal notice link. No private application/profile reply, chat support inbox,
Pre-ICO flow, permission prompt, proactive sends, polling daemon, queue or new SDK.

Official Telegram JSON webhook reply is the transport. It cannot report actual delivery;
atomic bot/update receipt precedes prepared reply, duplicates only acknowledge. A crash/
lost response after commit may lose that reply; repeating the command as a new update is
the recovery. No exactly-once/delivered/read claim. Receipt0007 stores only bot/update/time,
not names/chat IDs/text/profiles/tokens; migration only on disposablePG56381. No existing
tables altered by0007. Retention/abuse/support/privacy/provider policy remains G/H.

Separate32+ webhook secret checked before body/DB;64KiB uncompressed fatal-UTF8 JSON,
safe IDs, private sender/chat match, no bot/group/edited/channel actions, current config
gates and safe503 errors. No username/update creates a session. DB concurrent claims5->1,
changed duplicate target has no second reply. Body utility now uses purpose-neutral JSON
size copy. Local review/public/smoke deliberately clear bot-entry env; real credentials
are neither loaded by tests nor included in their artifacts.

PASS172 unit/80 SQL/25 tooling, typecheck/lint zero warnings, Node build/HTTP smoke,
full19 public +25 DB browser/HTTP tests and final focused bot HTTP PASS. First compiled
test correctly found config503: Nitro `destr` converts numeric env ID into a number;
parser now accepts only safe integer number or validated decimal string and normalizes
to string (not coercing booleans/floats). Unit+compiled regressions pass. Vercel adapter
PASS:72 routes,1 actual bundle,nodejs22.x, required webhook route/output guard included;
Node output restored and smoke passed again. Test-token/name scans of Node/Vercel bundles
found no fixture secrets. No dependency/install/secret/provider/deploy change.

docs28 contains current official references and connection/menu/commands/rollback steps;
no live webhook/menu/send was configured. No native-bot/provider/independent-R acceptance.
Next AUTO: B04/B09 correction/reopen, remaining E/F/G; D04/D06 and H need real approvals.

### Candidate Relocation Outcome (D05 local code)

#48 both CI jobs SUCCESS (`40494621854`); only integration FF to25e7571. D05 keeps the
existing side calculator/dialog, Nuxt UI/Lucide/tokens, one host tree and server math.
Stable11-city scenario keys are distinct from current calculation IDs; missing data is
visible without fake prices or requests. Public details contain actual modeled monthly/
moving groups, sources/access/effective/review/validUntil and assumptions, not reviewer/
approval reference/import actor. Demo never invents source review or category details.

Currency change clears income, same-currency scenarios retain it. Mismatched/late results
are hidden while inputs change; Nuxt's installed request cancellation/deduplication is
reused. Error/retry preserves inputs, reviewed->demo downgrade clears old values, zero/
shortfall stays signed. Financial drafts live in memory per vacancy and reset on account
change; no financial route/localStorage history. Dialog owns its context/header rather
than repeating a nested framed tool/title. Back/close returns to the same job/search.

PASS159 unit/78 SQL/24 tooling, Nuxt+CLI typecheck/lint (zero warnings), Node build/HTTP
smoke. Full19 public +23 DB browser PASS before the final presentation-only refinements;
final focused2 public +3 DB browser PASS covers flat dialog/header geometry, all six
widths, sources/long strings, stale downgrade and sign-out privacy reset. Initial new
tests wrongly expected Apply for demo/guest; corrected to actual Preview only/sign-in
contract. Screenshot inspection found a real long-header close overlap/flex shrink issue:
fixed reserved close width/shrink-0/min-h-0, added geometry assertions. Mid-animation
translucent capture was replaced with animation-disabled screenshot, not accepted as QA.
Tooling first hit sandbox listen EPERM; rerun with local-listener permission24 PASS.

Active Figma read succeeded; draft write failed at createPage with read-only mode before
any mutation (docs27). No Figma sync/new freeze or independent R is claimed. Local working
prototype/screenshots are the allowed E01 fallback. No dependencies/schema/shared data/
production change. Final review server remains local3132/chooser3133 with fictional data.

Owner confirmed on27Oct no pre-approved career pages/boards; clarify with CEO before
real ingestion. Registry stays empty/cron off. Next AUTO: basic bot I01, remaining E/F/G
and B04/B09 correction/reopen. D04/D06/H still need actual data/provider/policy acceptance.

### Bounded relocation package ingestion (D03 local code)

#47 both CI jobs SUCCESS (`40490577409`); only integration FF to3587cf8. The same schema
now drives a privileged engineer CLI and transaction service, not a second importer or
new HTTP/admin platform. Whole-file1MiB regular UTF-8 JSON bounds, no dotenv, default
read-only preview, exact revision/current-admin role, bounded serialized atomic apply,
stable IDs/notes, no delete-absent and unchanged replay without timestamp reset.

Additive0006 snapshot/import time/actor is local-only. Legacy relocation50 kept its
ID/status/note; all new fields null, no backfilled approval. Exact fixture removed after
verification. Public reviewed data now also needs a valid current PILOT snapshot matching
the calculation columns. Numeric drift, legacy/synthetic/expired/stale metadata cannot
stay VERIFIED. Changed approved content requires a new review reference or later instant;
equivalent timezone spelling/validity-only edits are not new review. Explicit limitations,
rollback policy and cloud-target gate are in docs26. No shared/Neon execution was enabled.

156 unit/78 SQL/24 tooling/typecheck (Nuxt plus standalone CLI)/lint/Node build PASS.
Frozen/offline install/prepare PASS; TSX4.22.4 is an explicit dev dep already in the old
lock graph, no downloaded package/runtime change. Audit still3 known tooling entries.
Real CLI processes: validation-only no DB; preview no writes; apply created synthetic
DRAFT59; old-revision retry returned same ID UNCHANGED; exact row/actor3389 removed.
Actual PG trigger failure on city2 proves city1 rollback; first assertion needed the
Drizzle wrapped PG cause, not its outer query error. No assertions removed.

Full21 DB browser and17 public/HTTP smoke PASS before the final CLI-only future-instant
guard; final Node build/CLI types/unit cover that guard. Browser fixture first needed
Node22 JSON import attributes, then explicit UTC midnight (bare SQL date used local+03
and correctly failed snapshot equality). Fixed fixture, not the guard; focused and full21
reruns PASS. User review3132/3133 restarted on its own new fictional cluster after0006,
not test DB56381. No real rates/quotes, candidate handoff, deploy or independent R claim.

Next AUTO: D05 source/assumption/outcome UX, remaining E/F/G/I and B04/B09 correction/reopen.
D04/D06/H need subject-matter/source/provider/owner acceptance; initial CLI refuses every
cloud/shared URL until the exact verified target adapter can be bound at that gate.

### Relocation dataset/math boundary (D01/D02)

#46 both CI jobs SUCCESS (`40488246587`); only integration FF to9e3f8f1. Added a strict
version1 package with fixed11-city coverage, major-unit/period/basis-point declarations,
tax/housing/move assumptions, evidence groups, dated review/reference/explicit validity
and MISSING/DRAFT/VERIFIED/STALE coverage. Example is fictional DRAFT only, not actual
London tax/cost data. No implicit Amsterdam addition to the approved pilot: historical
demo remains documented separately. Current SQL still needs D03 package metadata/import.

Runtime checks complete cost/tax/source/review-date structure instead of trusting only
VERIFIED. Invalid/future/unreviewed/unknown-currency records cannot reach the public
calculation. Narrow SQL projection excludes unused notes. Progressive thresholds and
terminal bracket/rates/allowance, supported income bounds, zero/negative/rounding and
unsafe sources are tested. Unknown income/destination no longer silently becomes
London/110000: API requires both and standalone UI starts blank. Explicit zero shows
negative budget; MONTH annualization and currency/HOUR non-assumptions are retained.

PASS151 unit/73 SQL, full21 DB browser (real malformed/future/null-review/currency rows,
missing/invalid amount, mobile zero and existing flows) and public17 (desktop blank->zero
and inspected negative-budget screenshot), lint zero warnings/typecheck/Node build/smoke.
Final projection has additional focused SQL and compiled-HTTP browser PASS; final Node
build/types/smoke PASS, exact-head adapter checks run in PR CI. No migration/dependency change, actual rates/quotes, shared data, booking, tax/legal
approval or independent R. Full new assumptions/validUntil are not retroactively attached
to legacy SQL rows: D03 must persist/review them before a real dataset release. docs26
records limits including the nominal2M income ceiling across different currencies.

Next AUTO: D03 bounded validated dataset import/review, D05 outcome/source/assumption UI,
remaining E/F/G/I and B04/B09. D04/D06/H remain real data/provider/owner gates; no city-list
question is reopened. Strong independent R still follows K1, not this same-session check.

### Vacancy source/publication/review facts (C04)

#45 both CI jobs SUCCESS (`40484620328`); only integration FF to949c682. C04 adds nullable
provenance columns via0005, with no legacy inference/backfill. A synthetic pre-migration
published record/application survived locally (vacancy3855/application1181, old2025-07-01
ordering date/note retained, all six new fields null); removed this exact fixture after
verification so it cannot contaminate queue-count tests. No shared DB was migrated.

Source publication, trusted snapshot fetch, committed import, current TalentBay publication
and current-admin content check are distinct. Unchanged imports advance observations only,
without invalidating held content/review revisions. Changed content/company siblings clear
review/publication, archives stay archived, application IDs survive. Failed fetches cannot
refresh dates. Recheck stamps human review without a new publication; source/permission
truth is still human-owned, not established by HTTP200. Public DTO has dates, not reviewer
identity. Unknown legacy dates are null, not1970/Today. Exact policy/rollback is in docs25.

PASS:142 unit/73 disposable-PG SQL/typecheck/lint (zero warnings), Node build/HTTP smoke,
full20 DB browser + final focused4 (recheck and mobile bottom geometry), public16. The first
SQL run found the intentionally retained migration application in a global count; cleaned
only that fixture, not the test assertion. Unit UTC test exposed a locale12h default;
set explicit h23. Screens320/390/1440 and scrolled bottom320 inspected. The fixed Apply bar
does not conceal the final dates after scrolling (asserted geometry, not just full-page PNG).
New-schema local review restarted3132/3133 on its own fictional DB, retaining the old cluster.
No live source/provider call, actual candidate sharing, independent R or main/deploy claim.

Next AUTO: D01/D02 relocation contract/math/validation, then D03/D05 and remaining E/F/G/I,
plus B04/B09 correction/reopen. D04/D06/H need real approved data/providers/operations; R
remains independent after K1. GitHub Projects scope still unavailable; this queue is fallback.

### Complete bounded admin registries (C03)

#44 both CI jobs SUCCESS (`40481614950`); integration FF to995b36d, not main/production.
C03 replaces both100-row caps with25-default/50-max cursor pages, full filtered counts,
microsecond timestamp/ID ties, search and strict scope/filter binding. Users retain only
the old account projection, not profiles/contacts/sessions. Queues use account-scoped
resources; every admin response, including denials, is no-store. Existing application
queue is reused, not redesigned. Review selection lives in the URL and preserves its
page/filter/hash on reload/close; changing filters resets the cursor/selection.

Local139 unit/67 SQL/typecheck/lint/Node build and HTTP smoke PASS. Real111-user/111-vacancy tests cover
all pages, last page, current role, search, malformed input, selected review and reload.
The initial browser test caught lost hash on close; fixed without weakening URL assertion.
Its dashboard step then exposed dynamic resolveComponent('NuxtLink') rendering non-links:
explicit component import fixes all metric links; Applications now targets its existing
inbox. Focused2 and final full20 browser regression PASS. Narrow/wide registry
screens inspected; local horizontal table scrolling is keyboard-accessible and tested.
No schema/dependency change, shared data write, permissions change or deployment.

Next AUTO: C04 source dates/freshness/maintenance -> D relocation -> remaining E/F/G/I,
plus B04/B09 event correction/reopen follow-up. R and H remain separate acceptance gates.

### Full public vacancy pagination (C02)

#43 both CI jobs SUCCESS (`40478884987`); integration FF to `e492f8f`, no main/production.
C02 replaces the public hard cap with bounded cursor pages and stable date/ID ordering,
explicit NULL placement/microsecond-safe SQL keys, same-snapshot count and strict filter/
limit binding. Salary sort now needs a single explicit currency/period, not mixed units.
Jobs URL, results anchor, restart and detail/back/scroll preserve context; demo follows
the same contract. API compatibility/limitations/index evidence are in docs02.

Local PASS:137 unit/64 SQL, types/lint, Node build/smoke, full18 DB browser tests, focused
C02 and final broad public16 reruns after grid fix. The first SQL fixture was
incorrectly a default DRAFT company; corrected fixture to ACTIVE without relaxing visibility.
The first full browser run found real320px long-title overflow; fixed mobile grid track/
min-width, not the overflow assertion. Narrow/wide screenshots inspected. EXPLAIN test
asserts a51-row bounded query on111 fixtures (Limit/Sort/Nested Loop/Index Scan/Seq Scan,
0.262ms observed in one focused local measurement, not an SLO); no production benchmark,
new index migration, shared data change or external search engine.

Next AUTO queue: C03 complete admin queues -> remaining C04 source/date maintenance -> D
relocation data/math/import -> remaining E/F/G/I tasks by dependencies. B04/B09 event
correction/reopen remains explicit follow-up. C06/C07 have synthetic code acceptance, not
real source approval/activated cron; H data/provider/hosting/operations gates and R remain.

### Source runner / operator entry (C07) in verification

Branch `codex/source-runner`, base `84d2fed` / [#42](https://github.com/talentbay/talentbay/pull/42).
Both #42 CI jobs SUCCESS (`40476668204`); only integration FF to84d2fed. C06 synthetic
adapter is complete, real source approval remains open. C07 adds default-empty approved
registry, current-admin same-origin bounded commands and a small Sources operator screen.
Additive migration0004 checkpoint is applied only on disposablePG56381. Fetch I/O holds
no DB lock; snapshot/batch/checkpoint/preview/replay/backoff/publication behavior is in docs25.
Existing importer now exposes its transaction body so batch + cursor commit atomically;
CSV wrapper/security/publication behavior are retained, not replaced by a second importer.

Current local PASS: 135 unit, 59 SQL, 24 tooling, types/lint, Node build/smoke, full16 DB
browser tests. Real route tests cover empty registry/role/origin/strict bounds. Active-source
UI test uses explicit fictional intercepted responses; real runner SQL tests inject fetch.
Screens inspected320/1440; selector now gets a full narrow row. Final focused browser rerun
PASS after that and the recovery UI fix: a confirmed saved checkpoint no longer shows a
contradictory unconfirmed-operation alert. Final Node build/types/lint PASS; public16 PASS
before that focused recovery fix. Vercel adapter/assert PASS on core runner (71 routes,
Node22, one function); exact-head adapter/browser regression is also required by PR CI.
No live source call, scheduled run, shared migration, main release or deploy. Schedule
preparation is documented, not called activated automatic collection. C02/C03 pagination,
remaining C04 metadata/maintenance acceptance, relocation/bot and B04/B09 follow-up remain.

### First source adapter (C01/C06) in verification

Branch `codex/lever-source-adapter`, baseline `f4dfe62` / [#41](https://github.com/talentbay/talentbay/pull/41).
#41 both CI jobs SUCCESS (`40474296486`); integration only fast-forwarded to that head.
Selected Lever's documented JSON/pagination API for the first connector. C01 evidence,
alternatives/rights register and normalizer/runner boundary are in docs25. The supplied
ai-job-search URL redirects to ai-job-search-dev; at `eb0fcd71...`, `job_scraper` has only
`.gitkeep` (verified via GitHub API), not a ready ingestion engine. No external code run.

Server-only adapter uses fixed HTTPS provider roots, bounded pages/bytes/deadlines,
strict schema and source IDs, explicit mapping/no inferred country/workplace/visa/pay units,
safe real-library HTML-to-text conversion and sanitized report/error codes. No importer,
public API route, live credential/source or schedule is activated. C07 runner is still next;
real board/rights selection was asked asynchronously, not a reason to stop fixture work.

html-to-text10.0.1 + types9.0.4 are compatible with locked Node22 and tested against the real
parser. Frozen/offline install, typecheck/lint, 133 unit, 52 disposable-PG, 16 public browser,
14 DB browser tests, Node build and compiled HTTP smoke PASS. The first offline install
needed an authorized rerun for pnpm's external local-store symlink (sandbox EPERM), not a
lockfile change. Fresh audit remains 3 known tooling entries, no new advisory. SQL source
-> dry-run -> draft -> human review -> unchanged/changed re-import retained the application.
No live source call, shared migration, main/production operation or independent review.

### First-time Apply / profile continuity

Branch `codex/application-profile-preflight`, base `1717a26`. #40 both CI jobs SUCCESS
(`40473015779`); only integration advances. Reused the existing ProfileEditor inline:
closing/saving it returns to the same vacancy's Apply, keeping the cover note in memory
and requiring fresh acknowledgment after profile edits. No new wizard, global draft
storage, CV upload or Telegram-only route. Successful OAuth completion resumes Apply;
real callback/provider acceptance is still K2. Actual expired-session POST401 refreshes
the session, clears the private draft and shows sign-in on the original role.

Typecheck/lint/Node build and two focused DB-browser paths PASS: first-time no-contact ->
profile PUT fails/retry -> return with note -> Apply, and real session deletion ->401 ->
same-role sign-in with cleared private note. Full 14 DB-browser regression and HTTP smoke
PASS. Server/schema unchanged; previous SQL51 evidence belongs to
the handling baseline, not a new migration in this slice.

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
