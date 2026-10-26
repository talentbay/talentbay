# Application Handling Boundary

Updated: 2026-10-26. The owner supplied the missing product answer: TalentBay receives
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

## Safe Bounded Code Slice

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

## Next Operator Slice (Not Yet Implemented)

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
