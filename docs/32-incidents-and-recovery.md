# Diagnostics and Recovery

Updated:2026-10-27. F04 engineering procedure; not a production backup/on-call guarantee.
Read docs20 for exact release gates, docs31 for operator actions and docs29 before reader
rollback after correction events. Real provider/data/alert/retention approvals remain H/G05.

## Signals and privacy

- `/api/health` is process liveness only. It does not query PostgreSQL, prove the right
  schema/data, verify OAuth/Telegram credentials or confirm the product is usable.
- A current-ADMIN read of Dashboard and its actual queues is an authenticated DB/schema
  diagnostic, not a public green readiness badge. Check exact environment, current release
  revision and intended data separately. Never remove authorization to let a monitor in.
- Broken/missing PostgreSQL must return an actual error, never a success with fake zero
  counts. A5s connection-establishment bound reduces the old default wait; it is not a
  whole-request/pool/statement deadline or production response-time SLA. Work commands and
  overview queries have their own documented transaction/statement limits.
- App-generated `x-request-id` correlates one request; incoming headers do not choose it.
  `request.completed` has time/method/normalized route/status/duration. Known dynamic
  segments become `:id`/`:slug`; unknown endpoints become `/api/:unmatched`. Raw queries,
  slugs, IDs, bodies, profiles, notes, IPs, cookies, OAuth payloads and credentials are not
  copied. Error source/name/status use allowlists, not a sanitized arbitrary private string.
- Unknown API endpoints get a fixed JSON404/no-store, without echoing the URL or falling
  through the Vue renderer. This prevents renderer diagnostics from copying arbitrary API
  paths. Known routes/module session handlers still take precedence. Unknown/wrong-method
  routes are not invented APIs; no new broad CORS/auth bypass is introduced.
- Bounded operation tags: application.handling, vacancy.file.preview/import and
  source.fetch/preview/import. Results: completed/replayed/invalid/conflict/denied/
  unavailable/failed. A successful validation response can be invalid; a returned failed
  source checkpoint is failed even with HTTP200. No row/contact/reference/source identifiers
  or raw error text. Use completed records for request counts, not both error+completion
  lines. A prepared HTTP result is not candidate/employer message delivery or a new DB event.
- The SQL application journal/source checkpoint remains authoritative. Request logs can
  be lost/duplicated and do not replace audit history. Host/CDN logs, retention, access and
  alert export need real provider review; app redaction alone cannot configure Vercel logs.

## Incident checklist

1. Record time UTC, intended environment/release, affected workflow and bounded request ID.
   Do not paste response bodies, candidate details, connection strings, cookies or archives
   into GitHub Issues/chat. Name the human incident owner through the approved channel.
2. Check liveness, then current-admin read and an allowed representative flow. Health200
   plus dashboard failure means the process is alive but the product is not DB-ready. A
   green build/metadata read is not connectivity/schema/readiness evidence.
3. Inspect fixed-route status/duration/operation result.403 means current access must be
   checked;409 needs revision/history reconciliation; malformed input is not a DB outage.
   Source failure does not mean its jobs disappeared. Never delete data or bypass auth to
   clear the queue. Limit manual sharing/imports while evidence is ambiguous.
4. For a suspected code regression, inspect the exact diff and select a compatible known
   artifact. App rollback does not undo schema/data/candidate sharing. After0008 corrections,
   an older reader can misrepresent history: maintenance/compatible reader first (docs29).
   New indexes0009 do not themselves require data reversal or deleting historical events.
5. If data recovery is necessary, stop relevant writes, agree the exact provider target,
   recovery point, copy exposure and rollback/promotion plan with the authorized owner.
   Restore to a separate isolated target first, never over a live database by convenience.
6. Validate schema/migration history, all relevant data/relations/sequences, publication and
   identity/history invariants, then exercise authorized candidate/operator paths. Restored
   user IDs must not silently bind different people. Rehearse requests after restore rather
   than declaring success from `pg_restore` exit0 alone.
7. Any switch of runtime connection, archive restoration/activation, migration, production
   promotion, domain or secret rotation still requires explicit approval and a rollback.
   Record actual commands/results/time/target/release. Real candidate/outreach reconciliation
   and notification are human-owned; no recall/delivery claim or automatic legal conclusion.

## Repeatable Synthetic Rehearsal

Prerequisites: locked dependencies, tested Node22, already installed PostgreSQL18 and a
Node build. PostgreSQL binaries are found in the same usual locations as local review;
otherwise set `PG_BIN` to the existing `bin` directory. Nothing is downloaded/installed.

```bash
pnpm build
pnpm test:recovery
```

The command accepts **no** source URL, target URL, dump, restore path or credentials.
It creates two new loopback-only clusters on free ports, with a synthetic-only disposable
role/database. It ignores dotenv, inherited DATABASE/NUXT/PG service/Node injection values,
and validates the disposable marker before migration. Existing local review/test/cloud
databases are not cloned, reset or overwritten. A port collision fails safely.

1. Apply committed migrations to the fresh source; run the existing fictional review
   fixture through real HTTP auth/profile/import/review/publish/application/handling APIs.
2. Add a synthetic DRAFT relocation package via the actual bounded CLI, receipts/source
   checkpoint and append-only correction/replay. No external source, provider, candidate,
   company or real tax/cost data is contacted/approved.
3. Stop the writer. Inventory every public/drizzle table with row count and canonical
   all-row SHA256, sequence state and index definitions. Create a custom-format dump with
   no ownership/ACL in the private temporary folder, then restore transactionally into the
   second new empty DB with exit-on-error. No `--clean`/shared destructive restore.
4. Compare the entire inventory, replay committed migrations and compare again. This is
   synthetic evidence, not a generic large-table digest runner or production capacity test.
5. Start the real compiled app on the restored DB, verify permanent identities, correction
   privacy, no repeated handoff and a new profile/apply/withdraw workflow. This checks new
   writes/sequences as well as read-only counts.
6. Stop restored PostgreSQL while the app stays alive. Assert health200 and actual failed
   admin read with a request ID and without fake queue data/connection leakage. Validate
   runtime logs for fixed operation/replay fields and absence of fixture PII/local secrets.
7. Stop both owned apps/clusters in cleanup, then emit PASS. No background process/on-call
   monitor is scheduled. Temporary artifacts are retained for local inspection; the printed
   folder contains only generated synthetic data, not real account credentials.

Do not run arbitrary supplied dumps: restoring executes source-controlled database code.
See official [pg_dump18](https://www.postgresql.org/docs/18/app-pgdump.html) and
[pg_restore18](https://www.postgresql.org/docs/18/app-pgrestore.html) references, checked27Oct.
Filesystem fallback follows documented [Nitro routing](https://nitro.build/docs/routing),
with compatibility verified against this repository's installed Nitro2 runtime/build/tests.

## Real Backup Acceptance Is Separate

Before preview/beta, an authorized human must confirm provider retention/recovery window,
backup scope (schema/data/identities/sequences plus any external blobs/config), encryption,
restricted access, region/storage costs, deletion rules, restoration target and owner/deputy.
Document actual backup and isolated restore evidence, then agree realistic RPO/RTO. No
numbers or retention/legal basis are selected by this synthetic rehearsal. Backups contain
personal data even when the live UI masks it; keep them outside Git/build/PR attachments,
separate from public previews, and use approved storage/access/lifecycle controls. Current
data cascades/history/withdrawal are not an approved erasure policy (G02/G05).

Actual monitoring destination, alert thresholds/recipients, coverage, support channel and
provider outage response remain H02/H04 gates. This document does not assign a perpetual
duty to the CTO/agent or silently enable a paid service.
