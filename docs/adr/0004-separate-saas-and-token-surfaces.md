# ADR-0004: Separate SaaS and Token Surfaces

Date: 2026-07-23  
Status: Accepted

## Context

The repository contained public landing, presentation, whitepaper and legal copy describing Pre-ICO, TLB, payments and regulatory claims. The approved first MVP is a Web2 job board and relocation product. Token and investment communication has separate legal, licensing and ownership requirements.

## Decision

- The active TalentBay application is a Web2 SaaS product.
- `/` enters the vacancy catalogue.
- Legacy presentation and whitepaper routes are not published through the active SaaS navigation and currently redirect to `/jobs`.
- Token, ICO, payment, custody and KYC behavior is not implemented in this application.
- Public legal documents require founder/legal approval before they become effective.

## Consequences

- Product engineering cannot create token or investment promises through UI copy or API behavior.
- Token-related work needs a separate approved scope and legal owner.
- Production release remains blocked until SaaS Terms and Privacy Notice are approved.
