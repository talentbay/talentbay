# Sprint 2 Plan

Period: next two-week implementation sprint

## Goal

Turn the deployed technical preview into an end-to-end testable Web2 MVP without
publishing unapproved legal, vacancy, relocation, payment or token claims.

## Definition of Done

- Preview/local database work is isolated from the Production Neon branch.
- At least one OAuth provider completes a deployed sign-in journey.
- One approved user can be promoted to `ADMIN` through an auditable command.
- Candidate profile, application and application-list flows pass against Neon.
- Admin vacancy import, review and publish flows pass against Neon.
- Production smoke checks remain green and no new runtime errors appear.
- The founder has a short demo script and a list of external launch blockers.

## P0 Work

1. [x] Create and configure a Neon Preview branch.
2. [x] Add a safe admin-promotion command that requires an explicit email.
3. [x] Verify exact Google and GitHub callback URLs.
4. Run the candidate journey:
   sign in -> edit profile -> open vacancy -> apply -> view application.
5. Run the admin journey:
   sign in -> import vacancy -> verify -> publish -> confirm public visibility.
6. [x] Add DB-backed integration coverage for the critical service paths.
7. [x] Extend production smoke checks to validate PostgreSQL-backed vacancy data.

## P1 Work

1. Add application-level request throttling for auth-adjacent and write routes.
2. Add structured request/error logging without personal data or secrets.
3. Document admin operations and rollback steps.
4. Prepare a founder demo checklist and acceptance record.

## External Inputs

- OAuth provider console access or callback updates.
- The email of the first approved admin user.
- Access to the Vercel scope that owns `talentbay.org`.
- Founder/legal approval for Terms, Privacy and data-source usage.
- Approved real vacancy and relocation sources.

These dependencies are tracked as blockers, not implicit engineering
responsibility.

## Out of Scope

- Web3, token, pre-ICO, wallets or custody.
- Payments or KYC/AML implementation.
- Unapproved scraping or republishing of third-party vacancies.
- Publishing unreviewed tax, legal or relocation claims as verified facts.
- A commercial launch on `talentbay.org` before the Production gates pass.
