# Application History Recovery

B04/B09 focused follow-up, 2026-10-27. Existing intake/snapshot/sharing boundaries remain.
No event UPDATE/DELETE, snapshot rewrite, external recall, automatic resend or new employer
stage is introduced. One serialized command stream and current-admin authorization remain.

## Correcting an Operator Entry

A current ADMIN may append CORRECTED for a CONTACTED/SHARED/FOLLOW_UP/CLOSED revision of
the same application. Require exact current application revision, command UUID, one fixed
reason (RECORDED_IN_ERROR or DETAILS_INACCURATE) and a bounded non-empty private note.
Original event/actor/time/data remain intact; repeated correction of that target conflicts.
Receipt/assignment/withdrawal/correction events themselves are not rewritten or corrected.
This fixes a recorded fact, not the candidate's consent or an employer decision.

An active application returns to IN_PROGRESS for human review. Closed, rejected and
withdrawn applications stay closed; a correction is not permission to resume processing.
Any current admin can correct a fact even if the old assignee left/revoked access; the
new correction has the actual current actor. Normal contact/share commands still require
the current assignee. Candidate projection contains only target revision/fixed reason/
corrected flag, never the private explanation, actor, reference or contact channel.
Older paginated events must still be marked corrected even when the correction is on a
different page. Original inaccurate action time is not presented as an unqualified fact.

An ever-recorded SHARED event still triggers conservative handoff warnings and duplicate
sharing prevention, even after a correction. Correction is not evidence that no external
copy exists or that someone deleted it. Another handoff/re-consent policy is G05, not an
automatic bypass introduced by a correction. The operator can continue factual follow-up.

## Reopening TalentBay Handling

Only a handling-CLOSED application without WITHDRAWN/REJECTED status can be reopened.
Any recorded CANDIDATE_REQUEST closure blocks reopening/sharing too, even after a correction:
an operator's correction does not establish renewed candidate permission. That proof/process
belongs to G05, not an implicit reset. Server derives UI eligibility from the full history,
not only the latest50 events. Current-role/locked checks still revalidate on each command.
The explicit command is "Reopen and take application": current ADMIN becomes assignee,
stage IN_PROGRESS, employer/application status and immutable submission stay unchanged.
Require private reason and current revision; append REOPENED with real actor/time.
Never re-open a withdrawal or resurrect a vacancy/publish content. Sharing checks still
validate current vacancy/company/snapshot/disclosure and prior handoff history.

## Workflow and States

Operator journal -> correction/reopen disclosure -> fixed target/reason + private note ->
explicit command -> refreshed journal/current stage. Existing current-record modal and
Nuxt UI/Lucide/tokens, not a full admin redesign. On error retain draft; retry reuses the
same command UUID/payload after a lost response. Reload/conflict requires current revision.
Account/application changes clear private drafts. The existing latest50 operator journal
limit is visible; target revision is explicit and the server validates it independently.

Candidate -> own progress -> original flagged entry + later correction/reopen event;
current handling and employer stage remain distinct. Public history is bounded and
ownership-checked; no notes/reference/assignee leak. Close/withdrawal races never allow
subsequent sharing or revoked-consent reactivation. Test all paths on disposable data;
no real company contact/profile transmission. This is not a new approved Figma freeze.

## Migration / Rollback Gate

0008 adds two enum values only, no history/data backfill or deletion. Apply after approved
backup/target verification. Do not drop enum values/delete corrections as rollback. Old
code does not understand corrected facts; after real recovery events exist, rolling back
to it could show an inaccurate original without its correction. Keep the affected history
behind maintenance/protection until a compatible read path is verified, rather than
blindly reopening old code to users. Shared migration/release remains a separate approval.
