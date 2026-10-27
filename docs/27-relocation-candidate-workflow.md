# Relocation Outcome Working Contract

Date: 2026-10-27. D05 / relocation part of E01, under the owner's design-iteration mandate.
Candidate v1 remains the baseline, not a new approved freeze. Live Figma read confirmed
page2057:3/root2060:2, section2060:44, mobile2063:594 and desktop2063:532. Mobile design
context/screenshot inspected: vacancy context, explicit inputs, monthly remainder,
breakdown, one-time budget and data links. Working additions stay in these existing
families/Nuxt UI/tokens, not a new top-level Telegram/relocation product.

## Flow and Ownership

Jobs/detail -> contextual estimate -> inspect inputs/budget/data assumptions -> close/back
to the same vacancy -> existing Apply. Wide uses the existing side panel; narrow uses
the existing dialog. No dedicated route or separate host tree. Original job title/company
remain visible when a different destination is selected; no job-support guarantee is added.

Server owns reviewed data/math/provenance/availability. The UI owns an in-memory draft
per vacancy/standalone context. Hard reload reconstructs the current vacancy/initial salary,
not an advertised persistent financial draft. No new URL/localStorage financial history.
Account changes clear the estimate draft; visits under another account do not inherit it.

Destination changes preserve an amount only within the same currency. Currency changes
clear it immediately, without FX/old results under new currency labels. MONTH midpoint
is annualized; HOUR/missing/mismatched salary stays blank. No household/rent slider or
hours/tax-residence inference. A different destination is a scenario, not an employer offer.

## State Matrix

| State | Visible result / action | Acceptance |
| --- | --- | --- |
| Explicit valid salary + reviewed package | Monthly gross, modeled deductions/net, rent/living, signed remainder; moving cash budget; source/date/validity/assumptions | No private reviewer/import actor; details are server data, not client tax math |
| Demo | Illustrative summary/disclaimer, no invented detailed expense categories/review sources | Clearly not actual housing/tax/flight data |
| Blank/invalid salary | No stale/default estimate; existing input remains editable | No hidden110000, no request as zero for blank input |
| Explicit zero/negative outcome | Zero income and signed shortfall are visible | No clamp to a reassuring positive number |
| Known pilot city without reviewed/demo data | Destination and currency with unavailable state; no price or tax answer | All11 coverage visible, not11 fabricated datasets |
| Unsupported vacancy city | Existing unavailable explanation, normal job/Apply retained | No guessed nearby city/country |
| Editing/loading | Prior mismatched answer hidden; bounded loading state | A late previous-city/previous-income response cannot masquerade as current |
| Network/error | Explicit unavailable/retry, inputs retained | No fallback to a successful invented estimate |
| Data expires/changes | Server drops invalid reviewed record; refresh/reselect is available | Old snapshot is not relabelled current |
| Close/back/reopen | Same vacancy/Applied filters/back path, current in-memory scenario | Browser reload returns vacancy context; financial persistence not promised |

## Composition

Keep a compact framed calculator, no nested floating cards. Result, monthly rows, moving
budget and disclosures are divided by flat separators. Disclosure controls expose source
access/effective/review/validUntil dates, stated tax-residency/year/inclusions/exclusions,
housing and move-route basis. Deposit is part of initial cash budget, not monthly spending;
no refundable/booking/visa guarantee is invented. Unknown detailed demo categories remain
absent rather than zero. Labels describe the modeled outcome, not all real personal taxes.

The current currency-change bug (same number carried GBP->EUR) is in scope. Explicit source
dates and working states are an iteration, not owner acceptance. Runtime screenshots/
keyboard/overflow tests at narrow/compact/wide plus Figma working prototype/state evidence
belong in docs17/docs14; never overwrite the frozen handoff or use archived Telegram frames.
Real datasets, subject review, native hosting and independent R remain separate gates.

## Figma Access Evidence - 2026-10-27

Active mobile reference2063:594 and local Core controls/tokens were inspected in file
1F2PdjirY8GfqLes3I90ZK. Manrope/Product theme, local Input/Select and the existing relocation
family remain the reference; unrelated LS/community search results were not imported.
The proposed working-state board could not be created: `createPage` returned
`Can't call "createPage" in read-only mode` (debug dda886a5-1992-4967-842c-0eceb8f6fdd7).
The error occurred before creating any node; no draft page/frame or new freeze exists.
Writable Figma access is a separate design-artifact gate. Browser screenshots and the
state matrix are implementation evidence, not a replacement approval or a claimed Figma sync.
