# MVP Acceptance Record

This file is a reusable review record. Duplicate the result section for each
review rather than overwriting earlier evidence.

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
