# Authentication and Roles

Updated: 2026-10-26. Implementation on the unified identities branch; see the execution
log for tests, PR and deployment status. Real-provider browser acceptance is still pending.

## Accounts

TalentBay keeps a permanent `users.id`, separate candidate profile and provider identities
in the existing `oauth_accounts` table. Providers are GOOGLE, GITHUB and TELEGRAM. The
stable provider subject has a unique index; provider email/name/username are not account IDs.
User email is nullable for Telegram-only users. Existing OAuth users/IDs and their related
profiles/applications are preserved by migration 0002. No local passwords are introduced.

Existing Google/GitHub subjects continue signing into their original accounts. A new
provider subject matching an existing email returns 409 and asks the user to sign in with
the existing method, then connect the new method. Email matching alone never adds a new
identity. A linked provider's email is displayed separately and does not overwrite the
primary user email. No automatic account merging or disconnect endpoint exists.

## HTTP Flows

- `GET /api/v1/auth/google` and `/github`: provider login/callback. Verified provider email
  is required. The installed 0.5.32 library and a state-presence guard protect callbacks.
- `POST /api/v1/auth/link`: same-origin, authenticated initiation with GOOGLE/GITHUB.
  A five-minute server-only sealed intent binds the provider and current account.
  The callback proves the new provider and consumes the intent by replacing the session.
- `POST /api/v1/auth/telegram`: raw initData + login/link mode. Validates signature, age
  and payload on the server. Link mode requires a current account; login mode cannot
  silently attach another Telegram identity or switch an existing web account.
- `GET /api/v1/auth/identities`: authenticated, no-store list of connected methods, provider
  emails and connection dates. No provider subjects, tokens or raw initData are returned.
- `GET /api/v1/auth/capabilities`: no-store boolean availability flags, no credentials.
- `/api/_auth/session`: nuxt-auth-utils sealed session read/logout. Server-only secure
  session fields are not included in the public session response.

OAuth popups close after successful authentication; ordinary navigation returns to the
existing profile route. Candidate v1 supplies the canonical /profile and Settings flows.
The browser and Telegram WebView may hold different cookies while resolving the same user.

## Telegram

`NUXT_TELEGRAM_BOT_TOKEN` is private runtime configuration. The client sends raw
`Telegram.WebApp.initData`; initDataUnsafe is never an identity proof. Validation uses
Telegram's HMAC-SHA-256 construction with constant-time comparison, unique query keys,
bounded payload, strict user ID/name fields, five-minute age and 30-second future tolerance.
This login creates a normal TalentBay session; it does not grant bot notification consent.

Provider identity creation/linking is transactional. Advisory locks serialize the same
provider subject, and database uniqueness remains the final concurrency boundary.

## Authorization

Actual user roles are USER and ADMIN. Candidate is product terminology for a normal user;
company membership roles live separately in `organisation_members`. Employer self-service
has not been shipped. Public browsing is anonymous; profile/application endpoints use the
current session user ID, never a client-supplied owner ID. Admin endpoints are protected by
server middleware; client route guards only improve navigation.

The current admin guard still reads role from the sealed session. Immediate DB-role
revocation remains an operational hardening task; do not confuse a hidden button with
server authorization. New login reads the current database role; new accounts default USER.

## Verification and Release

Regression tests execute the installed OAuth runtime and real routes/session writer with
provider transport mocked. Telegram route tests exercise signature/origin/session boundaries;
database tests check existing accounts, conflicts, linking and simultaneous first logins.
These do not replace real Google/GitHub/Telegram checks on a configured stable HTTPS origin.

See [ADR 0007](adr/0007-local-provider-identities.md), [execution log](14-mvp-execution.md)
and [deployment runbook](11-deployment-runbook.md). Migration 0002 must be reviewed/applied
separately to the chosen shared environment; builds never migrate databases.
