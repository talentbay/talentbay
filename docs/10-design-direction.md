# Design Direction

Last updated: 2026-10-03

## Design Source

Primary Figma file:

<https://www.figma.com/design/1F2PdjirY8GfqLes3I90ZK/TalentBay>

Candidate Design v1.0 is frozen for implementation.

Active Figma pages:

- `10 Components · Core` — shared controls, filters, relocation estimate and system states.
- `11 Components · Candidate` — candidate-specific responsive component families.
- `30 Product · Candidate · Responsive` — the single active candidate product specification.
- `99 Utilities` — `TalentBay · Candidate Handoff · v1.0`.

Archived pages `90–93` are reference/history only and must not be treated as competing product specifications.

## Product Shape

TalentBay is one responsive Nuxt product.

Desktop browser, mobile browser and Telegram Mini App WebView use:

- the same product routes;
- the same domain hierarchy;
- the same candidate state model;
- the same reusable component families.

Telegram-specific capabilities are host/platform behavior rather than alternate product screens. The host adapter may provide validated `initData`, BackButton, SettingsButton, safe-area values, theme parameters, haptics and `requestWriteAccess`.

Do not create a separate Telegram page/component tree.

## Visual Direction

- Product-first information architecture.
- Heritage navy/teal TalentBay identity with the Product theme used for the application UI.
- Manrope typography.
- Compact operational UI rather than a marketing landing page.
- Vacancy and relocation information visible in one workflow.
- Clear distinction between verified/reviewed data and demo/illustrative estimates.
- Nuxt UI primitives and Lucide icons remain the preferred production building blocks.

## Responsive Contract

The product shell switches at the existing Tailwind `lg` breakpoint (1024px). Existing Jobs, Vacancy Detail and Profile code already uses `lg` for wide compositions; keep that breakpoint unless implementation evidence requires a deliberate change.

### Mobile — 320–767px

Reference width: 390px.

- 16px page gutters.
- Candidate bottom navigation on top-level candidate routes.
- Candidate mobile header on drill-down views.
- Single-column composition.
- Cards/forms fill the content width.
- Touch targets remain approximately 44–48px.
- Search may become a focused state.
- Filters, sort and destination selection use bottom sheets.
- Sticky primary actions may sit above host/browser safe-area insets.

### Compact — 768–1023px

Reference widths: 768px and 900px.

- 24–32px page gutters.
- The narrow candidate shell remains active below `lg`.
- One primary content column.
- Local two-column control grids are allowed when labels remain legible.
- Do not introduce wide desktop sidebars yet.
- Bottom sheets may become centered dialogs where useful without changing state semantics.

### Wide — 1024px and above

Reference width: 1440px.

- Top Candidate Navigation.
- 1248px primary content container at the 1440px reference width.
- Two-column compositions where they reduce context switching:
  - Jobs + relocation comparison;
  - Vacancy Detail + relocation context;
  - Relocation inputs + outcome.
- Narrow bottom-sheet interactions map to popovers, dialogs or inline panels.
- Hover states may augment keyboard focus, but product behavior must not depend on hover.

## Candidate Product Contract

Implementation reference sections on `30 Product · Candidate · Responsive`:

- `01 · Jobs`
- `02 · Saved`
- `03 · Vacancy Detail`
- `04 · Relocation`
- `05 · Applications`
- `06 · Profile`
- `07 · Settings`
- `08 · System States`

The active page also contains:

- `00a · Responsive behavior`;
- `00b · Host behavior · Telegram adapter`;
- `00c · Interaction state matrix`.

Those sections replace the archived Telegram interaction page as the implementation behavior reference.

## Candidate Component Contract

Candidate-specific families:

- `Candidate Navigation`
- `Candidate Mobile Header`
- `Vacancy Card · Responsive`
- `Application Card · Responsive`
- `Information Row · Responsive`

Shared Core families used by Candidate:

- `Button`
- `Input`
- `Select`
- `Textarea`
- `Form Field`
- `Tag`
- `Search Filters`
- `Relocation Estimate`
- `System State`

Reuse these families before creating local desktop/mobile copies.

## State Ownership

### Server/domain state

Production/domain code owns:

- vacancies;
- application records and current status;
- candidate profile;
- authenticated TalentBay session;
- relocation calculation/data provenance.

The design must not imply unsupported server state such as candidate-visible application status history timestamps, candidate Withdraw mutations, immutable historical profile snapshots, interview logistics or offer documents.

### Browser/product state

Current local/client responsibilities include:

- Saved vacancy slugs in V1;
- Jobs query/filter/sort UI state;
- local Jobs defaults;
- local theme override where used.

Saved must not claim account or cross-device sync until the planned server-backed saved-vacancy model exists.

### Telegram host state

The host adapter owns access to Telegram capabilities such as:

- validated `initData` bootstrap;
- BackButton;
- SettingsButton;
- safe-area values;
- theme parameters;
- haptics;
- `requestWriteAccess`.

Never trust `initDataUnsafe` for authentication.

## Known Implementation Gaps

These gaps are documented in Figma and do not require redesigning Candidate v1:

- **Telegram identity/auth:** the current `users.email NOT NULL` and GOOGLE/GITHUB identity assumptions require the planned Telegram identity/session migration or adapter.
- **Saved sync:** current V1 persistence is browser-local.
- **Notifications:** permission UX is specified, but subscription storage, event triggers and Telegram bot delivery are not implemented.
- **Application withdrawal:** `WITHDRAWN` can be displayed, but no candidate mutation endpoint currently exists.
- **Privacy/i18n:** export, delete, disconnect and language controls remain inactive until backend/policy/localization support exists.
- **Relocation trust:** demo/verified state remains explicit; production use depends on reviewed and approved sources.

## Implementation Handoff

Use `99 Utilities → TalentBay · Candidate Handoff · v1.0` for:

- route → design mapping;
- responsive rules;
- active component inventory;
- server/local/host state ownership;
- known backend gaps;
- implementation sequence.

Do not reproduce Figma layer structure mechanically in Vue. Preserve the design/state contract while using the repository's domain components, Nuxt UI primitives and normal Nuxt routing patterns.

## Product Principles

- The first viewport shows the job-search product.
- Vacancy data, source status and relocation estimates are distinguishable as verified or demo.
- Mobile layouts preserve search, scan and apply workflows.
- English remains the first language; do not expose a fake language selector before real i18n exists.
- Telegram permission requests happen only after explicit user intent.
- Accessibility, keyboard focus and recovery behavior are part of the component contract.

## Design Review Rule

Candidate Design v1.0 is frozen for implementation. During implementation:

- fix minor spacing/state corrections directly when they conform to the existing component language;
- return to Figma for material new flows, new domain capabilities or changes to responsive/state contracts;
- keep archived pages as history only;
- do not start Admin product design from archived employer/admin concepts — design it separately when Admin becomes the active phase.
