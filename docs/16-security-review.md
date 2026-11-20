# Security maintenance review

Updated: 2026-11-17. Scope: repository dependency graph and admin authorization; this is not
a penetration-test certification or evidence of a production deployment.

## Current Dependency Refresh - 2026-11-17

The previous three-entry audit is historical. A fresh audit of integration57441af reports
43 findings (8 high,26 moderate,9 low;0 critical), not the GitHub default-branch banner.
The security topic raises Nuxt4.6.2 to4.6.4, Nitro2.13.4 to2.13.6, Vite8.3.5 to8.3.8,
devalue6.0.3, undici8.12.4, launch-editor2.14.2 and node-forge1.4.3 through the supported
Nuxt subtree. Remaining direct-transitive @nuxt/schema copies are refreshed to4.6.4 within
their existing ranges. No blanket major overrides or advisory suppression were applied.
This incorporates the applicable package targets from old-base Dependabot63 without
replacing the newer MVP manifest/lock with that PR's old graph. Installed Nuxt's Node
range supports Node22; project security floor is now22.23.5, the11November security release.
CI selects current Node22; local verification uses a checksum-verified temporary22.23.5,
not a change to the owner's system installation or actual Vercel runtime.

Fresh full-tree audit now reports4 findings:0 critical/0 high/3 moderate/1 low. `--prod`
does not prove runtime reachability: Nuxt build/dev tooling is declared under dependencies.
The narrow CI audit guard independently checks full-tree and production-only reports:
pnpm deduplicates their paths differently. It checks exact GHSA, package, severity,
version and reported path;
registry/parse failures, unknown findings and inconsistent counts fail closed. Known issues
remain visible, not called fixed. Revisit these exceptions when parents support updates:

| Advisory / package | Current exposure and boundary |
| --- | --- |
| GHSA-67mh-4wv8-2f99 / esbuild0.18.20 | Drizzle Kit's deprecated loader, development-server CORS. Migrations use isolated CLI, not that server or publicly exposed Studio. A forced0.x upgrade is not treated as compatible. |
| GHSA-g7r4-m6w7-qqqr / esbuild0.27.7 | fontless build dependency, Windows development-server file-read condition. Parent requires^0.27; do not expose its dev server or force an incompatible minor just to clear audit. |
| GHSA-g3hv-75wg-m249 / minimatch10.2.5/10.2.6 | Bounded repository/build patterns in ESLint and Nitro's archive toolchain, not application-supplied globbing. Fix is major11; no blind cross-major override. Audit counts the two versions separately. |

Initial full local verification on22.23.1 passed205unit,40tooling,95SQL/legacy replay,
20public browser,46DB browser, typechecks/lint, Node build/smoke, Vercel1Node22/74routes,
public80files/69scripts, optional Cloudflare build and synthetic restore12tables/52rows.
Final Node22.23.5 verification also passed:206unit/44tooling/95SQL+legacy replay/20public/
46DB-browser, types/lint/Node+Vercel+Cloudflare builds/smoke/public-output and12-table/52-row
recovery. Raw URL probes found and then verified a narrow cache/error classification fix;
all/prod audit guard and independent review passed. Exact RED/GREEN and limits: docs14.
Current built Node output has no esbuild/minimatch/node-forge package or executable import;
this is output inspection, not proof of every future hosted artifact or absence of all CVEs.
Gitleaks8.30.1 read-only all-ref scan covered109 reachable commits: one generic-api-key
finding is the synthetic UUID commandKey in a unit fixture, not a credential. No real key
was detected by its rules; this is not a guarantee of a secret-free history. Scan reports
were fully redacted/private temporary artifacts. GitHub's secret-scanning API reports the
feature disabled; no account/security settings or credentials were changed.

Official sources checked17November:
- [Nuxt4.6.4 security release](https://github.com/nuxt/nuxt/releases/tag/v4.6.4).
- [Nitro2.13.6 security release](https://github.com/nitrojs/nitro/releases/tag/v2.13.6).
- [Node22.23.5 security release](https://nodejs.org/en/blog/release/v22.23.5).
- [Nuxt workspace/file-serving advisory](https://github.com/nuxt/nuxt/security/advisories/GHSA-mjrq-cffv-q4qc).
- [esbuild CORS advisory](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99).
- [esbuild Windows advisory](https://github.com/evanw/esbuild/security/advisories/GHSA-g7r4-m6w7-qqqr).
- [minimatch amplification advisory](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249).

Local checks do not close primary release-configuration/artifact verification, provider abuse controls,
real-content/data permissions, backup operations, retention/legal/support, native clients
or human candidate/operator acceptance gates. No main merge or deployment is implied.

## Remaining Public Inputs / Build Probe - 2026-10-27

G04 compiled regression reproduced70KB whitespace + valid signed Telegram input accepted200.
Telegram auth now uses32KiB fatal-UTF8/uncompressed JSON and strict fields, saved resolution
16KiB and strict slugs contract. Original HMAC/current-account/link/session semantics remain.
All current JSON mutation/read POST handlers now use the existing bounded parser rather
than validating fields only after an unbounded body read. Unknown identity/role fields,
compression/type/malformed/oversized data fail before persistence/query work; positive
profile/Apply/link/resolve workflows remain required regressions.

CI Node build receives fixed **fake** server-only canaries. A new built-output probe checks
regular public assets for that marker, requires nonempty browser JS and never prints a
value. Negative tooling covers JS/maps/HTML/binary. Actual canary-built Node public output
81files/70scripts PASS. This is a regression tripwire, not a complete scanner of every
possible secret or proof of a future provider build. Production local chooser remains
absent per compiled HTTP smoke. Never pass real secrets as probe values or commit dotenv.

Current lock unchanged: fresh full-tree registry audit still3 entries (1high/1moderate/1low),
the same esbuild/node-forge exceptions below;43 default-branch alerts are a different graph.
Maintainer esbuild advisories/forge issue rechecked27Oct. No new dependency, blanket override,
advisory suppression or claim of zero vulnerabilities. Actual tests/results and exact head
are recorded in docs14 after completion. Vue text rendering/safe URL filters and real-HTTP
XSS/invalid-source/ownership/origin/receipt/concurrency tests are complementary, not a pentest.

Public auth/read endpoints are bounded, but **distributed abuse/quotas/WAF are not proved**
by local serialization, unique keys, a5s DB connect timeout or a per-process counter. Before
exposure, H02/H04 must confirm provider controls, bot/source limits, alert/cost thresholds and
responsible operator. Do not add a fake in-memory serverless rate limiter or disable existing
deployment protection. Legal/data/retention/support/native/provider approval and independent R
remain release gates. No financial/custody/ICO capability is introduced.

## Private API Boundary - 2026-10-27

G01/G02 direct compiled HTTP regressions reproduced accepted70KB whitespace profile JSON,
and no-cache on401/404 despite a no-store contract. Profile/link now use existing bounded
UTF-8 JSON parser and strict fields; no current-role/account-link proof changes. An early
cache middleware plus API-only fixed error handler address the installed Nitro404 override,
URL/data echo and raw default API error diagnostics. Standard HTML error rendering is
retained after this handler; full public browser paths still pass. Public positive job
listing behavior/auth controls/WAF unchanged. Salary computations also use no-store, not
a login requirement. Existing GET income query still has provider/network exposure, explicitly
recorded for H02/G05 rather than described as fully browser-local.

181unit/88SQL/28tooling/full20public/31DB/types/lint/Node/Vercel/smoke and synthetic recovery
evidence: docs14. Actual PII copies/projections/cascades and pending retention/export/erasure/
support policy are mapped in docs33. No automatic destructive privacy operation, legal
approval, independent audit or production/native/provider acceptance is inferred.

## Diagnostic/Recovery Boundary - 2026-10-27

F04 removes raw dynamic IDs/slugs/unknown paths from app request logs, arbitrary private
error names/sources and all payload copying. Fixed operation/outcome fields distinguish
replay/invalid validation/conflict/failure without actor/profile/source IDs. Unknown API
fallback first failed an actual runtime privacy probe; now fixed JSON404/no-store avoids
URL echo/Vue rendering. Known session/auth/admin routes retain priority and authorization;
Vercel output guard checks fallback placement. No WAF/security control was relaxed.

Rehearsal creates only its own two fresh loopback PG18 clusters, reads no dotenv/inherited
DB/PG service/Node injection credentials and accepts no arbitrary target/dump. All-row
digests/counts/sequences/indexes/migration replay and actual restored identity/application
paths/log redaction pass. Artifacts are synthetic-only private temp files; this does not
approve a real backup retention/storage/restore or arbitrary supplied database code.
Actual database-down HTTP error is not faked zero data; health stays liveness only. Full
local checks and remaining real/independent gates: docs14/docs32. No certification claim.

## History Recovery Boundary - 2026-10-27

Recovery commands reuse locked revision/current-role/idempotency. Corrections append a
fixed-reason record; originals are not overwritten. Reopening cannot change application
status, restore a withdrawal/rejection/candidate-requested permission or bypass earlier
handoff guards. An operator's correction is not renewed candidate consent. Candidate
projection uses a scoped/bounded history query without raw note/reference/actor data;
older pages are correctly flagged. Local negative/concurrency/HTTP/UI checks pass (docs14).
0008 is additive/local-only; older readers do not understand corrections. Rollback needs
maintenance/compatible readers before reopening affected history, not erased events.
Real privacy/retention policy, shared migration, native acceptance and independent R remain.

## Basic Bot Boundary - 2026-10-27

I01 reuses H3/Zod/Drizzle, adds no SDK/dependency. Webhook remains default-off until full
server-only config is valid. Separate secret header is checked before bounded UTF-8 JSON
or persistence; no browser-origin exception weakens the existing auth handlers. Bot update
ID/username never creates a user/session. Groups/other senders/edited/channel/media updates
do not produce private-data replies. Errors suppress raw SQL/input/config, no provider
token URL is constructed by the runtime. Static webhook replies are not delivery evidence.
Only bot/update IDs/preparation time persist; review retention/abuse/operational policy
before activation. Exact local tests/negative/concurrency/output evidence: docs14/docs28.
No live credentials/menu/send, shared migration or independent security certification.

## Dataset Tooling Follow-up - 2026-10-27

D03 makes already locked TSX4.22.4 an explicit dev dependency for the TypeScript operator
CLI; no runtime framework/major upgrade. Offline install added no downloaded packages,
and frozen install/prepare passed. Fresh full-tree audit remains3 entries (1 high,
1 moderate,1 low), the same known esbuild/node-forge exceptions below. No new advisory,
no zero-vulnerability claim. The CLI refuses cloud/shared DB targets, reads no dotenv,
validates bounded regular UTF-8 JSON and suppresses raw SQL/credential/input errors.
It is a privileged local maintenance tool, not a new public auth endpoint or proof that
the human tax reviewer approved a file. Exact tests/results remain in docs14/docs26.

## Foundation Follow-up - 2026-10-27

Fresh full-tree registry audit on `4e1be73` found 8 advisory entries (3 high, 4 moderate,
1 low; no critical). This is the working lockfile, not the default-branch alert count.
Narrow fixes: Vitest/mocker 5.0.0 -> 5.0.5 within the existing major, js-yaml 4.3.2 and
postcss-selector-parser 7.1.6 range-scoped overrides. Maintainer advisories confirm the
patched ranges; no framework change, audit suppression or force/major upgrade.

After frozen install, full-tree audit reports **3 entries: 1 high, 1 moderate, 1 low**.
The two existing exceptions below remain. The third is esbuild 0.18.20 under
drizzle-kit/@esbuild-kit (GHSA-67mh-4wv8-2f99): development-server CORS exposure.
TalentBay does not run that esbuild server or expose Drizzle Studio; migrations use CLI.
Keep migration tooling local/isolated, never expose Studio, and revisit the parent range
before using its server features. No blind override across esbuild's incompatible minors.

The rebuilt Node output contains no node-forge/fontless imports or package; esbuild
matches in executable chunks are only build-path comments naming patched 0.28.2.
This is local Node trace evidence, not proof about a future hosted build.

Checks at this slice: frozen install, typecheck, lint, 112 unit tests, 37 disposable-PG
tests and 24 tooling tests passed. The first tooling invocation was sandbox-denied on
loopback listen; the authorized loopback rerun passed. Build passed; browser/HTTP checks
are recorded in the execution log when finished. No shared database was touched.

Primary patch references checked 2026-10-27:

- https://github.com/vitest-dev/vitest/security/advisories/GHSA-qxg6-89mg-rqv8
- https://github.com/nodeca/js-yaml/security/advisories/GHSA-2883-xcg3-v3hh
- https://github.com/postcss/postcss-selector-parser/security/advisories/GHSA-rj75-hqrm-r3gf

The following section preserves the previous maintenance slice and its dated counts.

## Dependency changes

| Package | Previous lock | Verified new lock | Reason |
| --- | --- | --- | --- |
| Nuxt | 4.5.1 | 4.6.2 | Maintainer security fixes for route rules and safe head rendering |
| Vue | 3.5.40 | 3.5.44 | Includes patched server-renderer attribute handling |
| Vue Router | 5.2.0 | 5.4.0 | Match the router required by the updated Nuxt |
| Zod | 4.4.3 | 4.6.7 | Oversized constrained-collection validation fix |
| Tiptap core/pm override | 3.29.2 | 3.30.5 | Replace the old vulnerable override with patched compatible versions |
| brace-expansion override | 5.0.8 | 5.0.12 | Follow-up recursion/complexity fixes |

The auth slice already upgraded nuxt-auth-utils 0.5.30 to exact 0.5.32. Node engines now
require 22.22.3 or newer within Node 22, matching Nuxt's minimum; checks use 22.23.1.
Targeted pnpm updates refreshed postcss, nanoid, source-map-js, shell-quote,
serialize-javascript and esbuild within parent-approved ranges. No force/latest major
upgrade, new framework or advisory suppression was used. Lockfile changes include the
new Nuxt dependency tree and compatible transitive updates.

`pnpm audit --prod --json`: before 57 advisory entries (4 critical, 22 high, 23 moderate,
8 low); after 2 (0 critical, 1 high, 0 moderate, 1 low). The production install graph
includes Nuxt's build/dev tooling; these counts are not an exploitability assessment.

## Remaining entries

| Package/path | Evidence and current exposure | Disposition |
| --- | --- | --- |
| esbuild 0.27.7 via Nuxt UI/fonts/fontless | [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr): Windows development server path traversal. Project checks run on macOS/Linux; fonts integration is disabled. No esbuild/fontless package or import reference found in the compiled Node server. | Keep the alert visible. Do not expose this dependency's Windows dev server; update the parent when its range accepts the patch. |
| node-forge 1.4.0 via Nitro/listhen | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv): RSA PKCS#1 verification issue, no patched release listed. No node-forge package or import reference found in the compiled Node server; TalentBay authentication uses provider validation/Node crypto. | Keep the alert visible. Do not introduce forge-based signature verification. Production TLS terminates at the host; revisit the parent/patch before any custom certificate workflow. |

Trace evidence refers only to this local Node output, not a later Vercel/Worker build.
Recheck on dependency changes or another runtime/preset. Absence from this output is not
a blanket claim that a package can never be reachable in another environment.

## Admin authorization

Each admin handler explicitly calls the server guard before domain operations. Middleware
also guards the namespace with case-normalized matching. The guard validates the current
database role/account, so a stale ADMIN session no longer retains revoked access. The
result is cached only within one HTTP request to avoid duplicate middleware/handler reads.

The old compiled server returned 404 for `/API/v1/admin/dashboard`; a case-variant bypass
was **not** reproduced. Smoke now requires a denied/missing result for case variants;
per-handler checks avoid depending on a router's case/path matching for authorization.

Unit tests execute all five real handlers with middleware absent, denying anonymous,
normal and revoked-admin callers before domain operations. A request-cache regression
proves that a second request rechecks the database. PostgreSQL tests exercise role grant,
revocation and missing-account denial.

## Checks

Passed locally: 78 unit/HTTP/OAuth tests, 19 PostgreSQL integration tests, lint, typecheck,
Node build and compiled HTTP smoke. No shared migration or production switch occurred.

Primary references:

- https://github.com/nuxt/nuxt/releases/tag/v4.6.2
- https://github.com/vuejs/core/releases/tag/v3.5.44
- https://github.com/advisories/GHSA-mrhx-c7xc-m3w5
- https://github.com/ueberdosis/tiptap/releases/tag/v3.30.5
- https://github.com/atinux/nuxt-auth-utils/releases/tag/v0.5.32
