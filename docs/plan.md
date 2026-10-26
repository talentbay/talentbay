# TalentBay Product & Architecture Plan

Last updated: 2026-10-26
Decision: ship the MVP on Nuxt/Node + Vercel + Neon.

Detailed remaining work: [delivery proposal](23-mvp-delivery-plan.md) and
[task contracts](24-mvp-backlog.md), prepared 2026-10-26 for scope/model selection.
They do not authorize a production rollout or start autonomous implementation yet.

## Active decision

One responsive Nuxt application serves desktop browsers, mobile browsers and Telegram
Mini App WebViews. Keep the existing repository, PostgreSQL/Drizzle data model and Node
server runtime. Cloudflare Workers/Hyperdrive is an optional post-MVP experiment, not a
release dependency. See `docs/adr/0006-mvp-first-vercel-neon.md`.

Candidate Design v1.0 is the reference baseline. The owner authorized design iteration on
2026-10-26; record deviations, not an invented new approval/freeze. Use
`docs/10-design-direction.md` and the active Figma handoff; archived web/Telegram screens
are not competing specifications.

`docs/roadmap.md` defines dependency order. `docs/14-mvp-execution.md` records evidence,
current blockers and the next runnable task. Older verification dates in
`docs/09-current-state.md` and `docs/11-deployment-runbook.md` are historical, not proof
that a provider environment is healthy or accessible today.

## MVP system

```text
Desktop / mobile browser / Telegram WebView
                    |
                    v
Vercel: one Nuxt application
Vue UI + Nitro Node API + sessions
                    |
             Drizzle / Postgres.js
                    |
                    v
Neon PostgreSQL
production / preview / integration (verify before use)

GitHub Actions: checks + disposable PostgreSQL for integration tests
```

Retain domain boundaries within the application: auth, profiles, vacancies, Saved,
applications, relocation, organisations and admin operations. Do not create network
services or move the repository into a monorepo without a demonstrated need.

Vue is the interface framework, not a separate hosting service. No ClickHouse runtime
integration was found in the active code audit; analytics infrastructure is not an MVP
prerequisite. PostgreSQL remains the source of truth; D1 migration is out of scope.

## Product contract

Share routes, domain logic and components across hosts:

- `/jobs` and `/jobs/:slug` remain separate routes;
- `/saved`, `/applications`, `/profile` and `/settings` follow the canonical route mapping;
- Relocation is vacancy-context state with preserved context/back state. Handoff node
  `2078:35` does not mandate a new top-level route;
- wide composition starts at `lg` / 1024px; narrower layouts use the same domain model;
- the Telegram adapter provides optional host capabilities rather than a second page tree.

Browser navigation must work without Telegram. Telegram-only APIs are feature-detected;
missing optional features use browser fallbacks rather than blocking the entire product.
Do not equate a narrow viewport or the existence of a Telegram SDK object with a verified
Telegram identity.

## Authentication and identity

One local TalentBay account supports multiple provider identities. Google/GitHub handlers,
validated Telegram sessions and explicit linking are implemented in the current unmerged
MVP line; real-provider acceptance and deployment remain separate release gates.

The unified identity branch implements stable provider subjects, Telegram-only users,
explicit linking and conflicts; see ADR 0007 and the execution log for its checks and
delivery status. Existing provider rows retain their users. New subjects never auto-link
by matching email. M2.1 initially preserved the older behavior; M2.2-M2.4 supersede it.

- Validate Telegram `initData` on the server, including signature and bounded age.
- Treat usernames, display names and client-supplied emails as untrusted identifiers.
- Resolve providers by their stable provider user ID, with database uniqueness.
- Support explicit account linking with proof of the current account and new identity;
  do not merge accounts merely because the browser sends the same email.
- Make schema changes backward-compatible and test migrations before any shared DB use.
- Keep a normal TalentBay session after authentication. Browser and Telegram WebView may
  have separate cookie stores; the common account does not imply shared cookies.
- Review dependency advisories and OAuth state/callback protections before enabling login.

Public browsing does not require profile completion. Authenticated actions must have
server-side authorization; client guards only control navigation.

## MVP scope and honest fallbacks

Implement the frozen Candidate journey: browse/search, detail, Saved, relocation preview,
profile editing, application review/submit and current application status.

The minimal [application boundary](22-application-review-contract.md) adds read-only
operator access and candidate withdrawal, not an employer inbox or delivery. The owner
confirmed on 2026-10-26 that TalentBay receives applications and manually contacts companies
to propose candidates and begin potential client relationships. Keep in-product Apply;
do not default to external redirects. Receipt by TalentBay, company contact, actual profile
handoff and employer viewing are different facts. The operator handling log/share approval
remains to be implemented; current receipt copy is not proof of completed delivery.

Saved may remain browser-local in the first release and must be labelled accordingly.
Do not claim cross-device sync until the server-backed relation/API exists. Notifications,
account export/delete/disconnect and language selection must not appear operational
before their service/policy/localization support exists. Do not request Telegram bot
write access during first launch.

Relocation stays explicitly demo/illustrative until reviewed data is present. A technical
preview is not permission to market demo tax or cost figures as verified advice.

## Content before launch

A launch requires useful approved vacancies, not just finished screens. Reuse existing
server-authorized import/review/publish operations; do not make a full new admin workspace
or universal spreadsheet mapper a prerequisite.

Initial operator workflow:

CEO scope reconciliation (2026-10-26): a working job-source connector/runner and basic
Telegram bot are MVP requirements, not blanket post-MVP options. Automated gathering feeds
the same validation/draft/review/publish boundary; CSV remains fallback/correction, not
the entire ingestion product. Expanded connectors and notification delivery are distinct.
See C06/C07/I01 in `docs/24-mvp-backlog.md`; no second frontend is introduced.

CSV fallback/correction workflow:

1. Prepare CSV using a fixed documented template (keep existing JSON import support).
2. Validate types, field lengths, source identifiers, duplicates and every row.
3. Show or produce an actionable validation report and a dry-run preview.
4. Import bounded batches through the existing authorized workflow.
5. Review and explicitly publish approved records.

No source scraping or publication without source permission. Re-imported content must not
remain publicly published while its review is invalidated. Preserve idempotency and user
applications when updating a vacancy. Return row-level errors rather than silently
skipping data. Design the small file-import UI delta before implementing new controls;
preserve the Candidate reference contract. A larger admin redesign and XLSX arbitrary-column mapping are
post-MVP work.

PR #27 implements the publication invariant with PostgreSQL regressions, retaining IDs and
applications. Its checks and unmerged delivery status are in `docs/14-mvp-execution.md`.
Do not infer the fix is deployed merely because it exists in this branch.

## Delivery and test strategy

Keep GitHub Actions typecheck, lint, unit tests, Node production build and HTTP smoke.
Add the existing integration suite to CI using an ephemeral PostgreSQL service populated
from committed migrations. It must not use Neon production credentials or shared customer
data. Local/integration branch runs remain explicitly opt-in.

Use one deployment mechanism, not competing Git integration and Actions deployments.
Prefer the existing Vercel Git integration once the correct project/team access and plan
are confirmed. Verify that release promotion is actually gated by CI/review: a successful
Vercel build alone does not prove GitHub tests passed. Until that gate is configured, keep
production promotion manual and explicit. Never run migrations as an application build
side effect. Apply reviewed migrations separately against the intended environment.

Preview and production must have distinct database targets and provider callbacks. A
per-PR DB branch is optional; a controlled preview branch is enough initially. Exclude
private user data from demo fixtures, preview pages and test artifacts.

## External gates (do not block independent code work)

- Vercel project ownership/settings access and a plan permitting the intended commercial
  use and private GitHub organisation repository.
- Neon runtime/schema/data readiness and authorized operations, verified before migrations.
  Identifiers were discovered; dated metadata and archived status are in the execution log.
- Google/GitHub callback configuration and Telegram bot credentials/menu URL.
- Final domain ownership and routing approval.
- Approved privacy/terms text and vacancy sources; reviewed relocation data or a clearly
  disclosed demo limitation.

Do not activate paid plans, start trials, transfer projects, rotate secrets, migrate
production or move domains without explicit user approval. Do not request raw secrets in
chat. Use provider secret stores or an approved local secret channel.

## Deferred infrastructure

Keep PR #24 and `feat/cloudflare-runtime-foundation` as a draft experiment. Its successful
build is not proof of a running Worker or Hyperdrive connection. Do not merge its Worker
preset, runtime DB lifecycle changes or deployment requirements into the MVP by default.

Revisit Cloudflare, Queues, R2, separate bot/import workers and analytics only when cost,
measured load or operational needs justify the work. They are alternatives/extensions,
not requirements for serving the same product in Telegram.

## Execution discipline

Use focused branches/PRs. Report five states separately: code ready, tests passed, merged,
deployed, live verified. Update the execution log after each verified milestone. A planned feature or
passing build is never described as deployed or fully working. Keep the design unchanged
unless implementation exposes a material contract conflict requiring review.
