# Security maintenance review

Updated: 2026-10-27. Scope: repository dependency graph and admin authorization; this is not
a penetration-test certification or evidence of a production deployment.

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
