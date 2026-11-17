# Database Verification Boundaries

Updated:2026-10-27. G03 synthetic evidence; not a production capacity certificate or
permission to migrate a shared environment. Run `pnpm test:integration` locally with
already installed PostgreSQL18. Direct integration config requires the disposable guard.

## Safe Entry and Upgrade

The default command no longer loads `.env.integration`. It creates a fresh owned loopback
cluster from a clean child environment, runs upgrade verification and all SQL tests, then
stops its own database. No existing-target/env-file/credential arguments, installation or
cloud calls. Stage timeout180s and SIGINT/SIGTERM stop the owned child group, await cleanup
and return failure; no false PASS on cancellation. The existing recovery helper supplies
the same owned-cluster/environment boundary, not a second database manager.

Vitest's config invokes the guard before collecting test modules. An explicit shared URL
is rejected with no credential echo. The guard checks both URLs, marker, role, DB, loopback
host and URL options; it is an operator safety boundary, not proof that an arbitrary local
tunnel/name could never reach another environment. Do not falsify its marker to use cloud
data. A manual approved Neon run still needs a verified target adapter and H approval.

CI uses its empty runner-only PostgreSQL18 service. `migration-upgrade.mjs` refuses any
existing public/drizzle table, never drops/resets one. It applies exact committed0000/0001
through the installed Drizzle migrator, seeds six legacy table types, applies all remaining
migrations, verifies original field values/IDs/provider/profile/application relations,
null snapshot/zero revision/no invented events, nullable-email Telegram identity, exact
all-row/sequence/index equality on replay, then removes its synthetic fixture rows. The
full current suite follows. Fresh-all-migrations and full restored replay are also
exercised by `test:recovery`; these are complementary starting states, not a shared DB test.

## Concurrency and Representative Volume

Existing focused SQL tests retain actual competing transactions for:

- first identity resolution and Apply uniqueness, repeated withdrawal;
- two operator revisions/assignment, share versus withdrawal, correction/reopen versus withdrawal;
- reverse multi-company imports/atomic rollback, unchanged/changed publication and preserved IDs;
- source-run lease/checkpoint/retry/stale preview/role revocation while fetch is in flight;
- relocation stale revision/revoked actor/concurrent apply and bot update receipt uniqueness.

`representative-volume.test.ts` adds5000 synthetic vacancies,1000 applications/receipt events
and mixed publication/review states. It walks all matching public pages without gaps or
duplicates, checks totals against SQL and bounded payloads (50 rows/<128KiB per page),
admin25-row pages, dashboard oldest5 and private projection. It checks actual unique/search/
time index presence and runs an actual selective GIN query plan without forcing planner
settings. Synthetic records are scoped/cleaned; none are real vacancies or candidates.

One local observed run:3428 public matches, full cursor walk plus queues/dashboard3502ms;
selective direct FTS plan1.205ms with the GIN index observed. Hardware/cache/data/distribution
are specific to that run; no percentile, concurrency throughput, production latency or
Vercel/Neon SLA follows. Public search also ORs company/skills terms across a join, so the
selective direct FTS index probe does **not** prove that the complete public query always
uses GIN. Add real distribution/latency monitoring before changing indexes or architecture.

## Rollback and Open Gates

Do not reverse these migrations by deleting enum values, rows, snapshots or history. Older
application binaries may not understand Telegram/null email, CORRECTED/REOPENED, provenance
or dataset metadata after new writes; restore/promote only a reader compatible with those
facts (docs29/32). Old rows preserved after upgrade does not mean every old binary is safe.
Raw legacy cascades remain documented in docs33, not endorsed as an erasure process.

No schema/dependency change is introduced by this slice. Shared migration/backup/restore,
real data, native hosts, policy and independent R remain release gates. Exact final command
outcomes and delivery ref are in docs14; task contracts are not completion marks.

References checked27Oct: [Vitest lifecycle](https://main.vitest.dev/guide/lifecycle),
[Drizzle Postgres.js migrator](https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/src/postgres-js/README.md).
Installed versions and actual tests take precedence over examples for a different major.
