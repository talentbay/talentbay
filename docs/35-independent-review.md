# K1 Independent Review Handoff

Prepared:2026-10-27. This is the executor's evidence handoff, **not independent approval**,
owner acceptance, a security certification, a hosted preview or release permission.

## R01 Result - 2026-10-27

Owner explicitly authorized a separate read-only reviewer after resuming work. The review
target was exactly6278108 below, excluding CI-only PR60. Reviewer confirmed two P1 defects:
Apply did not bind acknowledgment to the displayed vacancy/recipient version; an unchanged
listing recheck advanced updatedAt and blocked previously eligible application packages.
Both were reproduced with synthetic in-memory service adapters, not independent PostgreSQL.
The reviewer also exercised narrow OAuth state/session, independently signed Telegram
negative cases, role, relocation, source-limit and database-target probes. Full SQL,
browser/build/typecheck and real providers were **not** independently exercised.

Verdict: R02 fixes required; not accepted for K2. This is a bounded code review, not a
certification or new release permission. Subsequent exact fix SHA/checks/R03 verdict are
tracked in docs14 rather than silently replacing this frozen historical target.

## Exact Target

- Repository: `github.com/talentbay/talentbay`, private.
- Review candidate: latest head of [draft PR59](https://github.com/talentbay/talentbay/pull/59),
  branch `codex/product-walkthrough`. Resolve its actual full SHA and own CI before starting.
- Implementation payload at preparation: `27dec5516c06b35856764d0466ade3598464eb48`;
  this handoff/task ledger are a subsequent documentation-only addition. Do not substitute
  an older passing CI head for the final PR head.
- Fetched `origin/main` and common ancestor: `2aca646f2c1ad0b5e59c375a30598a0f47da060a`.
  The cumulative diff at payload is318 files/35110 additions/4479 deletions, including docs,
  assets and lockfile. It includes pre-autonomous auth/Candidate work, not only PR38 onward.
- Autonomous continuation foundation: `4e1be73`; focused delivery/evidence is in docs14.
  PR24 Cloudflare experiment is deliberately absent. No main merge or production deployment.

The owner selects/starts a different reviewer model/session for R01/R03. The implementing
agent's self-check, successful CI and this narrative do not satisfy that condition. Do not
message other chats, switch model/accounts or start a background reviewer by inference.

## Intended Product

One responsive Nuxt app for web/mobile/Telegram: browse useful approved jobs -> estimate
relocation -> profile/contact -> acknowledged Apply -> TalentBay human handling -> candidate
sees actual recorded progress/next step. Operator imports/reviews/publishes content, assigns
work, contacts a company, prepares the immutable minimum package and records a **manual**
handoff/follow-up/closure. A company is a potential customer, not an invented active employer
account. Receipt, internal work, recorded handoff, delivery/read and hiring are different.

K1 is fully synthetic code readiness. K2 needs actual approved data/providers/HTTPS and
independent findings resolved; K3 needs separate owner go/no-go, backup/rollback/operator
and explicit promotion. No token/ICO/payments/custody/KYC implementation or responsibility.

## Read and Verify

Start with AGENTS, docs14 task ledger/evidence, docs23/24 scope contracts, docs17/21 browser
and product routes. Then review actual diff/code, not just the executor's summary:

1. Auth/provider subjects, explicit linking/state/HMAC/session/current-role/ownership
   boundaries; do not authenticate through username/email or initDataUnsafe.
2. Snapshot/handling locks/revisions/idempotency, competing Apply/share/withdraw/correction/
   reopen, immutable originals, public projections and truthful legacy/null data (docs22/29).
3. Source connector/runner limits, approved registry, leases/checkpoints/retry/atomic import,
   unchanged versus changed publication, archive/sibling company invariants (docs25).
4. 11-city data contract/math/dates/units/dataset revision/rollback and honest demo/missing
   coverage, sensitive input lifetime and async race behavior (docs26/27).
5. Actual user/operator journey, keyboard/320..1440 layouts, error/retry/loading, navigation
   priority, pre-hydration controls and account switch. Read-only Figma means local prototype
   is fallback; no new freeze or full admin redesign was approved (docs10/17/21).
6. Dashboard definitions/sample/cohorts/corrections versus invented funnel, PII/log/cache/
   errors, actual recovery and default test-target safety (docs30..34).
7. Bot header before body/persistence, receipt versus delivery, optional host capabilities,
   independent cookie stores and off/configuration limits (docs28).

Use locked Node22/pnpm10.33.0. Serialize type generation/build, rather than concurrently
regenerating shared Nuxt metadata. Use installed PG18 and existing Chromium; no paid services:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
node --test tests/tooling/*.test.mjs
pnpm test:integration
pnpm build
pnpm test:smoke
pnpm test:e2e
pnpm test:recovery
```

`test:integration` owns its fresh loopback database and ignores developer dotenv/URLs.
Compiled DB browser tests additionally need a separately verified disposable target using
the exact CI service/markers/commands in `.github/workflows/ci.yml`; config rejects shared
URLs. Never use `.env.integration`, production/preview credentials or the interactive review
DB for automated test cleanup. The canary Node/Vercel build commands are also in CI; no deploy.

Manual inspection: `pnpm dev:review` (or3132/3133 alternate ports), follow docs21. Its
chooser/native-auth-shaped fixtures are a separate loopback process, absent from production
output. `/bot` is a pure contract preview, not a real Telegram transport/receipt/launch.
Never tunnel this environment or use real candidate/company data. No real outbound contact.

## Evidence and Uncertainty

G04 exact PR58 CI40524069539 succeeded:190 unit,90 SQL with legacy upgrade,40 DB browser,
20 public browser, Node smoke and73route/oneNode22 Vercel adapter, fake-canary static81files/
70scripts. E05 adds selector/preview/tooling/typecheck/manual local-browser evidence,34
tooling tests. **The final PR59 CI is authoritative for its own head**, not these parent counts.
Synthetic recovery compares12 tables/52 rows, all-row digests/sequences/indexes/replay and
actual restored identity/history/new Apply/withdraw/DB-down/log privacy. Rerun independently.

Important residual limits to challenge, not silently accept:

- No approved real source pages (owner27Oct: ask CEO); registry/cron off, no real ingestion.
  Connector has fixed Lever transport; CSV fallback does not replace its offline test proof.
-11 cities are accepted geography, not approved tax/rent/cost datasets. Existing figures
  are demo or missing. The technical2M annual-gross nominal cap can exclude realistic ARS
  salaries; do not describe it as a universal purchasing-power bound.
- Calculation GET query can be observed in browser/provider/proxy metadata. No-store/app
  log redaction is not universal privacy. H02/G05 must resolve real transport/log policy.
- No approved retention/erasure/export/support-owner/channel/legal texts or real sharing
  process. Snapshot/private notes/backups/manual copies matter; raw legacy FK cascades are
  unsafe as an ad-hoc privacy operation. No export/delete/disconnect endpoint is shipped.
-3 known build/tooling advisories remain (docs16); default-branch43 alerts are a different
  graph. Absence of forge/fontless from inspected runtime does not certify future builds.
- Real distributed abuse limits/WAF/cost/alerts and backup/restore ownership are H gates,
  not proved by local locks, bounded bodies, connection timeout or synthetic recovery.
- Vercel/Neon/domain evidence remains dated26Oct in docs20. No real provider/native/HTTPS
  acceptance, shared restore/migration, commercial hosting approval or production traffic.
- Saved is device-local; bot notification delivery/employer self-service/CV upload are
  deferred. A prepared/copyable package does not mean delivery or recall of external copies.
- Old binaries may not understand new enum/history/null-email facts after new writes.
  App rollback is not a destructive down migration or data deletion.

## Required Reviewer Output

Report findings first: severity, exact path/line, reproducible scenario, impact and missing
test. Exercise negative/async/concurrency assumptions, not merely screenshots/build status.
Separate confirmed defects from policy/provider gates and hypothetical future work. State
what could not be tested and whether the **code** is ready for R02/R03/K2 preparation.

Do not merge main, deploy, change provider/billing/domains/secrets, migrate shared DBs,
scrape sources or send candidate information. Initial R01 is read-only findings; fixes get
narrow branches/regressions in R02, then separate R03. A successful review is not legal
approval or a promise of recruitment/delivery/financial outcomes.
