# MVP Execution Log

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
- The connected Vercel team context reports Hobby and no linked TalentBay Git project.
  A direct settings read of the historical TalentBay project ID in that team returned
  404; project ownership/settings access is not yet verified. Deployment visibility is
  not equivalent to permission to configure the project.
- Historical runbooks describe Neon production/preview/integration branches. Their current
  IDs, access and state have not been independently reverified in this pass. No Neon data
  was read, seeded or migrated.

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

Then implement a backward-compatible local identity model, server-side Telegram initData
validation and explicit linking. Use disposable database tests for schema/identity work.
Do not wait for hosting billing to implement/test independent code, and do not report auth
complete until the real provider/browser/WebView journeys pass on a stable preview origin.

## External launch gates

1. Confirm the intended Vercel team/project access and an eligible plan. Current connected
   scope is Hobby; no billing/trial changes are authorized by this work.
2. Resolve Neon project and branch IDs using authorized project access before migrations.
3. Configure real OAuth callbacks and Telegram bot credentials/menu in provider secret
   stores; do not paste credentials in issues, PRs, logs or chat.
4. Confirm final domain ownership, approved terms/privacy and permitted vacancy data.
5. Identify production promotion/rollback owner and approve release explicitly.

## Reporting format

For every milestone record: task ID; changed files/PR; checks actually run and outcome;
merge status; deployment status; next runnable task; exact external blocker if present.
A failed check is fixed or documented, not removed. Do not label a phase complete while
its release criteria remain unverified.
