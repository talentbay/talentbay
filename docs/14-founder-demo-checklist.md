# Founder Demo Checklist

Last updated: 2026-07-29

## Purpose

This is the short product walkthrough for an internal MVP review. It proves the
current Web2 workflow and does not approve a commercial launch, legal copy,
third-party data rights, token activity, payments or custody.

## Before The Call

- Record the deployment URL and Git commit in the acceptance record.
- Confirm the deployment is `READY`.
- Confirm `/api/v1/vacancies` returns PostgreSQL data labelled `DEMO`.
- Use the Neon Preview branch, not Production, for write-flow demonstrations.
- Choose one approved OAuth test account.
- Promote that existing account to `ADMIN` only through the documented dry-run
  and apply command.
- Keep Vercel runtime logs open for request-ID correlation.

## Candidate Walkthrough

1. Open `/jobs` on desktop or mobile.
2. Search and filter the vacancy catalogue.
3. Open one vacancy and point out salary, location, source status and relocation
   indicators.
4. Open the relocation preview and explicitly identify demo versus verified
   figures.
5. Sign in through the configured OAuth provider.
6. Save a minimal candidate profile.
7. Apply to one labelled test vacancy.
8. Open the application list and confirm the new application appears.
9. Sign out and confirm candidate/admin pages are protected.

## Admin Walkthrough

1. Sign in with the approved admin account and open `/ktulhu`.
2. Confirm operational counters and the user registry load.
3. Import one clearly labelled test vacancy with source provenance.
4. Review the imported record.
5. Publish it and confirm it appears on `/jobs`.
6. Archive it and confirm it disappears from the public catalogue.
7. Confirm the runtime log contains a request ID and no request body, cookie,
   query string, IP address or raw error message.

## Review Questions

- Does the candidate understand which data is demo and which is verified?
- Can a candidate reach a relevant vacancy and apply without explanation?
- Is the admin review/publish/archive flow sufficient for the initial manual
  operating model?
- Which fields or steps block the first real candidate test?
- Which vacancy and relocation sources does the founder approve for the next
  dataset?
- Is the product ready for a controlled user test, or only another internal
  review?

## Automatic Stop Conditions

Stop the demo and record a failure when:

- OAuth returns an unexpected callback or session error.
- Preview writes reach the Production Neon branch.
- An unpublished or archived vacancy appears publicly.
- A non-admin account can access admin APIs or pages.
- A vacancy or relocation figure lacks a visible data-status/source label.
- Runtime output exposes secrets, OAuth tokens, cookies or personal form data.

The completed result belongs in `docs/15-mvp-acceptance-record.md`.
