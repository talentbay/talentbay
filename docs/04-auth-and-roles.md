# Auth and Roles

Last updated: 2026-06-09

## Decision

TalentBay MVP uses OAuth-first authentication.

Local password-based auth is not part of the first MVP unless a specific product requirement appears.

## Why OAuth-First

OAuth reduces the need to implement:

- Password storage.
- Password reset.
- Email verification.
- Brute-force protection for password login.
- MFA flows.

OAuth does not remove the need for TalentBay authorization.

TalentBay still owns:

- Local user record.
- Roles.
- Profiles.
- Company membership.
- Resource ownership.
- Admin permissions.

## Current Code

OAuth handlers:

- `server/api/v1/auth/google.get.ts`
- `server/api/v1/auth/github.get.ts`

Session utility:

- `nuxt-auth-utils`

User registration helper:

- `server/utils/registered.ts`

Client middleware:

- `app/middleware/auth.ts`

Admin server middleware:

- `server/middleware/admin.ts`

## Target Flow

```text
OAuth login
  -> provider returns identity
  -> TalentBay finds or creates local user in Postgres
  -> TalentBay stores provider account link
  -> user completes onboarding
  -> TalentBay assigns role/profile
  -> API checks session and permissions server-side
```

## Roles

Current enum:

```text
USER
MEMBER
ORG
ADMIN
```

Recommended MVP naming:

```text
CANDIDATE
COMPANY
ADMIN
```

Migration can be done later, but docs and product language should stay consistent.

## Authorization Rules

Server-side checks are mandatory.

Frontend checks are only UX hints and must not be treated as security.

Examples:

- Candidate can edit only own profile.
- Company can edit only own organization and vacancies.
- Admin can manage users/vacancies/statuses.
- Public visitors can read published vacancies.

## Account Linking

The MVP should avoid duplicate users when the same person signs in with different providers.

Open questions:

- Is email the primary account-linking key?
- What happens if GitHub does not return a public email?
- Can one user have multiple OAuth providers?
- Can a company account have multiple users?

## Production Risks

- `server/api/v1/auth/test.post.ts` should not be enabled in production.
- New user creation helper should be verified because insert path currently appears to return the original empty lookup result.
- Session payload should be minimal.
- Roles must be fetched/validated server-side before sensitive actions.

