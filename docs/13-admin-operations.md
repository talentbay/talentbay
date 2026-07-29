# Admin Operations

Last updated: 2026-07-29

## Assign The First Admin

The target user must first complete an OAuth sign-in. TalentBay never creates an
admin account from an arbitrary email.

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

## Safety Rules

- Use the Preview branch for initial verification.
- Never paste a connection string or session secret into an issue or chat.
- Do not assign `ADMIN` before the user has completed OAuth sign-in.
- Verify the target email, branch host and dry-run output before `--apply`.
- Production role changes require an approved change record.
- Role removal is a separate reviewed database operation until a dedicated
  command and audit policy are implemented.

## First Journey Check

After promotion:

1. Sign out and sign in again so the session contains the current role.
2. Open `/ktulhu`.
3. Confirm the dashboard and user registry load.
4. Import one labelled test vacancy.
5. Review and publish it.
6. Confirm it appears in `/jobs`.
7. Archive or delete test data according to the approved cleanup record.

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
3. Ask the user to sign out. Existing session invalidation is not yet
   centralized, so rotate `NUXT_SESSION_PASSWORD` if immediate global session
   invalidation is required.
4. Confirm `/ktulhu` and `/api/v1/admin/**` reject the account after a new
   session is created.

For a bad deployment, use Vercel rollback as described in
`docs/11-deployment-runbook.md`. Database migrations require a separate reviewed
forward-fix or restore plan; a Vercel rollback does not roll back PostgreSQL.
