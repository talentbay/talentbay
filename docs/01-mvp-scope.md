# MVP Scope

Last updated: 2026-06-09

## MVP Goal

Build a working vertical slice:

```text
Candidate opens vacancies -> opens vacancy details -> sees relocation/net-income calculation -> registers -> completes basic profile -> applies.
```

The MVP must be useful enough for early candidates and clear enough for investor demo.

## In Scope

### Candidate

- OAuth registration/login.
- Basic candidate profile.
- Vacancy search/list.
- Vacancy detail page.
- Relocation calculation attached to a vacancy/city.
- Apply to vacancy.

### Company

- OAuth registration/login.
- Basic company account.
- Create or request vacancy publication.
- See applications in a simple form.

If company self-service takes too long, MVP can start with admin-created vacancies and add company CRUD later.

### Admin

- Manage vacancies.
- Manage users.
- View companies/candidates.
- Basic statuses: `draft`, `published`, `archived`, `reported`.

Manual pre-moderation is not required for the first MVP unless product/legal requirements change.

### Relocation Calculator

First version should estimate:

- Gross salary.
- Taxes.
- Rent.
- Utilities.
- Transport.
- Food/basic monthly expenses.
- Insurance.
- Flight/initial transfer cost.
- Approximate net leftover.
- Source/confidence/last updated.

Start with 10-15 cities instead of global coverage.

## Out of Scope

- Wallet connection.
- TLB token transactions.
- Staking.
- Smart contracts.
- KYC/AML.
- Payment processing.
- Custody.
- Mobile app.
- AI matching.
- Full analytics.
- Public company pages.

## First City Set

Working list:

- Dubai
- London
- Berlin
- Lisbon
- Tallinn
- Belgrade
- Istanbul
- Tbilisi
- Bangkok
- Buenos Aires
- Mexico City

## Success Criteria

After 3 months:

- A candidate can complete the core flow without manual developer help.
- 10-15 cities have usable relocation data.
- Vacancies can be created and published.
- Investor demo can be shown at any moment.
- 50-100 early candidates can register or interact with the product.

Nice to have:

- 2-3 companies publish or test vacancies.
- Early applications exist.

Not required:

- Paid employer demand.
- Organic company growth.
- Web3 functionality.

## Sprint Outline

### Sprint 0: Discovery and Foundation

- Confirm MVP scope.
- Confirm documentation baseline.
- Confirm infrastructure and process.
- Audit existing code and old modules.
- Prepare backlog.

### Sprint 1: Developer Experience

- README and docs.
- `.env.example`.
- pnpm lockfile.
- Basic CI checks.
- Remove or archive old code after extracting useful references.

### Sprint 2: Vacancy Foundation

- Finalize vacancy/organisation data model.
- Add migrations and indexes.
- Implement vacancy list API.
- Implement vacancy list UI.

### Sprint 3: Relocation Calculator

- Add city/cost data model.
- Add seed data for first cities.
- Implement calculation service.
- Show calculation on vacancy detail.

### Sprint 4: Candidate Flow

- Candidate profile.
- Apply flow.
- Application data model.
- Basic candidate dashboard.

### Sprint 5: Company/Admin Flow

- Company account/profile.
- Vacancy CRUD.
- Applications view.
- Admin moderation/status controls.

### Sprint 6: Demo Hardening

- Error/loading/empty states.
- Demo data.
- UI cleanup.
- Smoke tests.
- Legal-approved public copy.

