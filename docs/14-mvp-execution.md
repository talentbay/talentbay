# MVP Execution Log

## PR25 conflict reconciliation — 2026-11-17

Main now includes PR24 as squash commit57b03a0. The earlier statements below that PR24
is unmerged describe the October checkpoint, not current main. This merge into the PR25
branch preserves both the existing Cloudflare build check and isolated PostgreSQL job.
Health combines no-store/liveness semantics with main's runtime/timestamp metadata;
compiled smoke now checks those fields. This does not activate a Worker deployment,
change the Vercel/Neon MVP decision or merge/release the later MVP stack.
Actual local verification on Node22.23.1/pnpm10.33.0 with no developer dotenv: frozen
install, Nuxt typecheck, lint,28unit tests,13CI database safety tests, Node build and
compiled HTTP smoke PASS. Cloudflare build PASS; migrations and2integration tests PASS
on a new local PostgreSQL18 cluster, stopped afterwards. Parsed YAML assertions preserve
both jobs and the disposable database guard. Independent read-only review of the four
resolution files reported no findings; it did not rerun these tests. No lockfile or
dependency version change. Source changes will update PR25 only, not merge into main;
GitHub CI and deployment results are separate from these local checks.

Updated: 2026-10-06
Active decision: `docs/adr/0006-mvp-first-vercel-neon.md`.
Work branch: `feat/mvp-vercel-baseline`; PR: https://github.com/talentbay/talentbay/pull/25

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
| M2.1 OAuth security | Confirmed dependency gap | Patch and regression tests next, before new auth capabilities |
| M2.2–M2.5 unified auth | Not implemented | Schema/identities, Telegram validation, linking and provider verification |
| M3 Candidate UI | Not started | Frozen design is the implementation contract |
| M4 fixed-template content import | Planned | Focused flow review, validation/dry-run and publication safety |

### Executor coordination

| Task | Executor | Branch / PR | Base SHA | Affected areas | Checks result | Next step |
| --- | --- | --- | --- | --- | --- | --- |
| Context reconciliation | Codex (sole editor; other chat reviews) | `feat/mvp-vercel-baseline` / #25 | main `2aca646f2c1ad0b5e59c375a30598a0f47da060a`; starting head `fea34354ccfe51358dedb277e32d86ba7dd3defe` | Existing docs/AGENTS only | Source/code/metadata reads; no new code checks claimed here | Separate M2.1 PR; stop for review |

Old `chore/sprint-1-cleanup` worktree and untracked Sonnet context remain untouched.
Cloudflare PR #24 remains draft at `4ab26daa2957a5eef2e023afc23b5e0f9b442a5f`.

Merge status: PR #25 is unmerged at the time of this entry. Deployment status: unchanged.
No new Vercel deployment, billing change, shared DB migration or production promotion.

## Next runnable task — M2.1

The frozen install log confirms `nuxt-auth-utils` 0.5.29. Maintainer release v0.5.30 states
that it fixes OAuth callback state validation / login CSRF:
https://github.com/atinux/nuxt-auth-utils/releases/tag/v0.5.30
https://github.com/atinux/nuxt-auth-utils/security/advisories/GHSA-xc49-mgwh-9pjv

Update to a confirmed patched release with a regenerated lockfile in a focused change;
review callback/state behavior and add regression coverage before enabling Telegram or
account linking. The current Google handler delegates OAuth handling to that dependency.
No auth patch or complete dependency audit is claimed in this baseline PR.

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
