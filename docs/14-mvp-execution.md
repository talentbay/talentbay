# MVP Execution Log

Updated: 2026-10-06
Active decision: `docs/adr/0006-mvp-first-vercel-neon.md`.

## Evidence baseline

- GitHub main inspected at `2aca646f2c1ad0b5e59c375a30598a0f47da060a`.
- Candidate v1 freeze and active source/component/breakpoint contracts are in
  `docs/10-design-direction.md`; this pass does not change Figma.
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
- The existing GitHub workflow runs typecheck, lint, unit tests, Node build and local
  production-output smoke. Integration tests exist but are not yet in baseline CI.

## Current work

| Task | Implementation | Verification / remaining work |
| --- | --- | --- |
| M1.1 MVP-first docs | Prepared in this branch | Review/merge pending |
| Cloudflare deferral | PR #24 converted to draft | Branch preserved, production unchanged |
| M1.2 isolated PostgreSQL CI | In progress | Run committed migrations and existing service workflows on the runner |
| M1.3 access audit | Partial, findings above | Resolve Vercel project and Neon project/branch access |
| M1.4 preview/release automation | Blocked externally | Correct team/project access and plan approval; do not buy/transfer automatically |
| M2 unified auth | Not started | Begin after baseline tests; no provider secrets needed for unit tests |
| M3 Candidate UI | Not started | Frozen design is the implementation contract |
| M4 fixed-template content import | Planned | Focused flow review, validation/dry-run and publication safety |

## Next runnable task

Finish disposable PostgreSQL CI and verify the existing workflow suite from a PR. Do not
wait for hosting billing to implement/test auth and Candidate UI. Do not report preview
or production ready until the actual deployment and provider journeys have been checked.

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
