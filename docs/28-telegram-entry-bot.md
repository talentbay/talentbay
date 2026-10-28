# Telegram Entry Bot v1

I01 implementation contract, 2026-10-27. One Nuxt application and existing server-validated
Mini App identity flow. No Pre-ICO bot, chat support inbox, CV intake or proactive delivery.

## Test Connection - 2026-10-28

Owner supplied token through the ignored/mode600 local file; getMe verified exactly
@talentbay_tester_bot/9279549942. Only talentbay-review is configured, no Pre-ICO bot.
Stable origin https://talentbay-review.vercel.app, deployment dpl_CBXZ9Kq4RhJwYevBKDWNEqMhHHrs.
Read-back verifies Open TalentBay web_app menu to /jobs, five all_private_chats commands
below and webhook to /api/v1/bot/telegram, message updates/max_connections2/pending0 at check.
Existing state was empty/default; pending updates were preserved. First immediate menu read
still showed commands; guarded retry made no write, later read matched. Do not overwrite
the existing verified webhook just because a one-time setup helper reports a conflict.

Telegram=true capability and10 HTTPS security probes PASS;8 DB-backed UI/API probes PASS.
No forged successful login/user/receipt was generated. Real Start/command delivery/native
Profile is awaiting owner confirmation. Bot has no Main Mini App: use
[the bot chat](https://t.me/talentbay_tester_bot) -> Start -> Open TalentBay, not an assumed
startapp link. Google/GitHub are not configured on this test project. Demo Apply stays off.
Prior settings for rollback: empty webhook, commands menu, empty default/private command
sets. See docs14/11 for the exact deployed state and safe rollback order. Secrets stay out
of these records; don't rotate them merely to reconstruct a setup command.

## Architecture and Delivery Meaning

Use an HTTPS Nitro webhook and Telegram's documented JSON webhook-reply mechanism for
one static `sendMessage` response. No polling daemon, queue, extra Redis, multi-platform
Chat SDK or new bot framework is needed for these fixed commands. Existing Zod/H3/Drizzle
provide parsing, input bounds and durable duplicate suppression. This does not replace
a proper delivery service if notifications are later approved.

Telegram cannot report whether a webhook-reply method succeeded. A receipt means only
that this application prepared a reply, not that Telegram accepted it or the user read it.
Record the bot/update key atomically before returning the reply; duplicates return an
empty acknowledgment. A crash/lost HTTP response after commit can therefore lose a reply.
The user can repeat the command as a new update. No exactly-once/delivery guarantee and
no automatic resend of ambiguous outcomes. No network call is held under a SQL lock.

## Boundary

- Default off unless exact server-only bot identity, token, HTTPS app origin and webhook
  secret are configured. App origin has no user info/path/query/fragment; links use fixed
  routes on that origin. No input URL redirects or identity/credential query parameters.
- Authenticate the webhook secret before reading JSON or accessing the DB. This is not
  a browser same-origin endpoint. The secret is separate from the bot/session password.
- Existing bounded JSON reader,64KiB/uncompressed UTF-8; safe integers and short message
  text. Only a new private user message is actionable; no group/channel/edited/business
  messages, payments, callbacks or arbitrary admin commands.
- `/start`, `/jobs`, `/applications`, `/help`, `/privacy`; unknown text gives a fixed
  navigation/help answer, not an acknowledgment of a monitored support ticket. Media is
  not stored/processed. Addressed commands for a different bot are ignored.
- Inline Web App buttons open existing jobs/applications routes. Privacy is an ordinary
  same-origin notice link. A bot update/username never creates a web identity/session;
  private records still require signed initData and normal server authorization.
- Additive receipts contain only bot/update IDs and preparation time, not names, chat IDs,
  text, profiles, raw updates, tokens or delivery status. Current retention/cleanup policy
  must be approved before beta; no automatic destructive cleanup or false deletion claim.
- Menu/commands/webhook setup and real sends remain H03 provider operations. Use a
  separate test bot and stable approved HTTPS origin before any production connection.

## Acceptance

Unit tests cover config/links/commands/private-message selection/secret handling. Disposable
PostgreSQL covers replay/concurrency and old-data preservation; HTTP tests cover disabled/
unauthorized/malformed/oversized/repeated updates, no sessions or private data. No real bot
credential, outgoing provider call, shared DB migration or menu mutation is part of testing.

## Provider Connection Gate / Runbook

Do not run these mutations as part of code tests. After H02/H03 approval:

1. Verify the exact bot's `getMe` ID/username, ownership, app origin and existing webhook.
   Never reuse the pre-ICO bot implicitly. Back up its prior non-secret webhook/menu/
   command settings and keep any credentials only in approved secret stores.
2. Apply committed0007 through the approved migration process with a verified backup and
   isolated preview target. The additive table does not change existing accounts/data;
   rollback disables this webhook/code, not deletion of old applications or receipts.
3. Set `NUXT_TELEGRAM_BOT_TOKEN`, `NUXT_TELEGRAM_BOT_ID`, `NUXT_TELEGRAM_BOT_USERNAME`,
   `NUXT_TELEGRAM_WEBHOOK_SECRET`, `NUXT_TELEGRAM_APP_ORIGIN` in the correct server environment.
   Generate a separate random32+ allowed-character webhook secret; do not paste it in chat.
   Check the deployed endpoint is reachable by Telegram. Do not remove existing deployment
   protection or put bypass/session credentials into app links to make a preview work.
4. On the approved test bot, call `setMyCommands` scoped to `all_private_chats`:

   ```json
   {"scope":{"type":"all_private_chats"},"commands":[
     {"command":"start","description":"Open TalentBay"},
     {"command":"jobs","description":"Browse jobs"},
     {"command":"applications","description":"Open your applications"},
     {"command":"help","description":"Navigation and help"},
     {"command":"privacy","description":"Read the privacy notice"}
   ]}
   ```

5. Use BotFather `/setmenubutton` or `setChatMenuButton`: type `web_app`, text `Open TalentBay`,
   `web_app.url` is the exact approved app origin plus `/jobs`. Inline command buttons already
   link to the same product. No write-access/contact permission request is required by v1.
6. `setWebhook.url` is that origin plus `/api/v1/bot/telegram`; `allowed_updates` is `["message"]`,
   initial `max_connections`2 (our conservative rollout setting, not a provider limit),
   `secret_token` comes from the same approved secret store as the server variable.
   Preserve pending updates unless an explicit owner decision permits dropping them.
7. Verify `getWebhookInfo` and real private `/start`, `/jobs`, `/applications`, `/help`,
   `/privacy`, group ignore, native signed login and unchanged ordinary-browser login.
   A local returned JSON method is not evidence that Telegram actually executed it.
8. Roll back by restoring the exact prior webhook/menu/commands or disabling this test-bot
   webhook as approved. Do not rotate bot/session secrets or discard pending updates silently.

Before beta: approved Privacy/Terms/support contact, receipt retention/cleanup, abuse budget,
operator ownership and provider/log acceptance are still G/H gates. No fabricated support
email, tax/legal approval, automatic delivery metric or active production bot is implied.

## Official References

Checked2026-10-27: [webhook replies](https://core.telegram.org/bots/api#making-requests-when-getting-updates),
[setWebhook and secret header](https://core.telegram.org/bots/api#setwebhook),
[inline-button Mini Apps](https://core.telegram.org/bots/webapps#inline-button-mini-apps),
[menu button](https://core.telegram.org/bots/api#menubuttonwebapp).
