# Application Handling Boundary

Updated: 2026-10-26 after the owner asked to recover the CEO/product philosophy before
choosing external application routing. No external-vs-managed model is approved here.

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
- No explicit agreement was found that all applications leave TalentBay, or that the
  team becomes a staffed manual recruitment/forwarding service for every imported job.

Sources: user-supplied founder excerpts in this chat; historical `docs/01-mvp-scope.md`
(Candidate, Company and Success Criteria); current `docs/plan.md` and Candidate handoff.
Obsidian's canonical project map/roadmap and the two reconciled October context packages
were also read. These are partial preserved sources, not a claim to possess the full CEO
conversation. Old targets and long-term ideas are not silently promoted into new scope.

**Consequence:** an external-source Apply path is an option to discuss, not an adopted
product direction. Internal registration alone is equally insufficient to claim delivery.
Do not replace the intended end-to-end product with a pure aggregator for convenience.

## Safe Bounded Code Slice

The current branch adds an administrator read-only application queue and owner-scoped
candidate withdrawal. It does not implement or choose the missing delivery model.

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

## Questions To Resolve With The CEO

1. For a vacancy whose company has not joined TalentBay, what exactly happens after Apply,
   who receives it, and what evidence lets us tell the candidate it arrived?
2. Is the first release intended to complete the application inside TalentBay, or may a
   clearly labelled source handoff complete it temporarily? This is a product choice.
3. If TalentBay accepts applications, who operates the receiving/response process before
   employer accounts exist, with what permission and candidate-facing promise?

Until clarified, preserve the common profile/application journey and do not publish an
unsupported delivery promise. The local review remains an explicit synthetic environment.

The withdrawal uses the existing transaction pattern and the
[Drizzle transaction API](https://orm.drizzle.team/docs/transactions), checked 2026-10-26.
