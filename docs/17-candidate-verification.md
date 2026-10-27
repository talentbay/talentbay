# Candidate Browser Verification

## Focused source-operator entry - 2026-10-27

C07 adds only the source selection/progress/next-batch preview/confirmation surface beside
the existing CSV/review workflow, using current Nuxt UI/Lucide/tokens. No general admin
redesign, source-authoring CMS or competing Figma freeze. Registry is empty until approved
real sources exist. Focused engineering review inspected320/1440 screenshots; a compressed
source selector was changed to a full row below sm. Browser checks cover320/390/1440,
loading/empty/error/reload and lost-response recovery. The populated source UI uses
fictional intercepted responses; real runner transactions use separate offline-fetch SQL
tests. Neither test is evidence of a real live source or an owner-approved visual freeze.

## First-time application continuity - 2026-10-27

Apply reuses ProfileEditor on the same vacancy, with no navigation away or new multi-step
wizard. Saving/cancelling returns to Apply; its cover note stays in component memory only.
Editing the package resets acknowledgment; switching identity clears the draft/editor.
An expired server session is refreshed and sign-in is offered on the same role, with an
explicit privacy-driven draft reset. Focused real-API/DB browser tests cover save failure/
retry and expiry; actual provider-popup acceptance remains a hosted/native gate.

## Managed handling / progress deviation - 2026-10-27

Existing operator inbox/detail now have stage/mine filters, current-admin assignment,
bounded commands, private journal and snapshot package preview/copy. Preparing is not
sending; recording a completed manual handoff is a distinct acknowledged action.
Candidate detail exposes only allowlisted recorded facts and explains that manual records
are not employer delivery/read receipts. Candidate application/history keyset pages and a
per-vacancy ownership lookup avoid a hidden 25-record duplicate-check cap. Account switches
clear selected private detail. These are focused workflow additions, not the deferred
admin redesign or a new Figma freeze.

Synthetic browser tests exercise candidate -> operator -> company-contact/package ->
recorded handoff -> candidate progress -> withdrawal; one response is deliberately lost
after the DB commit and retry must produce one event. Runtime-error capture and explicit
transfer-control visibility were added after manual dev review caught a users-response
shape mismatch; relying only on the main happy-path assertions had missed that hidden field.
Narrow/wide screenshots are engineering checks, not owner acceptance or native Telegram QA.

## Managed Apply implementation deviation - 2026-10-27

The focused Apply modal now previews the submitted name/contact/profile, names the
company, and requires an initially unchecked versioned acknowledgment. A saved profile
and usable contact are required; professional links alone are not a contact. Missing
profile/read errors have profile/retry exits. The server stores a submission-time snapshot;
later profile edits do not change that package. No CV upload or legal-approval claim.
Operator detail distinguishes submitted profile from legacy current-only records. These
changes implement the docs22 state matrix under the owner design mandate; they are not a
new Figma freeze, a full admin redesign, or evidence of real employer delivery. Relocation
E01 and complete operator workflow are still separate tasks. Exact checks in execution log.

## Owner review and focused UI corrections - 2026-10-26

The owner could only inspect the no-DB guest preview: sign-in was unavailable and all
demo vacancies disallowed applications. That environment was inadequate for reviewing
the complete implemented journey. Telegram is not required for ordinary web browsing;
configured Google/GitHub providers serve web sign-in. Neither deployment nor Telegram
configuration supplies the missing employer-side application workflow.

The repeatable [local review](21-local-product-review.md) now exposes the existing real
API/SQL workflows with isolated fictional accounts and a visible test-data notice.
Manual browser verification covered profile edit/save, salary-dependent calculation,
application submission/read/reload, the empty newcomer profile, and CSV validate/import/
review/publish/public visibility. This does not verify live provider login or actual hiring.

Design deviations: shared Nuxt UI/Lucide bookmark control now uses the same bookmark
outline in navigation and a filled primary-color selected state, not bookmark-check.
Search/filter/back/settings/edit/remove icon controls have stable centered 44px targets.
Browser regressions check the saved path fill, stable dimensions and arrow centering.
No new UI library or approved Figma freeze was introduced. These are focused corrections,
not evidence that every screen or the overall product experience has been accepted.

The subsequent [small application-access slice](22-application-review-contract.md) adds
confirmed candidate withdrawal and read-only operator detail. VIEWED keeps its employer
meaning and is never written by opening an administrator record. These are current states,
not a timeline; no hiring outcome or external delivery is invented. Full admin design
remains deferred. The owner subsequently confirmed managed intake: TalentBay receives the
application and contacts the company. Preflight, success and NEW/detail copy now explain
that receiver and next step; they do not assert the employer has received or read anything.
Operator handling/share records remain a separate unimplemented slice, not a new Figma freeze.

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
