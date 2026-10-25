# Candidate Browser Verification

## Hydration follow-up — 2026-10-26

A real dev-server check caught Node/Chromium ICU compact-currency default differences
(`£95.0K` versus `£95K`). The formatter now explicitly sets minimum 0 / maximum 1 fraction
digits. Exact-format unit coverage and console hydration-warning capture complement the
earlier pageerror-only browser checks. Dev 390/1440 and compiled public viewport journeys
passed after repair. No SSR disablement, blanket suppression or custom money parser.

The shared Candidate shell serves the same `/jobs`, `/jobs/:slug`, `/saved`, `/profile`,
`/applications` and `/settings` routes in browsers and Telegram. Wide composition begins
at 1024px. Private Candidate routes are client-rendered; public vacancies remain SSR.

## Implemented contracts

- URL-backed search and staged filters; no fabricated recommended ranking or comparison
  of raw salaries in different currencies/periods. The current list shows at most 50
  newest matches with an explicit limit notice; full pagination remains follow-up work.
- Saved is browser-local, not account sync. Bulk resolution enforces public visibility.
  Read errors preserve IDs; removal supports Undo; storage quota failures retain RAM state.
  Existing valid saves are not evicted to enforce the 200-new-save limit.
- Profile edits cover the eight existing backend fields. Completeness is guidance only.
  A failed save retains its in-memory draft; private resources are cleared on account change.
  No synthetic provider email, job history, skills editor or profile snapshot is invented.
- Apply is single-flight with database uniqueness, current ownership and same-origin writes.
  Demo vacancies cannot receive applications. Current statuses are not a status timeline.
- Connected methods use explicit proof-based linking, not email or username matching.
  Unconfigured providers have no active sign-in button. Appearance and job defaults work;
  notification delivery, account deletion/export and locale controls are not fake toggles.
- Relocation preserves vacancy context and inputs. Monthly salary is annualized; hourly
  work and currency mismatches require explicit input. Destinations use stable record keys;
  legacy ambiguous city-only links are rejected. Invalid inputs return 400, not default math.
- Telegram uses a feature-detected host adapter, raw server-validated initData, optional
  back/settings/haptics, theme and system-plus-content safe areas. `job_<slug>` start
  parameters navigate to the same public vacancy route after validation. No initDataUnsafe.

## Local commands

First install the locked packages, prepare Nuxt and build using the intended local env.
Do not accidentally reuse developer or production DB credentials for automated tests.

```bash
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

For database browser tests, create a disposable local PostgreSQL database and role named
`talentbay_ci`, export both runtime and migration URLs pointing to it, set `CI=true` and
`TALENTBAY_TEST_DATABASE=disposable`, then run:

```bash
node scripts/assert-ci-database.mjs
pnpm db:migrate
pnpm exec playwright test --config playwright.database.config.ts
```

The config executes the target guard before any fixture writes. It supplies a fake local
bot credential and normal signed initData; there is no production test-login backdoor.
The real HTTP boundary, sealed session, Drizzle and PostgreSQL remain in the loop.
GitHub Actions supplies a disposable Postgres service; it needs no provider secrets.

Artifacts are gitignored under separate `test-results/public` and `test-results/database`
directories, so parallel runs cannot delete each other's traces. Fixtures are synthetic.

## Evidence and remaining gates

Exact commands/results and the reviewed commit belong in `docs/14-mvp-execution.md`.
Screenshots cover the six target widths; successful layout checks are not an accessibility
certification. Figma mobile contexts are the starting point; the implementation unifies
the inconsistent desktop/mobile primary colors and uses unframed profile/settings sections.
The user explicitly authorized project design changes on 2026-10-26. Figma itself has not
yet been rewritten to claim a new approved freeze.

Chromium host simulation verifies integration, not native Telegram. Real Google/GitHub
callbacks, mobile Safari/WebView behavior, provider entitlement, domain/bot configuration,
approved content/legal copy and release verification remain required before public beta.
No passing build or local browser test means merged, deployed or live-provider verified.
