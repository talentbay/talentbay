# Release Readiness

Updated: 2026-10-27. This is an engineering checklist, not production acceptance.
The active scope is one responsive Nuxt web/mobile/Telegram product, not token/payments.

## Code Progress - 2026-10-27

#38–#51 have both CI jobs SUCCESS; integration is fecfb57, main/production unchanged.
F01/F02 now pass local176unit/88SQL/25tooling/types/lint/Node/smoke/full28DB. Metric
dictionary/drilldowns/oldest work and F03 operator runbook are in docs30/31. Public18/19
found intermittent relocation input loss; unchanged focused10/10 is not a fix, and the
next E02/E03 hydration follow-up remains a local acceptance blocker. F04/remaining E/G,
independent R and all real data/provider/support/privacy/production gates remain open.
Managed Apply now has a versioned acknowledgment, immutable profile/vacancy snapshot,
operator assignment/contact/manual-handoff records and owner-only public event history.
First-time profile completion returns to the same Apply. These facts supersede the older
read-only-only application boundary below; they are not actual employer delivery/read
receipts, a complete timestamped hiring funnel or approved real data sharing. Event
correction/reopen follow-up now passes local173unit/85SQL/26DB/19public/types/lint/Node/
smoke and25tooling. Append-only originals remain; candidate-requested closure is not new
consent and ever-recorded handoff cannot be silently resent. Native/owner/R acceptance
and real operational policy remain separate; detailed evidence/rollback is in docs29/docs14.

The first Lever connector/durable source runner is offline-fixture/real-SQL tested; the
approved-source registry is empty and no live fetch/cron is activated. Public vacancy
pagination and C03 admin queues are complete in code, with their own CI. C04 provenance
and D01/D02 math/contract also passed their own CI. D03 local package importer/snapshot
guard passes own CI, not shared execution/real dataset acceptance. D05 outcome/source/
assumption UX passes local159unit/78SQL, full19public/23DB and final focused2public/3DB,
types/lint/Node/smoke. Figma read works, draft writes are read-only; no new freeze exists.
Owner confirms no approved real source pages yet; CEO clarification remains necessary.
Basic I01 entry webhook now passes local172unit/80SQL/25tooling/types/lint/Node/smoke,
full19public/25DB and Vercel Node22 output guard. It is default-off; no real Telegram bot,
menu/webhook change or actual delivery is verified. docs28 defines semantics/setup/rollback.
Remaining UX/operations/security, independent R and real provider/data/
native/hosting/legal/owner H gates remain. No complete/accepted/deployed MVP claim.
Exact slice commands/revisions/results: docs14. Provider facts below remain dated26.10;
they were not silently refreshed by writing this section.

## Historical Code Baseline - 2026-10-26

The following inventory/limits describe the dated26.10 baseline, not newer workflow gaps.

| Area | Evidence | Remaining acceptance |
| --- | --- | --- |
| OAuth/security/identities | Focused PRs #26–#29, migration 0002, own CI passed | Real provider callbacks and controlled deployed login/linking |
| Responsive Candidate | #30 `5ab3164`, own CI 40242019559 passed | Native Telegram/mobile browser acceptance on stable HTTPS origin |
| CSV/import/review/metrics | #31 `b99776f`, own CI 40245116366 passed | Approved source data and deployed operator journey |
| Admin bootstrap | Exact local user ID or existing unique email; dry-run/apply tested on disposable PG | Approve intended existing account/environment, then apply outside tests |
| Backup/restore mechanics | Synthetic PG 18.6 dump restored to a second isolated cluster; table inventory/counts/all-row digests matched for 9 tables; 32 workflow tests and repeat migration passed there | Actual preview backup/restore and production retention/owner policy |
| Vercel output | Local `NITRO_PRESET=vercel` build and inspection passed; one real Node 22 bundle, 59 route entries | Provider build/runtime/log checks, entitlements, secrets and deployment protection |

All product PRs above remain unmerged/undeployed at this entry. CI is not independent
human review; browser host simulation is not a real native Telegram test.
Saved remains browser-local; relocation data remains explicitly illustrative. Current
application statuses are not a timestamped funnel. No delivery/traffic analytics are invented.

**Product acceptance correction, 2026-10-26:** the small application-review follow-up adds
an operator read-only queue and candidate withdrawal. No employer inbox,
employer delivery or response loop is implemented. This is an unfinished product journey, not just a provider/deployment
gate. The owner has now selected TalentBay-managed intake and manual company outreach.
Before beta, implement its handling records, approved data-sharing step and follow-up;
do not mark a submission delivered merely because TalentBay stored it.
The owner has not accepted the current experience as a complete MVP.
See [local walkthrough and prioritized gaps](21-local-product-review.md).

## Current external state

Read-only provider refresh and public domain request on 2026-10-26:

- `talentbay.org`: HTTP 404, `x-vercel-error: DEPLOYMENT_NOT_FOUND` at 02:35 MSK.
  Do not overwrite DNS or assume the domain belongs to the accessible project.
- Vercel project `prj_lHZmzknETqd40Hag5xPRACGgynU9`, personal scope
  `team_cjyqd17DfaDhcsylDIgQmBTl`: Hobby; no TalentBay Git link/origin connection.
  Returned latest deployment is old, not this implementation.
- All known Neon branches are archived: production `br-proud-poetry-as21qww0`, preview
  `br-jolly-glade-ash2y5iy`, integration `br-restless-rice-asthw10g`.
  Metadata access does not prove SQL/schema/data readiness. Nothing was restored or written.
- Project Node metadata is 24.x. Package `engines.node >=22.22.3 <23` overrides that setting;
  Nitro's generated function metadata is verified `nodejs22.x`. This removes the need to
  change dashboard settings merely to obtain a local 22 bundle, **not** the requirement
  to verify actual provider build/runtime after deployment.
- Real OAuth credentials/callbacks, bot configuration and domain ownership have not been
  revalidated. No secrets were read out, rotated or copied into artifacts.

[Vercel Node version precedence](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions),
[Nitro Vercel runtime selection](https://nitro.build/deploy/providers/vercel).

## Hosting decision

Hobby does not permit commercial use or connecting this private GitHub organisation
repository. Deploying with CLI does not waive the terms. The owner was asked for a budget;
no Pro/trial/paid resource was enabled. Pro currently starts at $20/month before usage and
taxes; review spend controls and the actual checkout before enabling it.
[Hobby](https://vercel.com/docs/plans/hobby), [private Git](https://vercel.com/docs/git),
[pricing](https://vercel.com/pricing).

Until a valid hosting/budget decision exists, do not silently change platforms, expose the
private repository, move the domain or label an internal technical demo a commercial beta.
Continue independent code/tests/docs; do not start a second infrastructure migration.

## Controlled preview sequence

1. Confirm eligible target scope/project and stable preview origin. Retain deployment/API
   protections; do not disable them merely to make a test pass.
2. Approve restoration of **preview only**, or a separate isolated preview branch. Confirm
   branch ID before provisioning a compute/SQL connection; do not point tests at production.
   Inspect runtime/schema/migration history read-only before any schema change.
3. Take a recoverable preview backup/snapshot first. Store sensitive backups outside Git,
   chat and CI artifacts. Record rollback target and retention. Apply only committed
   migrations separately, never as a build hook; migration 0002 is backward-compatible,
   but an old application may not support new Telegram-only accounts after rollback.
4. Provision environment-specific session secret, DB URL and optional OAuth/bot credentials
   using provider stores. The runtime does not need migration credentials. Never use the
   same preview and production DB/session secrets by accident or place them in PR CI.
5. Deploy the approved exact revision without production traffic/domain assignment.
   Prefer one Git integration; do not race it with an Actions deployment pipeline.
   Keep production promotion manual until real CI/review deployment gating is verified.
6. Verify the real built Node major, liveness, SSR jobs, public/hidden content, source
   markers, structured request IDs/logs, private no-store responses and auth/admin denial.
7. Configure exact OAuth callbacks for the stable HTTPS origin. Test real provider login,
   explicit linking/conflicts, sign-out and account isolation. Keep separate GitHub OAuth
   Apps when different environments require distinct fixed callbacks.
8. Configure the intended bot's Mini App URL/menu using its authorized owner/provider
   console. Test initial launch, expired launch data, browser fallback, native back/theme/
   safe areas, deep links and slow/repeated opens in actual Telegram clients.
9. Bootstrap an approved existing local admin through dry-run → apply → sign-in refresh;
   load permitted content via CSV → preview → draft → review → publish. Verify withdrawal,
   archive and linked applications. No synthetic fixture presented as a real employer.
10. Record results in [acceptance record](15-mvp-acceptance-record.md). Only then request
    public beta approval and domain/promotion operation with rollback evidence.

## Rollback boundary

- Content: archive the exact record, confirm public list/detail/resolve/apply no longer
  expose it; retain linked applications. Source corrections re-enter draft review.
- Privilege: revoke the current DB role in an approved transaction and verify old-session
  admin APIs fail. Do not rotate all user sessions by default merely to fix one role.
- App: use an explicitly selected known-good deployment in the confirmed owning scope;
  app rollback does **not** restore database data or schema.
- DB: restore to an isolated branch/cluster first, check inventory, migration history,
  constraints, sequences and representative workflows. Switching live DB URLs is a
  separate release operation, not a side effect of a backup command.
- Never reverse migration 0002 by dropping identities/null-email users as an easy rollback.
  Preserve existing accounts/profiles/applications and prefer a reviewed forward fix.

## Repeatable build checks

CI runs normal Node build/smoke/browser checks first, then a separate **build-only** Vercel
adapter check. It uses no Vercel token, project linking, cloud DB, deployment or paid plan:

```bash
NITRO_PRESET=vercel pnpm build
node scripts/assert-vercel-output.mjs
```

Inspection checks output version, required Candidate/auth/admin routes, actual function
bundles/handlers, Node 22 runtime and the static CSV template. Generated `.vercel/output`
is ignored and must not be confused with a deployed preview. Do not publish env files,
authenticated browser state or real-user traces as build artifacts.

Local restore rehearsal used only generated synthetic records, two loopback PG 18.6
clusters, `pg_dump --format=custom --no-owner --no-acl` and `pg_restore --exit-on-error` into
a new empty DB. Both clusters were stopped afterward. Initial sandbox initdb failed to
allocate shared memory and was rerun with approved local-process permissions; one test
run encountered transient loopback `EADDRNOTAVAIL`, isolated and full reruns passed without
test weakening. This is not proof that an actual Neon backup is restorable or a promise
of an RPO/RTO. Those require their own environment-specific evidence.
