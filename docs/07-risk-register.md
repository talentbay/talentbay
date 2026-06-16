# Risk Register

Last updated: 2026-06-09

| Area | Risk | Severity | Current State | Mitigation |
|---|---|---:|---|---|
| Product | MVP scope can drift into Web3/pre-ICO before core product exists | High | Web3 materials exist, product flow incomplete | Keep MVP Web2-first and document out-of-scope items |
| Architecture | SSR is disabled | Medium | `ssr: false` in Nuxt config | Make public pages SSR-ready before SEO becomes critical |
| Auth | Test/local auth route can be unsafe | High | `server/api/v1/auth/test.post.ts` exists | Remove or hard-disable before production |
| Auth | New OAuth user path may create empty session | High | `isRegistered` insert branch appears to return the old lookup result | Add test and fix before relying on auth |
| Data | Vacancy organization relation appears incorrect | High | `vacancies.orgID` references `users.id` | Redesign relation before vacancy CRUD |
| Data | No migrations/seed process documented | Medium | Early Drizzle schemas only | Add migrations and seed/demo data workflow |
| Security | Secrets can leak through chats/local files | High | `.env.example` exists, real `.env` local | Keep secrets in Vercel/GitHub secrets/password manager |
| QA | No tests configured | Medium | No unit/e2e scripts | Add minimal tests and smoke checks during foundation sprint |
| DevOps | No CI/CD configured | Medium | Vercel target discussed, repo scripts minimal | Add GitHub Actions checks and Vercel preview/prod |
| Bus factor | Knowledge concentrated in founder/current code | High | Docs are just being created | Keep decisions, setup, and workflows documented |
| Legal | Pre-ICO/token claims can create regulatory risk | High | Marketing pages mention token/Pre-ICO | Legal-approved public copy only |
| Payments/Crypto | Custody/payment/KYC responsibility unclear | High | Not implemented | Keep out of MVP unless separate legal/technical scope exists |
| Data sources | Scraping relocation/rent data may violate ToS | Medium | Sources not integrated | Prefer official APIs/manual curated data; legal review before scraping |

