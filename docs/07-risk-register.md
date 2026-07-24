# Risk Register

Last updated: 2026-07-24

| Area | Risk | Severity | Current State | Mitigation |
|---|---|---:|---|---|
| Product | MVP scope can drift into Web3/pre-ICO before core product exists | High | Public SaaS surfaces are Web2-only; token work remains externally discussed | Keep token/ICO/payment/custody work in a separately approved legal and technical scope |
| Product | Success criteria and launch dataset remain partly undefined | High | Candidate flow exists; final countries, sources and legal copy are not approved | Founder sign-off on launch checklist, dataset and measurable MVP outcomes |
| Auth | OAuth and role flows are not deployed or integration-tested | High | Handlers and local-user mapping exist; no real DB/callback verification | Test Google/GitHub, logout, candidate and admin access on Preview |
| Auth | Missing session secret breaks session requests | High | `nuxt-auth-utils` requires `NUXT_SESSION_PASSWORD` in every runtime | Make it a required Vercel variable and include it in deployment smoke checks |
| Data | Database migrations have not run against managed PostgreSQL | High | Versioned Drizzle migrations exist, but no connected DB | Provision managed PostgreSQL, migrate, back up and test restore before Production |
| Data | Vacancy and relocation source rights are unconfirmed | High | Demo data and ingestion contracts exist; real providers are not approved | Use approved API/manual sources only and retain provenance/review dates |
| Security | Secrets can leak through chats/local files | High | `.env.example` exists, real `.env` local | Keep secrets in Vercel/GitHub secrets/password manager |
| Security | No rate limiting or abuse protection is defined | Medium | Public search is read-only; auth/apply/admin endpoints have no shared limiter | Select provider-level and application-level controls before public launch |
| QA | Authenticated DB workflows lack integration/E2E coverage | Medium | Unit tests and HTTP smoke pass | Add DB integration tests and one browser journey once Preview infrastructure exists |
| DevOps | Preview and Production are not connected | High | CI exists; Vercel account/project/domain are unavailable locally | Connect intended Vercel account, configure environments and review Preview before domain cutover |
| Bus factor | Knowledge concentrated in founder/current code | High | Docs are just being created | Keep decisions, setup, and workflows documented |
| Legal | Pre-ICO/token claims can create regulatory risk | High | Legacy token routes now redirect; historical material remains in Git | Do not publish token claims without separate entity/licensing/legal approval |
| Payments/Crypto | Custody/payment/KYC responsibility unclear | High | Not implemented | Keep out of MVP unless separate legal/technical scope exists |
| Legal | Terms and Privacy Notice are placeholders | High | Public status pages are `noindex` and marked pending review | Founder/legal-approved documents are a Production release gate |
