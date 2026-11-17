## Summary

<!-- Keep this focused; explain what changed and why. -->

- Change:
- Risk and rollback:
- Updated existing docs:

## Verification

<!-- Record actual results or a reason not run. Do not mark planned checks as passed.
     Build before smoke/browser tests; database checks require disposable isolated PG. -->

| Check | Actual result / reason not run |
| --- | --- |
| `pnpm typecheck` | |
| `pnpm lint` | |
| `pnpm test` | |
| `pnpm test:integration` | |
| `pnpm build` | |
| `pnpm test:smoke` | |
| `pnpm test:e2e` | |
| `pnpm exec playwright test --config playwright.database.config.ts` (marked isolated PG only) | |
| CI for this head / relevant manual checks | |

## Checklist

<!-- Use N/A with a reason for an inapplicable item; leave incomplete gates unchecked. -->

- [ ] Correct base: topic PR -> `codex/mvp-integration` before release; topic PR -> `main` after release. The pre-release integration -> main PR remains draft until release gates pass.
- [ ] Scope is focused; existing docs and the execution log reflect actual changes, checks and blockers.
- [ ] Server auth, identity-linking proof and permission/review-gated factual content remain intact; no secrets, real credentials or personal data enter fixtures or artifacts.
- [ ] DB checks use synthetic data on verified disposable PostgreSQL only; no shared DB access or real credentials in PR workflows, no guard bypass or build-hook migrations.
- [ ] Superseded PR closure, if applicable, has verified ancestry and preserved changes plus a replacement link; no force-push or branch deletion.
- [ ] For a main release: explicit owner release confirmation, passing actual CI and DB/env/provider/privacy/content gates are recorded. Main merge may trigger Vercel production; no unapproved paid/domain/provider/shared-DB mutation.

## Delivery State

<!-- Give evidence or pending/not-run separately; do not infer deployment from merge or live verification from deployment. -->

Code ready: ; Tests passed: ; Merged: ; Deployed: ; Live verified:

See [contributing](../CONTRIBUTING.md), [workflow](../docs/06-infrastructure-and-process.md),
[execution log](../docs/14-mvp-execution.md) and [deployment runbook](../docs/11-deployment-runbook.md).
