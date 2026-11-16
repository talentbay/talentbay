# Compliance and Project Guardrails

Last updated: 2026-11-16

This document is not legal advice. It records project boundaries for engineering and product planning.

## Scope Boundary

The first TalentBay DMCC MVP is a SaaS/job board with relocation calculation.

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

### Vacancy Sources — Owner Direction, 2026-11-16

- Do not scrape LinkedIn/Indeed or use logged-in sessions, cookies, applicant credentials,
  private APIs, CAPTCHA bypass, proxy rotation or other access-control workarounds.
- Prefer employer-authorized documented ATS feeds, initially Lever; Greenhouse and Workday
  are not implemented connectors. An accessible feed is not permission to syndicate it.
- Automated ingestion selects structured facts only: employer, role, explicitly mapped
  location, employment/workplace type and numeric salary with original units. Preserve the
  original link/ID. Do not copy descriptions, requirements lists, additional/salary prose,
  images, or create machine paraphrases as a substitute for permission.
- Require a recorded permission reference, content owner, date, terms URL and explicit
  public-ATS/facts-only approval before adding a server-owned source. Keep the live registry
  empty until that evidence exists. Technical validation/HTTP200/robots.txt are not legal clearance.
- CSV/JSON must not be used to launder scraped content. Manual text must be first-party or
  permission-cleared. Known main LinkedIn/Indeed domains are rejected by the shared source
  URL schema; this bounded check is not an exhaustive provider/domain or legal assessment.
- Review before publication, track origin, handle correction/removal requests and stop a
  source on an objection or loss of permission. Do not promise an automatic legal takedown
  process or retention policy that has not been approved/implemented.

Official sources checked 2026-11-16:
[LinkedIn User Agreement, section8.2](https://www.linkedin.com/legal/user-agreement),
[Indeed Terms, site rules](https://www.indeed.com/legal?hl=en),
[Lever Postings API](https://github.com/lever/postings-api),
[Greenhouse Job Board API](https://docs.greenhouse.io/job-board.html).
US copyright distinguishes facts from their expression, but that is not a worldwide
exception from contract, database or other applicable rights:
[US Copyright Office](https://www.copyright.gov/help/faq/faq-protect.html).
The2022 hiQ appellate opinion concerns preliminary relief and CFAA interpretation, not a
blanket finding that all public scraping is legal or illegal:
[official Ninth Circuit opinion](https://cdn.ca9.uscourts.gov/datastore/opinions/2022/04/18/17-16783.pdf).
These are engineering restrictions, not project-specific legal advice or founder/legal approval.

## Exit Criteria Before Production

Before production launch:

- Remove unsafe test routes.
- Configure environment variables outside repository.
- Confirm privacy/terms copy.
- Confirm public token/pre-ICO copy with legal.
- Add basic backup/restore plan for database.
- Add CI checks.
- Add minimal error logging/monitoring.

