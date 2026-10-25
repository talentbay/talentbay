# Admin Operations

Last updated: 2026-10-26

## Assign The First Admin

The target user must first complete a verified Google/GitHub or Telegram sign-in.
TalentBay never creates an admin account from an arbitrary email/username/provider ID.

Confirm that `.env` points to the intended Neon branch, then run a dry run:

```bash
pnpm db:promote-admin -- approved-admin@example.com
```

The command prints the matched user ID, current role and intended role without
changing the database. Apply the change only after reviewing that output:

```bash
pnpm db:promote-admin -- approved-admin@example.com --apply
```

The operation is transactional and idempotent. It emits a timestamped JSON
record showing whether the role was updated or already assigned. Retain that
record with the corresponding approved issue or change record.

Telegram-only users may have no email. Use their **permanent local TalentBay user ID**,
verified against the current account/session and intended environment, not a Telegram ID:

```bash
pnpm db:promote-admin -- --user-id 42
pnpm db:promote-admin -- --user-id 42 --apply
```

These numbers are examples, not an approved target. Email and ID are mutually exclusive;
there is no matching by display name, provider subject or supplied email. The script
defaults to dry run and rejects missing accounts. Neither form verifies the database's
business environment for you: confirm its host/branch before applying.

## Safety Rules

- Use the Preview branch for initial verification.
- Never paste a connection string or session secret into an issue or chat.
- Do not assign `ADMIN` before the user has completed verified sign-in.
- Verify the local target ID/email, branch host and dry-run output before `--apply`.
- Production role changes require an approved change record.
- Role removal is a separate reviewed database operation until a dedicated
  command and audit policy are implemented.

## First Journey Check

After promotion:

1. Sign out and sign in again so the session contains the current role.
2. Open `/ktulhu/v1`.
3. Confirm the dashboard and user registry load.
4. In an isolated preview only, import one labelled test vacancy using the
   [content operations guide](19-content-operations.md).
5. Review and publish it.
6. Confirm it appears in `/jobs`.
7. Archive test data according to the approved cleanup record; never delete records with
   applications merely to simplify cleanup.

## Rollback

For an incorrectly published vacancy:

1. Record its ID, source URL and current status.
2. Change it to `ARCHIVED` through the admin workflow.
3. Confirm it no longer appears in `/jobs` or `/api/v1/vacancies`.
4. Retain the record for audit unless deletion is explicitly approved.

For an incorrect admin assignment:

1. Treat it as a security incident and record the user ID, email, branch and
   promotion output.
2. Revoke the role in a reviewed database transaction; do not improvise a
   public API or create another account.
3. Each admin handler checks the current DB role, so removal blocks privileged access
   even with an older ADMIN cookie. Sign-out also refreshes the client role/navigation.
   Global secret rotation is a separate incident operation, not the default role rollback.
4. Confirm `/api/v1/admin/**` rejects the account with both the old and refreshed session.

For a bad deployment, use Vercel rollback as described in
`docs/11-deployment-runbook.md`. Database migrations require a separate reviewed
forward-fix or restore plan; a Vercel rollback does not roll back PostgreSQL.
