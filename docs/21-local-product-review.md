# Interactive Local Product Review

Updated: 2026-10-27. Local engineering review, not public beta or live-provider acceptance.

## Start

Use the locked pnpm dependencies, Node 22 and an already installed PostgreSQL 18.
The launcher looks for its `bin` directory in the usual Homebrew/Linux locations;
otherwise set `PG_BIN` to the existing directory. It does not install software.

```bash
pnpm dev:review
# Optional alternative ports when the defaults are occupied:
pnpm dev:review --port 3132 --portal-port 3133
```

Open `http://127.0.0.1:3131` for account selection; the application runs at
`http://127.0.0.1:3130/jobs`. The portal refuses occupied ports instead of killing servers.
Keep the command running. Ctrl+C stops its Nuxt process group, portal and PostgreSQL.
A restart creates a fresh database; the previous synthetic cluster is retained in the
printed temporary directory, not silently reused. Saved jobs still belong to this browser.

The launcher ignores developer dotenv/cloud credentials, creates its own database,
applies committed migrations, and creates short-lived local credentials in memory.
Standard server-validated Telegram initData and sealed sessions are used with a random
local-only bot key. No external Telegram service or real bot is contacted. The helper
is a separate loopback process, not an authentication bypass route in the application.
Do not tunnel/expose this development environment or use it with real personal data.

## Walkthrough

The account chooser now has a **Start at** selector for each fixed role. It opens the
selected existing screen, not an arbitrary URL or a new privilege. `/bot` is an offline
preview generated from the real five-command contract; links lead to the same local app
and current test session. It does not create webhook receipts, authenticate a native host
or send anything. The real webhook/receipt boundary is tested separately in docs28.

### Five-to-ten-minute review route

1. Open **Offline bot entry preview**: inspect `/start`, then choose **Browse jobs**.
   This is the intended entry copy/link, not an actual Telegram delivery/client test.
2. Chooser -> **New candidate / First application** -> London **Senior Backend Engineer**.
   Read the role/source, save it, open Relocation, enter a salary and inspect costs/source/
   demo limitations. Return to the same vacancy; no invented verified city costs.
3. Apply -> complete the inline fictional contact/profile -> acknowledge the displayed
   package/disclosure -> submit once. **Your applications** shows TalentBay receipt, not
   employer delivery. The optional CV upload is not required or implemented here.
4. Chooser -> **Content operator / Application handling** -> open that newcomer application.
   Assign to yourself, start, record a **fictional** company contact. Preview the immutable
   minimum package; copying/preparing is read-only. Record only a simulated manual handoff,
   then a fictional follow-up/closure. Nothing is actually sent to a company or candidate.
5. Chooser -> **New candidate / Applications** -> review recorded progress. Private notes/
   references must not appear. Withdrawal closes further sharing, not stored history or
   external recall. Existing Candidate has additional in-progress/closed/legacy examples.
6. Download the fictional CSV -> **Content operator / CSV import** -> validate/dry run ->
   import draft -> review/publish -> Jobs. Re-import unchanged and inspect Overview counts.
   **Source registry** is empty pending CEO-approved sources; do not start a real fetch.
   The actual connector/lease/retry/review pipeline is exercised offline with SQL by
   `pnpm test:integration`, including `source-runner`/`lever-import`; CSV is not presented
   as its replacement or as permission to republish real jobs.

Record usability findings against the exact revision. These are guided synthetic actions,
not owner/independent-R acceptance, real consent/outreach, reviewed tax data or a public beta.

| Account | What to inspect | Initial state |
| --- | --- | --- |
| Candidate | Jobs, save, detail, relocation, profile, apply, applications | Complete fictional profile; received, in-progress, handoff, closed and legacy examples |
| New candidate | First profile, empty applications, first application | No profile or applications |
| Content operator | Overview, users, vacancy review, CSV import | Admin limited to this isolated database |
| Guest | Public browsing and local Saved | Clears the current test session |

Candidate sequence:
1. Open Candidate, then Profile. Edit the headline, save and reload.
2. Open Jobs and Senior Backend Engineer in London (not one of the two seeded applications).
3. Save the role. Change annual salary in Relocation preview and inspect the resulting
   monthly estimate. On a narrow screen, open the relocation control from the vacancy.
4. Apply with a fictional cover note. Open Applications and its detail; reload to verify
   persistence. Repeat submissions should not create duplicate applications.
5. Try Saved, job filters and Settings, then switch to New candidate for empty states.

Operator sequence:
0. Overview -> current work / oldest awaiting start / activity-period counts. Counters
   open the same filtered queue with full totals; an oldest ID can be outside first25.
   Retry a failed count rather than interpreting it as zero. Detailed shift, handoff,
   correction and privacy/support checklist: [operator runbook](31-operator-runbook.md).
1. Download the sample CSV from the account chooser, then open Content operator.
2. Vacancies -> Import CSV -> choose file -> Validate file. Preview must show one new
   Data Engineer vacancy and no writes yet.
3. Confirm import. Open the unreviewed queue: the new record is DRAFT / UNREVIEWED.
4. Review its full details, confirm the test content is checked, then Verify & publish.
5. Open public site: Data Engineer is now visible. Overview counts come from this DB.
6. Re-import the same file: it should be unchanged. Altered records require review again.

Application handling sequence: open Content operator -> Applications -> read Senior
Frontend Engineer (received), Platform Engineer (in progress), Product Engineer (synthetic
manual handoff), Staff Fullstack Engineer (closed) and Quality Engineer (legacy). Opening
a record never changes the employer stage. Take the received record, start handling,
record a fictional contact, prepare the snapshot package and separately record a simulated
handoff. Preparing/copying is read-only. Do not actually send anything to any company.
Switch to Candidate -> Applications -> detail: only recorded public facts are visible,
never private operator notes/references. Confirm/cancel/retry withdrawal; it survives reload
and blocks another package/handoff. Legacy has no invented snapshot/permission/history.

History recovery: on Staff Fullstack Engineer, open "Correct or reopen handling", mark
the existing closure revision4 inaccurate with a fictional private reason. Handling stays
closed. Explicitly choose "Reopen and take application" to resume review and take ownership.
Switch to Candidate and inspect both recorded events. On Product Engineer, a correction of
the simulated handoff revision5 must retain the original record and cannot permit another
handoff/package. Withdrawal/rejection/candidate-request closure cannot be reactivated by
these controls. All actions are local fixtures, not actual contact or renewed permission.
Restarting the isolated review creates the initial examples again; retained old clusters
are not production backups. Exact policy/rollback limits are in docs29.

All companies, people and jobs are fictional, even when a record has passed the local
publication workflow. Employer status remains NEW for the handling examples; operator
work is separate from employer viewing/interview/offer. One explicit legacy fixture has
no snapshot. No employer receives any test application.
The relocation dataset is illustrative and does not establish real costs or tax advice.

## Product Audit

Reviewed the existing guest preview and the authenticated/local operator journeys through
the actual UI, plus the public automated viewport suite. Findings are ordered by impact:

| Priority | Step / observed gap | User impact | Next acceptance criterion |
| --- | --- | --- | --- |
| P0 | Manual handling now has a tested synthetic workflow; real operator/data/policy gates remain | Local events do not prove real company outreach or public readiness | Verify approved people/channels/policy and real preview; no automatic sender is claimed |
| P1 | Previous review had no DB/providers; only non-applicable demo roles | Owner could not assess profile, apply or operator functionality | Repeatable local role chooser now works; still needs owner product acceptance |
| P1 | Relocation figures and listings are illustrative | The main value proposition cannot yet support a real decision | Approved source-backed jobs and costs, freshness/provenance and stated calculation limits |
| P1 | Actual Google/GitHub/native Telegram and hosted environment unverified | Local success does not prove real onboarding works | Stable eligible preview, real provider callbacks, native device checks |
| P2 | Saved checkmark was ambiguous; search arrow was off-center | State and interaction quality looked unfinished | Filled/colored bookmark and centered controls implemented and browser tested |
| P2 | Saved is browser-local; progress now has recorded TalentBay events, not an employer funnel | No cross-device shortlist or verified employer-delivery/read history | Keep local Saved explicit and only project actual public handling events; legacy history stays absent |

This review did not redesign every screen, validate financial/legal content, or test
native Telegram, screen readers or all browsers. Existing Nuxt UI/Lucide are already the
component/icon libraries; adopting another library is not a substitute for product work.

The synthetic managed outcome/operator path now exists and is covered by browser/API/SQL
regressions. Next is independent exact-revision review and approved sources/datasets/
policy/providers/native/hosted acceptance. Hosting alone cannot close those gates. Focused
dev chooser/bot preview320px screenshots were inspected; the newcomer profile -> offline
bot -> shared Applications -> operator selector also passed actual local Chromium checks.
