# Candidate Browser Verification

**Touch targets and keyboard (23 November).** In Jobs and Saved the title link
extends over the entire card except the bookmark. It is still one keyboard link,
followed by the separate save button. For touch forms the dialog tracks available
space, but an already-visible field requires no app-driven scrolling. After the
keyboard settles, a clipped field is revealed inside the dialog, with reduced
motion respected. These are changes to the implementation, not a new Figma freeze.

**Exact company filter (20 November).** Jobs → Filters → Company searches company
labels with published roles. Each suggestion shows the name and unique key to
distinguish employers with the same name. The applied filter survives reload and
paging, can be removed independently, and does not navigate to an employer profile.
This extends the existing Candidate v1 filter sheet, not the Figma baseline.

**Salary range in context (20 November).** The existing Candidate v1 estimate sheet
and desktop panel now name the annualized advertised range and the active salary
point. Manual amounts remain available. Moving costs are explicitly separate from the
monthly result; a relocation badge is not a monetary reimbursement commitment. This is
an implementation iteration, not a new Figma freeze or a reviewed city price dataset.

**Reviewing changed contact details.** The Apply dialog binds acknowledgment to the
displayed account, profile and vacancy. When the same candidate edits their contacts
in another tab, they can review the new details without retyping the note. A different
account starts an empty form. A failed profile read offers a retry, not a submission.
Only a submission response with a valid receipt ID can show the new-application success
message. This is the same Candidate v1 dialog in the web and Mini App layouts.

**Apply on an unavailable listing (20 November).** The existing Apply dialog keeps
a selectable cover note and a route to Jobs when the open application can no longer
be submitted. Closing the dialog alone does not copy the note to another listing.
A failed read after a changed listing leaves the original dialog open with consent
disabled. No persistent drafts or new screens were added.

**Website to Telegram (20 November).** On a guest vacancy, the Telegram action names
the selected role flow only when the configured entry bot can handle it. The browser
stays signed out. A private chat reply opens the same public vacancy version; profile
sharing still requires an explicit submission. A stale button reaches the existing
unavailable page with a way back to Jobs. On failed native login, recovery advice and
any safe support reference are also accessible inside the Apply dialog, not just in
the shell behind it. The 390px Apply screenshot checks the recovery text with the
theme's normal foreground on a warning background. This reuses the Candidate v1
controls; it is not device acceptance.

**Corrected operator history (20 November).** The candidate receipt distinguishes a
recorded handoff from a corrected record; neither confirms employer delivery. Paging
after a new correction refreshes the history. Open applications show the current
handling heading once, not a second badge from an earlier receipt read. This reuses
Candidate v1 components and does not change the approved design baseline.

**Receipt navigation (20 November).** From the vacancy, **View application** opens the
matching application directly, even if it is older than the first 25. Reload retains the
receipt; dismissing it returns to Applications. A link opened by a different signed-in
candidate shows an unavailable state, not the title or cover note. This reuses the
existing receipt dialog, not a separate Telegram flow or a new design freeze.

## Candidate pilot checks: 20 November 2026

Compared Jobs to the active Candidate responsive Figma handoff (frame `2077:739`).
The search and applied filters remain in the URL. On mobile the modal edits a draft;
on desktop the same controls are inline. Closing the modal returns keyboard focus.
The empty-catalogue state now leads to Profile; a no-match state offers to clear the
applied filters, and an exhausted cursor offers navigation back. A failed request
is not presented as zero vacancies. All eight targeted compiled Chromium scenarios
passed using synthetic responses, including narrow (320/390 px) and wide (1024 px)
layouts; the empty-catalogue screenshots were inspected at 390/1280 px.
These changes are implementation refinements, not a new approved Figma baseline.

The complete compiled pilot suites then passed without retries: 33 public and 47
database-backed Chromium cases. This includes the application receipt, keyboard focus
return, simulated Telegram host, salary precision/debounce, and operator workflow.
The production Telegram client and external employers are not test fixtures.

The pilot also keeps basic Profile and Applications navigation independent of native
Telegram controls: when the SDK cannot load but the current launch includes signed
data, only the server's normal verification and a successful session refresh can sign
the user in. No SDK means no native haptics or buttons. An SDK cache hint by itself
does not confer identity. This is not a new design freeze or a production login result.

## Reviewed Apply Context - 2026-10-27

R02 adds a required shown-context precondition, not a new product route/Figma freeze. A
changed role/recipient produces412, keeps the note and resets acknowledgment; Reload listing
shows fresh content before explicit renewed confirmation. Original compiled test caught a
stale checkbox accessible name while visible company text updated; the context-keyed
control now updates both. Focused scenario and full41 DB /20 public browser PASS; renewed
recipient mobile screenshot inspected. Detail: docs14/22. Not real-provider/native approval.

## Host Edge Cases - 2026-10-27

E04 uses actual compiled Chromium/API/isolated PostgreSQL plus fake HMAC credentials and
host capabilities, not a real provider/native-device acceptance. A plain SDK-shaped object/
initDataUnsafe is not login. Expired/tampered launches401/no-store/no new identity, blocked
SDK download and optional ready/back/settings/haptics/event methods throwing retain usable
browser navigation. Repeated launch preserves the local user/one identity; independent
cookie stores start independently and server409 prevents replacing an existing account.
Existing back/theme/safe-area/deep-link tests remain; insets stay bounded.

Regressions exposed thrown window.open leaving the flow rejected/busy and retained launch
hash after failed auth/SDK. Popup capability/open/close now fail safely, intent/identity
fetches have10s bounds,120s popup timeout/cancel/unmount settles. The actual installed
session refresh still determines login; these client tests are not real OAuth success.
Launch hash is cleared after SDK use in both success/failure, without deleting a different
anchor selected while auth was pending. No initDataUnsafe authentication or second app tree.

A slow-auth test then reproduced a genuine navigation race: clicked Profile was still
loading while the launch job redirect won. A short-lived router beforeEach tracks started
navigation, not just committed currentRoute, so user navigation takes precedence. The
regression holds the actual compiled profile chunk until auth settles;21/21 repeated host
cases pass after the fix. Original signed job launch still has its own positive regression.
One intermediate test looked for Settings in the four-tab navigation; corrected to the
existing fallback-banner link, not an added product control or longer timeout.

No design-system/page-tree/provider/session-protocol change or new Figma freeze. Actual
full final suite results/delivery are recorded in docs14 after completion; native Telegram,
real Google/GitHub, owner acceptance and independent R remain separate.

## SSR Interactivity - 2026-10-27

The public outcome failure was investigated rather than accepted after warm reruns.
An actual held-JavaScript regression first failed: salary input was enabled in SSR without
Vue handlers. Destination and amount now reuse mounted interactivity, as Jobs search does.
After release, the first60000 input is retained and produces the real demo estimate.
Focused SSR/outcome15/15 repeats and final full20 public/28 DB browser PASS, no new waits/
timeouts or weakened assertions. Native/provider/human acceptance is still separate.

## Operator Overview - 2026-10-27

Current work/oldest5 and bounded activity use existing Nuxt UI/Lucide/flat admin bands,
not a replacement admin design. Six viewport widths pass overflow and44px counter-target
assertions;320/1440 screenshots inspected. Exact off-page review links survive reload,
matching queues retain25-row pages/full totals, and withheld-company jobs stay excluded.
503 UI transport fixture/retry and actual role-revoked403 show errors rather than zero.
Full28 DB browser pass; public18/19 exposed intermittent relocation input loss. Unchanged
focused10/10 rerun passes but is not proof the failure was fixed. Follow-up hydration
investigation remains explicit in docs14; no new freeze/independent R/human acceptance.

## Correction and Reopening - 2026-10-27

Existing operator detail has one flat recovery disclosure/form using current Nuxt UI and
Lucide; no new admin workspace. Entry revision/fixed reason and private note produce a
new correction, not an overwritten audit row. Reopen explicitly takes ownership and resumes
TalentBay review, never withdrawn/rejected/candidate-requested consent. Candidate progress
marks an inaccurate original and shows later fixed correction/reopen facts; action time/
closure reason on the corrected entry are no longer shown unqualified. Private notes,
actors/channels/references do not enter that DTO.

Real HTTP/SQL browser path exercises closure->lost-response/retry->one reopen->correction->
candidate view->withdrawal and revoked-admin UI.320/390/1440 screenshots inspected, note
retention and original row immutability asserted. Low-contrast warning text was replaced
with the existing dark muted token. Existing local review personas can reproduce the flow
(docs21); this is the allowed local E01 prototype fallback while Figma is read-only, not
a new freeze/owner acceptance, actual outreach or independent security review.

## Relocation Outcome and Sources - 2026-10-27

D05 keeps the vacancy side tool/narrow dialog, shared state and Nuxt UI controls. Flat
monthly/moving/source sections replace the nested result card; the dialog owns its header
and context rather than repeating a second framed card/title. Missing pilot data is
explicit, without requests or invented prices. Server details expose reviewed source/access/
effective/review/validity and declared assumptions; private review identity stays private.
Demo lacks invented subcategories. Initial moving cash includes deposit, not monthly rent.

Currency change clears income; same-currency scenario keeps it. Editing hides mismatched
answers immediately, debounced requests use installed Nuxt cancellation/deduplication,
errors retain inputs with retry, and reviewed->demo downgrade clears prior values. Per-context
financial drafts stay in memory, not route/localStorage; owner changes reset them. Zero and
signed shortfall remain explicit. Public and real-SQL/API/browser tests cover these paths.

Inspected320/1440 screenshots exposed a real long-context header/close overlap and flex
shrink issue. Fixed reserved close space/shrink-0 header/min-h-0 scroll body; geometry
assertions now check description within header and left of close. Six widths cover complete
disclosures, long source/assumption strings and horizontal bounds; scrolled bottom is
reachable. Screenshots disable the opening animation rather than accepting a translucent
mid-transition frame. The source fixture is explicitly fictional, not actual London data.
Writable Figma gate and failed draft attempt are recorded in docs27: no canvas change,
no new approved freeze. This is engineering verification, not independent R/native/owner
acceptance or real data approval.

## Relocation input honesty - 2026-10-27

D02 preserves the existing component but removes the invented standalone110000 salary;
only a same-currency vacancy midpoint or explicit user value supplies income. Zero is a
valid scenario, with negative disposable shown rather than hidden. Missing/invalid input
does not call the estimate as a default success. Existing monthly/hourly/currency behavior
is retained; full source/assumption/outcome design is D05, not a claimed new Figma freeze.

## Provenance / truthful age - 2026-10-27

C04 adds an unframed definition list using existing tokens at the source/footer and review
modal. Public lists show no relative age when publication is unknown; dates render UTC.
Source publication, fetch, import, TalentBay publication and content check have separate
labels. Admin alone sees the recorded reviewer, and published listings offer an explicit
checked Recheck action. No freshness/availability certificate, automatic expiry policy,
new admin redesign or invented Figma freeze. The real CSV->review->publish->detail browser
path checks dates/privacy, recheck preserves publication, legacy no-date state and320/390/
1440 widths. Scrolled mobile final-date bounding box is above the fixed Apply bar; a
full-page PNG's fixed bar alone is not a geometry test. Screens inspected320/1440 and
scrolled320. Dataset remains fictional and real/native/source acceptance stays separate.

## Focused admin queue continuation - 2026-10-27

C03 adds bounded pages/search/counts and URL-owned selected review to existing user and
vacancy tables, not a new admin design system/CRM. Current Nuxt UI and local keyboard-
scrollable table regions remain. Existing private resource clearing is reused on account
change. A real111-account/111-vacancy browser fixture covers last page, reload, filter reset,
selected review, dashboard->queue navigation, revoked role and no-store denials. The test
found both a lost hash on modal close and non-link dashboard metrics from dynamic global
NuxtLink resolution; fixed the implementation, not the assertion. Screens320/390/1440
inspected, horizontal scroll tested by keyboard. This is engineering verification, not
the deferred full-admin design approval or a new Candidate Figma freeze.

## Vacancy pagination / long-content correction - 2026-10-27

Replaced the hidden50-result ceiling with URL-bound Older/Newest pages, retaining existing
filters, Saved/card routes and native detail/back history. Results-anchor navigation is
used for same-path page changes; no global router override or extra state store. Strict
bad cursors have an explicit restart path. A111-job real-SQL/browser fixture proves SSR
first page, no overlapping results, page2 detail/back/scroll, last page and filter reset.
Long unbroken titles exposed mobile auto-grid min-content overflow at320px. Explicit
single-column minmax track/min-w-0 fixes it; final320/390/1440 screenshots were inspected.
This is an engineering workflow refinement, not a new approved design freeze.

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
pnpm exec playwright install webkit
pnpm exec playwright test --config playwright.database.config.ts
```

The config executes the target guard before any fixture writes. It supplies a fake local
bot credential and normal signed initData; there is no production test-login backdoor.
The real HTTP boundary, sealed session, Drizzle and PostgreSQL remain in the loop.
The WebKit project opens the compiled app over loopback HTTPS on port 3138. Its
launcher requires OpenSSL and generates a temporary self-signed certificate. Only
the test client accepts it; the OS trust store and app cookie settings are unchanged.
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

The database suite runs the full Chromium project and the `@mobile-pilot` cases in
WebKit with Playwright's iPhone 13 device profile. To run only the latter, add
`--project=mobile-webkit`. This covers the signed launch, session/navigation and
the two-role application path. Emulation does not run the iOS Telegram client or contact a bot.
Real Google/GitHub callbacks, mobile Safari/WebView behavior, provider entitlement, domain/bot configuration,
approved content/legal copy and release verification remain required before public beta.
No passing build or local browser test means merged, deployed or live-provider verified.

**Touch form focus (22 November).** The previous build rendered the profile phone
field at 14 CSS px in the iPhone 13 WebKit profile. The mobile pilot now checks a
16 px minimum for profile text fields and the cover note, phone focus after a tap,
and that the viewport does not disable pinch zoom. Both Chromium and mobile WebKit
completed the synthetic application flow locally after the CSS change. On the
restarted tester bot the CTO confirmed on a physical iPhone that focusing fields
no longer zoomed the page and that an application receipt was shown. The keyboard
could still cover the focused field; keyboard visibility is a separate check.

Profile and apply dialogs now fit the visual viewport during touch editing and
scroll their own content only as far as needed. The prior build failed the
obstruction check. In a local WebKit iPhone profile, simulated viewport heights
of 420, 240 and 400 CSS px covered About, Phone and Cover note respectively;
the active control stayed visible without scrolling the background, repeated
resize was stable and the original dialog height returned after dismissal.
The mobile and desktop application scenarios passed. Physical-device keyboard
placement on this change is pending; the active tester was not restarted.
