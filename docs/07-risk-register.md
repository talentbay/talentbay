# Risk Register

Last updated: 2026-07-29

| Area | Risk | Severity | Current State | Mitigation |
|---|---|---:|---|---|
| Product | MVP scope can drift into Web3/pre-ICO before core product exists | High | Public SaaS surfaces are Web2-only; token work remains externally discussed | Keep token/ICO/payment/custody work in a separately approved legal and technical scope |
| Product | Success criteria and launch dataset remain partly undefined | High | Candidate flow exists; final countries, sources and legal copy are not approved | Founder sign-off on launch checklist, dataset and measurable MVP outcomes |
| Auth | OAuth and role flows are not integration-tested | High | Handlers, secrets and DB mapping are deployed; provider callbacks and login journeys remain unverified | Configure exact callbacks and test Google/GitHub, logout, candidate and admin access |
| Auth | Missing session secret breaks session requests | High | `nuxt-auth-utils` requires `NUXT_SESSION_PASSWORD` in every runtime | Make it a required Vercel variable and include it in deployment smoke checks |
| Data | Production database recovery is unverified | High | Neon is connected and both migrations are applied; backup/restore ownership is not documented | Assign recovery ownership and test branch restore before commercial launch |
| Data | Vacancy and relocation source rights are unconfirmed | High | Demo data and ingestion contracts exist; real providers are not approved | Use approved API/manual sources only and retain provenance/review dates |
| Security | Secrets can leak through chats/local files | High | Exposed Neon credential was rotated; real `.env` remains local and runtime secrets are encrypted in Vercel | Use an approved password manager, rotate on exposure and never share `.env` through chat |
| Security | No rate limiting or abuse protection is defined | Medium | Public search is read-only; auth/apply/admin endpoints have no shared limiter | Select provider-level and application-level controls before public launch |
| QA | Authenticated DB workflows lack integration/E2E coverage | Medium | Unit tests and HTTP smoke pass | Add DB integration tests and one browser journey once Preview infrastructure exists |
| DevOps | Preview and Production currently share one database branch | High | Both Vercel environments use the Production Neon URL | Create a dedicated Preview branch and narrow each Vercel environment to its own URL |
| DevOps | Production domain is owned by another Vercel scope | High | Public `vercel.app` alias works; `talentbay.org` cannot be attached by the current account | Founder/domain owner grants access or moves the domain, then rerun smoke checks |
| Bus factor | Knowledge concentrated in founder/current code | High | Docs are just being created | Keep decisions, setup, and workflows documented |
| Legal | Pre-ICO/token claims can create regulatory risk | High | Legacy token routes now redirect; historical material remains in Git | Do not publish token claims without separate entity/licensing/legal approval |
| Payments/Crypto | Custody/payment/KYC responsibility unclear | High | Not implemented | Keep out of MVP unless separate legal/technical scope exists |
| Legal | Terms and Privacy Notice are placeholders | High | Public status pages are `noindex` and marked pending review | Founder/legal-approved documents are a Production release gate |
