# ADR 0007: Local accounts and explicit provider linking

Status: Implemented on the Telegram identity branch; provider acceptance pending.
Date: 2026-10-26

## Decision

Reuse `users` and the deployed `oauth_accounts` table/type names. Add TELEGRAM to the
provider enum and allow a NULL user email, preserving all existing IDs, provider subjects,
roles, profiles and applications. Do not fabricate email addresses for Telegram users.
The provider subject, not name/username/email, identifies an authenticated identity.

Existing Google/GitHub identity rows still resolve to their existing users. A new provider
subject with a matching email returns a conflict instead of automatically merging accounts.
The user signs in with the existing method and explicitly connects another method in
Settings. Current authenticated account + a fresh validated provider callback prove both
sides. Account merging and disconnect are separate work.

OAuth linking begins with a same-origin authenticated POST and a five-minute intent in
server-only sealed session data, bound to provider and current user. OAuth state validation
still binds the callback to its browser. Successful linking replaces the session and
consumes the intent. Expired/wrong-owner/wrong-provider intents cannot write an identity.
Normal OAuth sign-in cannot silently link or replace an already authenticated account.

Telegram authentication validates the raw initData HMAC on the server with Node crypto,
the documented Telegram algorithm, constant-time comparison, unique query keys, strict
user schema, a 16 KiB bound and five-minute expiry (30-second future clock tolerance).
The token stays in private runtime config. No initDataUnsafe identity is trusted. A normal
sealed TalentBay session follows validation; no provider token or raw payload is stored.
The client must explicitly request link mode to connect Telegram to a signed-in account.
Login mode cannot switch that account or attach a new host identity automatically.

Provider-subject advisory locks and the existing unique index serialize simultaneous
first sign-ins/linking; email uniqueness prevents a second account claiming the same email.
Primary user email is not overwritten when a connected provider changes its email or when
another provider is linked; provider email remains visible separately in connected methods.

## Compatibility and operations

Migration 0002 is additive/relaxing: enum value and nullable email only. No record moves or
deletes. Back up/review the actual shared target before applying it. A down migration
cannot safely remove Telegram users or restore NOT NULL once those users exist; roll
back app code only after accounting for nullable emails. Migrations never run in builds.

Exact auth dependency 0.5.32 includes the maintainer fix for GHSA-889p-xjqp-6559.
The small state-presence guard and actual installed-library regressions remain.

The previously considered `@tma.js/init-data-node` has a documented deprecation; its renamed
replacement documentation and published npm version were inconsistent at the time of this
check. This bounded server validator uses existing Node crypto/Zod instead of adding the
deprecated package and its dependency tree. It is checked with independently signed
Web Crypto fixtures and route regressions. Real Telegram/WebView/provider acceptance
is still required on a configured stable HTTPS origin.

## Sources checked

- https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
- https://nuxt.com/modules/auth-utils
- https://github.com/atinux/nuxt-auth-utils/releases/tag/v0.5.32
- https://docs.telegram-mini-apps.com/packages/tma-js-init-data/migrate-from-init-data-node
