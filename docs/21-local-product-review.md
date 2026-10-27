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
| P2 | Saved is browser-local; current status has no event history | No cross-device shortlist or end-to-end application timeline | Keep current behavior explicit; do not imply delivery/sync or fabricate events |

This review did not redesign every screen, validate financial/legal content, or test
native Telegram, screen readers or all browsers. Existing Nuxt UI/Lucide are already the
component/icon libraries; adopting another library is not a substitute for product work.

Next work is a complete, truthful candidate outcome and its operator/recipient side,
then source-backed content and wider UX acceptance. Hosting alone cannot close these gaps.
