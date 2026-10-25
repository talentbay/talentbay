# MVP Execution Log

Updated: 2026-10-26
Active decision: `docs/adr/0006-mvp-first-vercel-neon.md`.
Work branch: `feat/mvp-vercel-baseline`; PR: https://github.com/talentbay/talentbay/pull/25
Security branch: `codex/oauth-state-security`; PR: https://github.com/talentbay/talentbay/pull/26

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
| M3 Candidate UI | Implemented in current Candidate branch | Local browser/API/PG checks above; native host/provider acceptance pending |
| M4 fixed-template content import | Planned | Focused flow review, validation/dry-run and publication safety |

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
