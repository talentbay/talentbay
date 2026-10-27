# Application Handling Boundary

Updated: 2026-10-27. The owner supplied the missing product answer: TalentBay receives
applications, contacts the company and proposes the candidate. The company is also a
potential client for further cooperation. This supersedes the earlier open routing choice.

## Confirmed Product Decision

The MVP uses **TalentBay-managed applications and manual company outreach**, not a default
redirect to a source site. An employer account is not required for the first conversation.
The candidate submits to TalentBay; the team handles contact and follow-up. This establishes
the business process, not proof that an employer has already received any particular CV.

At submission, confirm receipt by TalentBay and explain the next step. Only a recorded,
actually completed handoff can justify saying information was sent to the company.
Do not guarantee an employer reply, interview, hire or fixed turnaround time.

Source: direct product clarification supplied by the owner in this chat, 2026-10-26.
It is not approval to send a real candidate's data or contact companies from this agent.

## Evidence and Product Intent

The supplied founder conversation and existing MVP/design documents support these points:

- The first product is Web2 jobs plus an understandable relocation outcome, not token
  mechanics. The candidate should understand the role and what remains after moving.
- The intended product journey is browse -> evaluate relocation -> profile -> apply ->
  follow the application. The consolidated Candidate handoff includes Applications and
  defines VIEWED as employer viewing, not an internal administrator reading a record.
- The founder's longer-term vision is full interaction between candidates and employers.
  His future provider/guarantor language is not a technical or legal guarantee in this MVP.
- Early vacancies may be populated by administrators from real sources; early employer
  self-service/participation is not mandatory. This describes content acquisition, not
  permission to send personal data or an agreed mechanism for delivering applications.
- Before the clarification above, the preserved sources did not specify who receives
  imported-job applications. That gap is now resolved at the product-model level.

Sources: user-supplied founder excerpts in this chat; historical `docs/01-mvp-scope.md`
(Candidate, Company and Success Criteria); current `docs/plan.md` and Candidate handoff.
Obsidian's canonical project map/roadmap and the two reconciled October context packages
were also read. These are partial preserved sources, not a claim to possess the full CEO
conversation. Old targets and long-term ideas are not silently promoted into new scope.

**Consequence:** retain the common in-product profile/application journey and build the
minimal operator workflow around it. Internal registration alone does not prove delivery.

## Earlier Bounded Code Slice (2026-10-26)

The current branch adds an administrator read-only application queue and owner-scoped
candidate withdrawal. The current follow-up clarifies receipt/preflight/detail copy for
the confirmed managed model; it does not implement a send service or outreach event log.

- Queue: current ADMIN only, at most 25 records, status filter and keyset pagination.
  List responses omit email, cover note and contact details.
- Detail: existing current profile and cover note, visible only to an authorized ADMIN.
  The profile is not an immutable submission-time snapshot. Safe HTTP links only.
- Opening a record has no write side effect and cannot set VIEWED or another employer
  stage. No review/forward/status-mutation endpoint is added for administrators.
- Withdrawal: candidate confirms, can cancel/retry, and closes only their own application.
  The row and cover note remain; withdrawal is not privacy erasure. Existing uniqueness
  means no second application to the same role, stated before confirmation.
- Same-origin bounded strict JSON, current-role checks, no-store responses and ownership
  protect APIs. Concurrent withdrawal retries serialize using an application row lock.
- No email/bot message, export, employer forwarding, automated ranking, hiring decision,
  personal-data sharing or invented timeline. No new schema/dependency is required.

This small inbox/modal uses existing Nuxt UI/tokens; it is not the deferred admin redesign
or a new approved Figma freeze. Candidate withdrawal is an explicitly documented addition
under the owner's design mandate, not evidence that external hiring is functional.

An earlier uncommitted experiment mapping administrator review to VIEWED was removed:
it conflicted with the existing employer-status contract. Tests now protect the absence
of that mutation and preserve the distinction. No such change was merged or deployed.

## Handling Contract v1 (TB-B01, Application Part of TB-E01)

Engineering contract under the owner's implementation mandate; notice copy still needs
the G05 policy/real-data gate before public use. It is not a new approved Figma freeze.
Use current Nuxt UI/Lucide controls and existing responsive shell, not a full admin redesign.

Minimum new package: a saved profile, name and at least one usable email, phone or Telegram
username. A professional link alone cannot be used to contact the candidate. No CV file
or invented provider email is required. Server captures profile/contact and the specific
vacancy/company/source from PostgreSQL, never from client-supplied identity/recipient fields.
The immutable snapshot records notice version `talentbay-managed-v1` and submission time.
Acknowledgment explicitly asks TalentBay to contact that company and share this application
for that role. It does not claim legal consent approval, delivery, reading or guaranteed work.

| Action | Actor / preconditions | Handling result | Candidate-visible fact / negative case |
| --- | --- | --- | --- |
| Submit | Candidate; public verified non-demo role, profile/contact, current notice + acknowledgment | RECEIVED + snapshot + receipt event atomically | Received by TalentBay; invalid/missing contact/version rejected, double submit cannot duplicate |
| Assign | Current ADMIN; expected revision, target is current ADMIN | Assignee changes, stage unchanged | Private operation; stale read or revoked target rejected |
| Start | Assigned current ADMIN; active record | IN_PROGRESS | TalentBay working on application, not employer VIEWED |
| Record contact | Assigned current ADMIN; IN_PROGRESS or CONTACTED; channel/time/private reference | CONTACTED | Team recorded company contact, not candidate data delivery |
| Preview/copy package | Assigned current ADMIN; valid snapshot/notice, active unchanged public vacancy/company | No write | No delivery event; legacy/withdrawn/changed-recipient blocked |
| Record actual sharing | Assigned current ADMIN; CONTACTED, eligible package, explicit manual confirmation/channel/time/reference | SHARED | Operator recorded a handoff; not verified delivery/read. Replay yields original event |
| Follow up | Assigned current ADMIN; CONTACTED/SHARED/FOLLOW_UP | FOLLOW_UP | Team following up; free-form notes/references remain private |
| Close | Assigned current ADMIN; active stage, bounded outcome reason | CLOSED | Reason from allowlist, not employer rejection or hire |
| Withdraw | Owning candidate; existing record; row lock | WITHDRAWN employer field, CLOSED handling + event | Stops further in-app sharing; cannot recall previous external handoff; retry no duplicate |

Every operator command has actor/time, UUID idempotency key, expected revision and a
bounded strict body. Same key with a different command is a conflict, not a silent update.
Reads never mutate status. Row locks serialize handling, withdrawal and handoff; vacancy/
company checks serialize with archive/re-import. Operator writes must recheck current role.
Employer stages remain separate: no internal action writes VIEWED/INTERVIEW/OFFER/REJECTED.

Candidate events expose only allowlisted kinds, times and close reasons. Never expose
operator identity, notes, recipient contact, references, command digests or internal errors.
Legacy snapshot stays NULL; do not fabricate history or forward the current profile as an
old submission. Retention/redaction is a separate approved procedure, not infinite PII storage.

### Focused Flow / State Matrix

Guest detail -> sign-in -> profile/contact -> same role's Apply -> named company + contact/
profile preview -> optional note -> unchecked explicit acknowledgment -> Submit -> receipt.
Candidate may cancel; input is retained in memory on retry and cleared on account switch.
No contact -> profile action; profile read failure -> Retry; stale role -> unavailable;
duplicate -> existing application. Narrow modal scrolls, footer controls stay reachable;
wide layout uses the same controls and state owner. No separate Telegram journey.

Operator queue -> read detail -> legacy warning OR submitted snapshot -> take/assign ->
start -> contact -> prepare package (read only) -> explicitly record completed manual share
-> follow up/close. Conflict retains draft and offers reload; no silent resend on refresh.
Candidate Applications -> detail -> actual recorded progress -> withdraw confirmation/cancel/
retry. Recorded handoff is explained separately after withdrawal. Focused prototypes and
narrow/wide screenshots are implementation evidence, not owner acceptance.

Remaining E01 relocation sketch/data contract is independent of this application contract
and remains open; application implementation uses the focused state matrix above.

## Implementation Boundary - 2026-10-27

The focused workflow is now implemented for synthetic verification: assigned-operator
commands, snapshot package preview/copy, explicit recording of a completed manual handoff,
private journal, public event projection, candidate application/history keyset pages and
withdrawal serialization. All these operations use the existing PostgreSQL monolith.
No email/bot sender, public profile export, employer read receipt or external contact is
performed by these endpoints. B09 browser/fixture acceptance and actual check results are
tracked in execution log; this is not an independent audit or public release.

Package preview and handoff recheck the public vacancy/company revisions captured at
submission. Missing revisions, legacy, withdrawn/closed, changed/re-imported or unpublished
records are denied rather than silently substituting a current recipient/package. The
current app stops further package access after withdrawal; it cannot control a human's
previously copied information outside the app. One handoff is recorded per application;
correction/re-sharing requires a future explicit reviewed workflow, not another send key.

The points below preserve the earlier follow-up checklist; real operational/policy gates
are still open even where the corresponding synthetic code now exists.

## Subsequent Operational Work

1. Separate TalentBay handling from employer hiring stages. Record actual company contact
   and candidate-information handoff with operator, time and a bounded reference; opening
   the application must never set employer VIEWED.
2. Before sharing, show the candidate what is being shared, with which company and for
   what purpose. Define consent and the retained application snapshot with the approved
   privacy/terms; do not treat old submissions as silently granting new permissions.
3. Provide an actionable operator queue and expose only truthful progress to the candidate.
   Distinguish a manually recorded handoff from confirmed receipt/read by an employer.
4. Specify who performs outreach/follow-up, the communication channel and handling of
   unavailable companies/withdrawals. No person, staffing level or SLA is assigned by code.

Manual outreach can exist outside the app, but it is not an implemented automated delivery
feature. Actual employer contact, personal-data sharing and a production release were not
performed. The local review remains an explicit synthetic environment.

The withdrawal uses the existing transaction pattern and the
[Drizzle transaction API](https://orm.drizzle.team/docs/transactions), checked 2026-10-26.
