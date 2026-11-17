# AGENTS.md

## Repository purpose

TalentBay is one responsive Nuxt product for desktop web, mobile web and Telegram Mini App.
The active MVP runtime is Node on Vercel with PostgreSQL in Neon. Cloudflare/Hyperdrive is
optional post-MVP work, not the next implementation phase.

## Read before changing code

1. `docs/14-mvp-execution.md` — verified progress, blockers and next runnable task.
2. `docs/plan.md` — current product/architecture decision.
3. `docs/roadmap.md` — dependency order and exit criteria.
4. `docs/09-current-state.md`, `docs/02-architecture.md` and the deployment runbook —
   existing implementation and historical environment evidence (respect their dates).
5. `docs/10-design-direction.md` and the active Figma handoff.
6. Relevant ADRs, especially `0006-mvp-first-vercel-neon.md`.

When docs disagree, distinguish planned from implemented and verify live code/environment.
Do not treat the deferred Cloudflare PR/ADR as the current launch decision.

## Product architecture

- Keep one frontend and one repository. No separate Telegram routes/component tree.
- Share domain logic/components; responsive wide composition starts at lg / 1024px.
- Relocation preserves vacancy context and back state; the handoff does not mandate
  a new top-level route.
- Put Telegram APIs in a feature-detected host adapter with browser fallbacks.
- Prefer a modular monolith. Do not add microservices, monorepo moves, D1 or ClickHouse
  without a demonstrated requirement and an explicit decision.
- Keep PostgreSQL/Drizzle migrations; never migrate shared databases from a build hook.
- Validate Telegram initData on the server; never authenticate using initDataUnsafe.
- Provider identities resolve to permanent local users. Explicit account linking requires
  proof of both accounts/identities, not a supplied matching email or username.

## Design contract

Candidate Design v1.0 is the reference baseline. The owner explicitly authorized project
design iteration on 2026-10-26. Record implementation deviations in
`docs/17-candidate-verification.md`; do not call them a new approved Figma freeze.
Active references:

- `30 Product · Candidate · Responsive`;
- `99 Utilities → TalentBay · Candidate Handoff · v1.0`;
- Core and Candidate shared component libraries.

Do not use archived pages as competing product specs. Preserve state ownership and
backend gaps: local Saved is not account sync; notification opt-in is not delivery;
current application status is not a timestamped timeline. Use Nuxt UI/Lucide and existing
tokens before introducing new primitives.

Full admin redesign remains behind its Phase 6 design gate. Phase 4 may implement the
small fixed-template file-import workflow after its focused design review; do not revive
archived admin screens or expand it into a new content platform.

## Content and authorization

- Bulk ingestion is the primary operator workflow; manual editing is for corrections.
- Validate and dry-run imports; keep bounded batches and source-based idempotency.
- New/changed imported content must not become public without review and publishing.
- Do not delete application-linked records merely to simplify imports.
- Server authorization is the security boundary; client guards are UX only.

## Change and test discipline

Use small, coherent branches/PRs. Do not mix a mechanical repository move with product
changes. Keep schema changes, migrations and tests together. Do not remove tests to pass CI.

During pre-release consolidation, `codex/mvp-integration` is the single review line to main.
Old cumulative topic PRs are preserved history, not separate squash/merge steps. Before
closing one as superseded, verify its exact head is retained in the published integration
branch and link the replacement review. Do not delete its source branch or rewrite history.
See `docs/06-infrastructure-and-process.md`; a main merge may trigger the owner's Vercel
deployment and requires a separate release decision, not just repository-cleanup permission.

Run the applicable checks:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:smoke
```

Use disposable PostgreSQL in GitHub Actions for integration tests and migrations. For
manual Neon integration runs, resolve and verify the isolated branch before writing.
Never point automated tests at production or use production credentials in PR workflows.

Report code ready, tests passed, merged, deployed and live verified separately. Update the execution log with
actual commands/results, commit/PR and remaining blockers; do not record planned checks as
passed. Cloudflare build success does not prove a running deployment or DB connection.

## External operations and secrets

- No secrets, bot tokens, session passwords or connection strings in Git, chat or artifacts.
- Do not start paid plans/trials or change billing without explicit approval.
- Do not switch production, transfer projects, move domains, rotate secrets or migrate
  shared databases without explicit approval and a rollback plan.
- Keep existing deployment protection and API security controls intact.
- A provider-access blocker is not a reason to stop independent code/test work.

## Delivery sequence

1. Reconcile the MVP plan and isolate baseline database tests.
2. Patch OAuth security before expanding authentication.
3. Protect re-import publication invariants in a separate focused change, not an admin redesign.
4. Implement backward-compatible identities, Telegram auth and explicit linking.
5. Build frozen responsive Candidate v1 and its host adapter.
6. Add minimal validated file import and approved real content.
7. Verify and release after provider, data and user-approval gates.
8. Expand admin/services only after the MVP.
