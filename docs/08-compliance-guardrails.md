# Compliance and Project Guardrails

Last updated: 2026-06-09

This document is not legal advice. It records project boundaries for engineering and product planning.

## Scope Boundary

The first TalentBay MVP is a SaaS/job board with relocation calculation.

The first MVP should not handle:

- Investor funds.
- Crypto custody.
- Token issuance.
- Wallet transactions.
- KYC/AML verification.
- Payment processing.
- Employment contract guarantee.

## Public Claims

Any public claims about the following require founder and legal approval:

- TLB token.
- Pre-ICO/ICO/TGE.
- Token price.
- Listing expectations.
- Investor returns.
- Regulatory status.
- KYC/AML coverage.
- Payments in crypto.
- Guarantees between candidates and companies.

## Engineering Rule

Engineering can implement approved product surfaces, but engineering should not create legal commitments through UI copy, API behavior, or documentation.

Examples:

- A "crypto-friendly" badge can be a product filter if approved.
- A promise of token rewards, returns, or exchange listing is not an engineering decision.
- A KYC checkbox is not KYC compliance.
- A payment button is not safe unless payment/legal/provider scope is approved.

## Data and Privacy

Do not collect personal data unless the MVP needs it.

For collected data:

- Explain why it is needed.
- Store only the minimum.
- Restrict access.
- Avoid logging sensitive data.
- Do not commit production data.

## External Data

Relocation/cost data should use:

- Manual curated datasets.
- Official APIs.
- Public datasets with clear usage rights.
- Provider APIs with accepted terms.

Scraping requires separate review.

## Exit Criteria Before Production

Before production launch:

- Remove unsafe test routes.
- Configure environment variables outside repository.
- Confirm privacy/terms copy.
- Confirm public token/pre-ICO copy with legal.
- Add basic backup/restore plan for database.
- Add CI checks.
- Add minimal error logging/monitoring.

