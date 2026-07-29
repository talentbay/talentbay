# Risk Register

Last updated: 2026-07-29

| Area | Risk | Severity | Current State | Mitigation |
|---|---|---:|---|---|
| Product | MVP scope can drift into Web3/pre-ICO before core product exists | High | Public SaaS surfaces are Web2-only; token work remains externally discussed | Keep token/ICO/payment/custody work in a separately approved legal and technical scope |
| Product | Success criteria and launch dataset remain partly undefined | High | Candidate flow exists; final countries, sources and legal copy are not approved | Founder sign-off on launch checklist, dataset and measurable MVP outcomes |
| Auth | OAuth and role flows are not integration-tested | High | GitHub accepts the Production callback; Google reports `redirect_uri_mismatch`; login journeys remain unverified | Add the exact Google callback and test Google/GitHub, logout, candidate and admin access |
| Auth | Missing session secret breaks session requests | High | `nuxt-auth-utils` requires `NUXT_SESSION_PASSWORD` in every runtime | Make it a required Vercel variable and include it in deployment smoke checks |
| Data | Production database recovery is unverified | High | Neon is connected and both migrations are applied; backup/restore ownership is not documented | Assign recovery ownership and test branch restore before commercial launch |
| Data | Vacancy and relocation source rights are unconfirmed | High | Demo data and ingestion contracts exist; real providers are not approved | Use approved API/manual sources only and retain provenance/review dates |
| Security | Secrets can leak through chats/local files | High | Exposed Neon credential was rotated; real `.env` remains local and runtime secrets are encrypted in Vercel | Use an approved password manager, rotate on exposure and never share `.env` through chat |
| Security | API abuse can exhaust free infrastructure quotas | Medium | Vercel WAF limits `/api/` to 120 requests per 60 seconds per IP; application authorization remains the primary write control | Monitor legitimate traffic and tighten route-specific limits when usage data exists |
| QA | Authenticated browser journeys still lack E2E coverage | Medium | Isolated Neon integration tests cover profile, application and admin vacancy services; OAuth browser flow is externally blocked | Complete one deployed GitHub/Google candidate journey and one admin journey |
| Dependencies | Two transitive `esbuild` advisories remain in development tooling | Low | Audit has no critical/high findings; one moderate affects the deprecated Drizzle loader dev server and one low affects a Windows dev server | Do not expose development servers; replace the dependency when upstream Drizzle/Nuxt packages remove it |
| DevOps | Database environment drift can affect releases | Medium | Production, Preview/local and integration tests use separate Neon branches | Apply migrations deliberately per branch and keep direct migration credentials out of Vercel runtime |
| DevOps | Production domain is owned by another Vercel scope | High | Public `vercel.app` alias works; `talentbay.org` cannot be attached by the current account | Founder/domain owner grants access or moves the domain, then rerun smoke checks |
| Observability | Runtime failures can be hard to correlate | Medium | API responses include `x-request-id`; structured completion/error logs omit query strings, IPs, bodies, cookies and error messages | Add an external log sink and retention policy when Production ownership and budget exist |
| Bus factor | Knowledge concentrated in founder/current code | High | Setup, decisions and current operations are documented in the repository | Keep runbooks current with every operational change |
| Legal | Pre-ICO/token claims can create regulatory risk | High | Legacy token routes now redirect; historical material remains in Git | Do not publish token claims without separate entity/licensing/legal approval |
| Payments/Crypto | Custody/payment/KYC responsibility unclear | High | Not implemented | Keep out of MVP unless separate legal/technical scope exists |
| Legal | Terms and Privacy Notice are placeholders | High | Public status pages are `noindex` and marked pending review | Founder/legal-approved documents are a Production release gate |
