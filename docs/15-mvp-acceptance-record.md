# MVP Acceptance Record

This file is a reusable review record. Duplicate the result section for each
review rather than overwriting earlier evidence.

## Pilot checkpoint: 20 November 2026

Evidence for `1e4adba12d4c17698e56e527b7380c87bd15e198` in [pilot PR #69](https://github.com/talentbay/talentbay/pull/69). This is an engineering rehearsal, not founder or candidate acceptance. One commit may pass CI and still fail on a different host or bot.

| Scope | Result | Evidence / next proof |
| --- | --- | --- |
| Single vacancy, two roles, isolated database | PASS | Browser: validate CSV, review and publish, find the role, inspect illustrative London calculation, save a contact, consent, apply, operator records contact, candidate opens that receipt. [Test](../tests/e2e/first-employer-pilot.database.ts). No external contact was made. |
| Code and build for that commit | PASS | [GitHub Actions](https://github.com/talentbay/talentbay/actions/runs/44743738918) and Vercel Preview checks passed. This does not prove the primary site serves this SHA or that Preview uses a particular database. |
| Native sign-in on primary `@TalentBayBot` | FAIL | Owner saw the sign-in warning on launch. Need a fresh timestamp and matching request status from the serving environment; then verify Profile and Applications in the same native session. No credentials or launch data in the evidence. [Triage](28-telegram-entry-bot.md#main-bot-distinguish-launch-sign-in-and-session-20-november-2026). |
| Pilot content, real operations and human acceptance | BLOCKED | No approved employer source/recipient or reviewed city dataset; no real candidate or operator acceptance recorded. Approval to publish code is not consent to publish someone else's job or transmit a profile. |

**Decision:** continue internal rehearsal. No public pilot or commercial launch accepted. The blank record below is for a later, environment-specific review; its historical blocker list is not a current inventory.

At this checkpoint GitHub recorded a successful Production deployment for
[`a34d59a`](https://github.com/talentbay/talentbay/commit/a34d59aa39ab257ab806db892cda44ee1e04d2fa)
on 20 November at 10:21 UTC. It does not include the pilot's Telegram fallback
(`a44477c`). A successful deployment does not identify the cause of a failed native sign-in.

## Hosted review template

## Review Metadata

| Field | Value |
|---|---|
| Review date | Pending |
| Reviewer | Pending |
| Git commit | Pending |
| Deployment URL | Pending |
| Vercel deployment ID | Pending |
| Neon branch | `preview` |
| OAuth provider/account | Pending |

Allowed result values: `PASS`, `FAIL`, `BLOCKED`, `NOT RUN`.

## Technical Gates

| Check | Result | Evidence / notes |
|---|---|---|
| Deployment is `READY` | NOT RUN | |
| `/jobs` renders through SSR | NOT RUN | |
| Vacancy API matches the Preview database | NOT RUN | |
| API response includes `x-request-id` | NOT RUN | |
| Vercel logs contain the matching structured record | NOT RUN | |
| No unexpected runtime errors | NOT RUN | |
| Production database was not mutated | NOT RUN | |

## Candidate Journey

| Check | Result | Evidence / notes |
|---|---|---|
| OAuth sign-in completes | BLOCKED | Requires provider-console/manual login |
| Candidate profile saves and reloads | NOT RUN | |
| Vacancy detail is understandable | NOT RUN | |
| Application can be submitted once | NOT RUN | |
| Application appears in candidate list | NOT RUN | |
| Sign-out removes authenticated access | NOT RUN | |

## Admin Journey

| Check | Result | Evidence / notes |
|---|---|---|
| Approved account is promoted through dry-run/apply | BLOCKED | Requires approved admin email after OAuth |
| Non-admin access is rejected | NOT RUN | |
| Test vacancy imports with provenance | NOT RUN | |
| Vacancy can be reviewed and published | NOT RUN | |
| Published vacancy appears publicly | NOT RUN | |
| Archived vacancy disappears publicly | NOT RUN | |

## Product Review

| Check | Result | Evidence / notes |
|---|---|---|
| Demo and verified data are visibly distinct | NOT RUN | |
| Founder approves the controlled-test workflow | NOT RUN | |
| Initial vacancy sources are approved | BLOCKED | Founder/legal input required |
| Initial relocation sources/cities are approved | BLOCKED | Founder/legal input required |
| Terms and Privacy Notice are approved | BLOCKED | Founder/legal input required |

## External Launch Blockers

- Google Production callback is not yet added in Google Cloud Console.
- A complete GitHub or Google deployed login has not been performed manually.
- The first approved admin email is not recorded.
- `talentbay.org` belongs to another Vercel scope.
- Terms, Privacy Notice and data-source usage are not approved.
- Production backup/restore ownership is not assigned or tested.
- The Hobby deployment is an internal technical preview, not a commercial
  hosting arrangement.

## Decision

Select exactly one after the review:

- [ ] Accepted for another internal iteration.
- [ ] Accepted for a controlled candidate test.
- [ ] Accepted for commercial launch.
- [ ] Rejected; blocking findings are listed below.

Commercial launch acceptance must remain unchecked until every Production gate
in `docs/11-deployment-runbook.md` passes. This record never authorizes token,
pre-ICO, payment, KYC/AML or custody activity.

Blocking findings:

```text
Pending review.
```
