# Operator Runbook

Updated:2026-10-27. The operator is a human with current ADMIN access. This document does
not assign a person, promise support hours or approve real outreach. Before beta, the
owner must name the accountable operator/deputy, approved support channel, sharing method,
privacy reviewer and coverage/retention policy (G05/H04). No owner is invented here.

## Start a shift

1. Use the agreed environment and ordinary sign-in, not local-review identities in a
   real deployment. Open `/ktulhu/v1`. Verify the environment with the release operator;
   a working liveness endpoint alone does not prove DB/provider readiness.
2. Refresh Work overview. If counts fail, use Retry and report the request ID to the
   technical operator. Do not treat failure as an empty inbox or immediately migrate DB.
3. Open Needs an operator, then Oldest awaiting start. Closed/withdrawn/rejected records
   are excluded from active work. Role-revoked assignees appear as needing an operator.
4. Open Review, use Take application (or Assign to another current operator), then
   Start handling. Inspect the immutable submission, vacancy/source and candidate contact.
   Legacy rows without a submission snapshot are not approved sharing packages.
5. My active work is the handoff list for your shift. Assignment does not notify anyone;
   agree any shift transfer outside the application and record the actual assignment.
   There is no automated reminder/SLA/escalation system.

## Handle one application

1. Confirm the intended company/role and current vacancy. If content/source is doubtful,
   stop sharing and send it for source review. No current approved real source exists;
   ask CEO for exact sources/permission before real ingestion or republishing.
2. Contact the company manually through the agreed legitimate channel to propose the
   candidate relationship. Do not send a profile merely to test a button. Only after
   actual contact use Record company contact: real channel/time, short private reference,
   optional concise note. Do not paste mail bodies, passport data, secrets or unrelated PII.
3. Before any handoff, confirm candidate disclosure/permission and approved company
   recipient/channel/process. Prepare candidate package is a read-only view of the
   original snapshot plus note, not an email sender and not a transfer confirmation.
4. If authorized, manually transmit that minimum package outside TalentBay. Recheck the
   current record for withdrawal/conflict immediately before sharing. Never send a stale
   copied package after a withdrawal. A transaction cannot retract an external clipboard,
   email or message; genuinely atomic send-vs-withdrawal is not promised.
5. Only after the actual transmission, confirm the checkbox and Record completed
   handoff with actual channel/time/reference. This records the operator's claim, not
   employer delivery/read/hire. A recorded handoff cannot be sent again through this flow.
6. Use Record follow-up for later work; Close handling for actual VACANCY_CLOSED,
   CONTACT_UNAVAILABLE, NO_RESPONSE, CANDIDATE_REQUEST or COMPLETED. COMPLETED is not an
   automated hire. No-response delay/retry count must be agreed by the owner, not guessed
   from the age badge. Do not alter employer status to mirror TalentBay's activity.
7. Candidate Applications shows receipt and safe progress. It is not a timestamped proof
   of employer viewing. Notification delivery is not implemented; do not claim the bot
   sent a follow-up. Actual candidate communication needs the approved manual channel.

## Error, withdrawal and correction

- Network timeout: the action may have committed. Keep the draft and Retry, which reuses
  the same command UUID. Reload record if necessary; never send the external package
  again merely because the HTTP response was lost. Revision conflict: reload/reconcile
  the journal before another action. Forbidden: stop; never bypass current-role checks.
- Candidate withdrawal stops new handling/package actions, preserves the application and
  audit history, and is not deletion. Check whether handoff already happened. Ask the
  assigned privacy/operations owner about any necessary external follow-up; do not promise
  automatic recall or removal from a company's copies.
- Incorrect contact/handoff/follow-up/closure entry: Correct or reopen handling -> Correct
  an operator entry -> exact Entry revision -> fixed reason + private recovery note.
  Record correction. The original remains with its original actor/time; candidates see
  only a public correction marker/reason, not private notes. Metric history is restated.
- Correction does not reopen a closed record. For an eligible mistaken closure use the
  separate Reopen handling command with a reason; it takes current-operator ownership.
  Any candidate-requested closure, withdrawal/rejection remains blocked even if a human
  corrected that old entry. Renewed permission needs a separately approved process.
- A corrected handoff still warns of possible external copies and forbids another package
  through this flow. Escalate reconciliation to the responsible human; no recall/resend
  button or auto-invented consent exists. See docs29 for reader rollback restrictions.

## Content and city data

1. Approved source connector feeds draft/review/publish, not straight to public pages.
   Source registry is intentionally empty and cron off until exact permission exists.
   Source failure is not proof every vacancy disappeared; never delete linked applications.
   After a successful fetch, check **Excluded posting IDs** before the next run.
   Open each queue link, match the source, and withdraw a previously public role
   that lost its direct contact. A new excluded role has no imported row. A positive
   contact match does not authorize forwarding a candidate's profile.
2. CSV fallback: use the fixed template and Import CSV page. Preview first, fix every row
   error, inspect the summary/revision, import, review individual records and explicitly
   publish. Changed imports remove public eligibility; unchanged replays keep IDs/history.
   Public queue also requires ACTIVE company. For a correction/archive use the review UI.
3. Source publication/fetch/import/TalentBay publication/human check have different meanings.
   Unknown dates remain unknown. A human recheck must genuinely recheck content and does
   not silently republish or certify source permission (docs25).
4. City data: ask the subject reviewer for the versioned package, sources, assumptions and
   validity (docs26). Technical operator validates/dry-runs the local-only CLI (docs26/D03);
   current CLI refuses cloud/shared targets. Preview/shared loading requires D06/H approval,
   verified exact DB target, backup and authorized adapter, not an operator ad-hoc SQL edit.
   VERIFIED is not legal/tax advice; stale/missing/demo values must not be described as live.

## Support / privacy request

1. Approved support channel and accountable human are **not yet designated**. The basic
   bot is navigation/help, not a support inbox. This is a beta gate, not a hidden service.
2. Record only request category, approved-channel reference and request ID in the agreed
   restricted process; avoid copying candidate content into GitHub Issues/chat/screenshots.
   Request-ID or email alone is not identity proof. Prefer the existing authenticated
   account; suspected takeover/third-party requests need the approved human procedure.
3. Route access/correction/export/deletion/withdrawal complaints to the privacy owner.
   Do not issue an unapproved export or manually delete user rows: current cascades can
   erase linked applications/events. No legal basis, retention period or response deadline
   is selected by this document. Preserve evidence of scope/approval and minimize copies.
4. Escalate disclosure/suspicious access as an incident: stop optional sharing/imports,
   preserve bounded non-PII diagnostic identifiers, notify the named owner. Never paste
   DATABASE_URL, cookies, bot tokens, profiles or raw SQL errors in an incident ticket.

## End a shift / acceptance exercise

- Refresh My active work and Needs an operator, reconcile ambiguous results, record actual
  assignments and hand over unresolved work through the approved private channel.
- Check unreviewed/flagged content, source errors and stale data. No verified real data
  or source approval should be inferred from successful technical tests.
- Rehearse on `pnpm dev:review` fictional data: chooser -> operator -> oldest application ->
  take/start/contact -> prepare synthetic package -> record synthetic handoff -> candidate
  progress -> withdrawal -> denied package; correct an entry and reopen an eligible closure.
  Do not send anything externally. Local chooser is not a deployment feature.
- A non-author human must perform this walkthrough at H04. Automated/local developer
  verification is evidence, not their acceptance or a standing support/on-call guarantee.

Technical incidents/backups/app rollback/DB restore: [diagnostics and recovery](32-incidents-and-recovery.md)
and deployment runbook;
schema downgrade is never an incident shortcut. Real preview recovery and alerts require
actual environment checks/people, not a synthetic restore result.
