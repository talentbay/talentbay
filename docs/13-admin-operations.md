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
