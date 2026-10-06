# MVP Execution Log

Updated: 2026-10-06
Active decision: `docs/adr/0006-mvp-first-vercel-neon.md`.
Work branch: `feat/mvp-vercel-baseline`; PR: https://github.com/talentbay/talentbay/pull/25
Security branch: `codex/oauth-state-security`; PR: https://github.com/talentbay/talentbay/pull/26

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
| M2.2–M2.5 unified auth | Not implemented | Schema/identities, Telegram validation, linking and provider verification |
| M3 Candidate UI | Not started | Frozen design is the implementation contract |
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
