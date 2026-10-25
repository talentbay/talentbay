# Security maintenance review

Date: 2026-10-26. Scope: repository dependency graph and admin authorization; this is not
a penetration-test certification or evidence of a production deployment.

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
