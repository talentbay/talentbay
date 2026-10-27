# Private Data and Access Boundary

Updated:2026-10-27. G01/G02 technical inventory and negative-test map. This is not a legal
basis/retention approval, independent audit or permission to load real candidate data.
Use docs31 for operator steps and G05/H for approved texts, recipients and accountable people.

## Access Matrix

All ownership is server-derived from the sealed session's permanent local user ID. A
client ID/email/username does not select another account or establish account linking.
Current ADMIN is read from PostgreSQL, not trusted forever from a stale cookie. Client
route guards are UX only; direct APIs remain the security boundary.

| Resource / action | Guest | Owning candidate | Other candidate | Current ADMIN | Revoked ADMIN |
| --- | --- | --- | --- | --- | --- |
| Public jobs/relocation | Public published/verified/active-company predicate and honest data status | Same public projection | Same | Same | Same |
| Profile GET/PUT |401 | Own local-user profile; validated fields | Only their own profile, never supplied target ID | Own profile, no arbitrary target selector | Own profile |
| Application receipt/Apply |401 | Own account; public non-demo role/contact/acknowledgment/snapshot | Their own independent application only | Acting as own candidate, no impersonation endpoint | Same ordinary candidate rule |
| Application list/existing-per-vacancy |401 | Own IDs/status/note and vacancy projection | Their own list; other's existence not returned | Own candidate list; operator list is separate | Own list only |
| Candidate progress/withdraw |401 | Own row; public event allowlist, bounded pages; withdrawal not deletion |404, no existence/detail/history disclosure | Only own candidate endpoint; use operator boundary for back office | Own only |
| Admin queues/details/dashboard/source/import/review |403 |403 |403 | Current database role required on each request |403 despite old ADMIN cookie |
| Operator assignment/handling/correction/reopen |403 |403 |403 | Current role, revision/UUID/transaction locks; required current assignee for work |403 |
| Candidate package preview |403 |403 |403 | Assigned current ADMIN + eligible immutable snapshot + active/unchanged company/role + no prior handoff/withdrawal/closure |403 |
| Provider linking |401 | Current session + same-origin + supported provider + server-sealed short intent + provider proof | Cannot choose target account; no matching-email auto-merge | Same account proof, no superuser linking shortcut | Same own-account proof |
| Bot webhook | Separate header secret before body/DB, not session auth | No private application reply | Same | Same | Same |

The actual SQL+HTTP regressions cover ownership, stale/revoked role, explicit linking
conflicts, snapshots/correction/withdrawal/concurrency and private field projection. They
do not prove an external provider callback, native WebView or company process is approved.
An assigned current ADMIN may prepare the minimum package but no in-app endpoint sends it.
An operator correction is not renewed permission; ever-recorded handoff still prevents a
repeat and may have external copies (docs29). Admin is a trusted broad back-office role,
not multi-tenant employer access; no new hierarchy/impersonation service is added.

## Request / Response Controls

- Profile writes: same-origin, uncompressed application/json, fatal UTF-8,64KiB raw body
  before JSON parse, strict allowlisted profile fields/lengths/HTTP(S) URLs. A70KB whitespace
  JSON body must be413, not accepted before schema validation. Identity/role/email/passport
  fields are not a profile update API. All supplied user IDs are rejected, never followed.
- Linking intent writes: same-origin,2KiB bounded JSON and strict GOOGLE/GITHUB provider
  input. No arbitrary subject/userID/role; missing provider configuration remains503, not
  a successful local link. Normal actual provider proof/short sealed intent remain unchanged.
- Existing other writes use their focused bounded parsers/strict schemas; see docs22/25/28.
  Authorization comes before body/resource work as appropriate; the bot uses its independent
  server secret before parsing. Unknown API routes remain fixed JSON404, not a Vue page.
- Early private cache middleware covers session/auth/profile/application/admin paths and
  per-vacancy application state, including failures and redirect responses. Anonymous
  relocation calculations also use no-store because the response repeats the input salary;
  this is a cache boundary, not a new requirement to sign in. Public positive
  listing caching is not silently disabled or enabled by this classifier.
- Installed Nitro2's default error handler deliberately replaces404 cache policy with
  no-cache and can include raw URL/message/data; relying only on an earlier header is not
  sufficient. A prepended **API-only** error handler sends no-store, fixed JSON4xx/5xx and
  standard defensive headers. Valid HTTP status is preserved; response excludes URL/stack/
  input/SQL/cause/validation values. Nuxt's original HTML renderer remains next in the chain
  for non-API pages. Actual compiled handler order and live HTTP negative tests are evidence,
  not a guessed framework API. No global disabling of Nuxt SSR/errors/auth is involved.
- API failure JSON is `error/statusCode/statusMessage/message`; messages are fixed categories.
  Clients use HTTP status and their contextual copy, not raw database/provider text. Detailed
  CSV validation reports remain explicit successful domain responses, not raw thrown errors.
- App logs are normalized/allowlisted per docs32; framework's default raw API error logger
  is not reached after this API handler sends the response. Hosting/CDN logging/access/
  retention must still be reviewed in H02. No PII/cookies/traces from real people in PR artifacts.

## Stored Copies and Exposure

| Store | Actual contents / duplication | Access / lifecycle today |
| --- | --- | --- |
| users / oauth_accounts | Name, nullable email/avatar, provider subject/email, timestamps, role | Permanent local identities; own session + privileged registry/provider resolution; no auto TTL |
| candidate_profiles | Headline/about/location/contact/professional links | Own edit/read; current ADMIN application detail may expose legacy current profile; no CV/passport upload |
| applications | Owner/role relation/status, optional cover note, immutable versioned submitted profile/contact/company/vacancy snapshot | Candidate's own list/progress, current ADMIN detail/package; future profile edits do not update old submissions |
| application_handling_events | Internal actor/revision/UUID/digest, fixed event data, private reference/note/times | Internal journal versus explicit candidate projection; corrections append, not erase original; free text may contain PII despite operator guidance |
| source_imports | Bounded public-job snapshot/report/checkpoint and operator reference | Admin only; expiry is execution eligibility, **not** physical deletion/approved retention. No approved live source yet |
| relocation snapshot | Dated city assumptions/cost/review metadata and import actor reference | Public model fields versus private review/import identity; no candidate salary input persisted in this dataset |
| bot_entry_receipts | bot/update/prepared time only | No raw chat/name/message/profile/token; dedupe record, not proof of delivery; retention policy pending |
| Sealed session / link intent | Session cookie plus temporary server-sealed linking proof | HTTP-only browser/WebView cookies, not shared between separate cookie stores; provider credentials server-only |
| Client memory / local storage | Private profile/application/edit/financial state in memory; Saved slugs/job preferences/theme device-local | Resource account reset; no private application/profile/salary localStorage or navigation URL history. Saved is not account sync and may outlive sign-out on this device |
| Logs / traces / backups / manual packages | Potential extra copies outside the main UI | App diagnostic allowlist, synthetic-only test traces; real platform logging/backup and manual recipient policy must be approved separately |

"Immutable submission" means history is not casually overwritten by profile edits; it
does **not** establish indefinite retention or prohibit a legally approved privacy process.
Snapshot copies include original contact information and a cover note, not just a pointer
to the current profile. Removing the current profile alone cannot implement an export or
erasure request. No automatic renewal of sharing permission follows a changed profile.

Calculation requests currently use GET query parameters (`location`, `annualGross`). They
are not page-navigation history or persisted TalentBay salary records, and app logs strip
queries; browser network tools and provider/proxy logging can still observe them. No-store
does not erase such metadata. This exposure needs the real H02/G05 logging/privacy decision
(including whether to change the transport before real use); do not claim financial input
never leaves the browser or is absent from every possible provider log.

## Cascades and Privacy Work Procedure

Current legacy foreign keys cascade user -> profile/provider identities/applications and
application -> handling events; vacancy deletion can cascade applications, while company
deletion is restricted by vacancies. Actor/assignee/reviewer/import references commonly
SET NULL. Therefore **do not manually delete a user/vacancy** as a privacy shortcut: it can
destroy application/history evidence, while external copies/backups may still exist.
Import workflows retain application-linked IDs; no new destructive migration/delete API
is introduced here. Future erasure/redaction must explicitly reconcile these relationships.

1. The owner names the privacy decision-maker, approved support channel and actual policy.
   These are not currently designated/approved by this technical inventory. The basic bot
   is not a support inbox and does not collect privacy requests automatically.
2. Verify the requester's authenticated account/authority via the approved human process;
   a request ID, matching username/email or copied passport is not enough. Do not collect
   passport/CV data merely to fill this procedure. Record minimal scope/reference privately.
3. Inventory exact copies by permanent local user/application IDs: current profile,
   submission snapshots/notes/events, provider rows, manual recipient records, platform
   logs/backups and any local/operator exports. Do not post that inventory in public issues.
4. Decide correction/export/redaction/deletion/retention exceptions and recipient follow-up
   with the authorized policy owner. No legal basis, response deadline, tax jurisdiction
   or retention interval is invented by the implementation agent.
5. Design/version/test the approved operation on isolated synthetic copies first; define
   audit-preserving handling, cascades, backup lifecycle and verification/rollback. Review
   exact target and authorization before any shared write. There is currently **no** shipped
   privacy export/delete/disconnect endpoint or enabled UI pretending that this is automatic.
6. Execute only the approved scope through the accountable human process and record actual
   completion/limitations. Withdrawal stops new in-app sharing, not storage or external
   recall. App rollback is not DB erasure/restoration. Request closure cannot be inferred
   from the successful local technical tests in this branch.

## Evidence / Remaining Gates

Negative-test matrix is in `tests/e2e/private-boundaries.database.ts`; earlier receipts,
handling/provenance/identity suites remain required, not replaced by this new file.
First compiled regressions reproduced no-cache401/404 and accepted70KB whitespace body;
implementation fixes and full checks are recorded in docs14 only after they actually pass.
No source permission, legal approval, independent R, native acceptance or production
deployment follows from this inventory. G03 test-target/volume/concurrency and remaining
E/G/K1 remain separate work; G05/H must approve real data and operational/privacy texts.
