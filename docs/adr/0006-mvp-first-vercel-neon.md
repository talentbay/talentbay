# ADR 0006: Launch the MVP on Vercel and Neon

Status: Accepted product direction; implementation tracked separately.
Date: 2026-10-06

## Context

Candidate Design v1.0 is frozen. The repository already has a Nuxt/Node application,
PostgreSQL/Drizzle, OAuth/profile/application code and an existing Vercel demo.
Cloudflare preparation exists only in PR #24; it has not been merged or deployed with
Hyperdrive. Making that migration mandatory delays the actual Candidate product.

The user approved prioritising a faster MVP on the existing stack. Hosting plan/access
restrictions remain explicit gates; this is not authorization to start a paid plan or to
release commercial software on a restricted plan.

## Decision

1. Keep one responsive Nuxt application and its existing Node runtime on Vercel.
2. Keep Neon PostgreSQL, existing user/data IDs and versioned Drizzle migrations.
3. Remove Cloudflare/Hyperdrive and microservice extraction from MVP prerequisites.
4. Preserve PR #24 as a draft experiment. Do not delete it or merge it into the launch path.
5. Retain CI checks and add disposable PostgreSQL integration CI before auth/data changes.
6. Implement shared auth, Candidate v1, a minimal reviewed file-import path and beta checks.
7. Separate independent code work from external billing/access/provider configuration.

This supersedes the Cloudflare-first ordering in the 2026-10-02 plan and 2026-10-03
roadmap. ADR 0005 lives in the deferred branch; it is not a mandate to change production.

## Delivery boundaries

The existing Vercel deployment is a technical demo, not proof that current main is deployed.
Preview/project settings access, commercial entitlement, Git integration and stable OAuth
origins must be verified. Do not activate a subscription or trial automatically.

GitHub Actions integration jobs use a temporary PostgreSQL container and committed SQL
migrations, not Neon credentials. A separate shared preview environment is sufficient for
initial browser verification; per-PR databases and elaborate platform tooling are optional.
Production migrations and promotion remain deliberate operations with approval and rollback.

## Consequences

We can build and test the product without a hosting migration. Existing Cloudflare work
is reusable later but has no effect on MVP delivery. Strong module boundaries, normal HTTP
contracts and committed migrations preserve migration options without pre-building services.
The plan does not waive security, source permissions, privacy or data-integrity gates.

## Reference checks

Checked 2026-10-06:

- Vercel Hobby terms: https://vercel.com/docs/plans/hobby
- Vercel GitHub integration: https://vercel.com/docs/git/vercel-for-github
- Disposable PostgreSQL CI: https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers

Consult current provider terms before deployment; do not hardcode price assumptions into
product code or treat a technical workaround as permission to bypass a plan restriction.
