# Local Development

Last updated: 2026-06-09

## Requirements

- Node.js compatible with Nuxt 4.
- pnpm.
- OAuth credentials for enabled providers.
- Local or remote PostgreSQL-compatible database depending on the selected setup.

The repo currently contains `pnpm-lock.yaml`, so pnpm is the expected package manager.

## Install

```bash
pnpm install
```

Nuxt runs `nuxt prepare` during postinstall.

## Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Current documented variables:

```env
NUXT_OAUTH_GOOGLE_CLIENT_ID=
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=
NUXT_OAUTH_GITHUB_CLIENT_ID=
NUXT_OAUTH_GITHUB_CLIENT_SECRET=
NUXT_SESSION_PASSWORD=
```

Rules:

- Never commit `.env`.
- Never send secrets in public chats.
- Keep `.env.example` as names-only documentation.
- Production/preview secrets should live in hosting provider environment variables.

## Run

```bash
pnpm dev
```

Default URL:

```text
http://localhost:3000
```

## Build

```bash
pnpm build
```

## Preview

```bash
pnpm preview
```

## Current Limitations

- README and docs are being established now.
- Database setup/migrations are not fully documented yet.
- OAuth callback URLs must be configured in Google/GitHub provider settings.
- SSR is currently disabled.
- No tests or lint/typecheck scripts are configured in `package.json`.

## Expected Next DX Improvements

- Add `typecheck`, `lint`, and test scripts.
- Add CI workflow.
- Document database provisioning.
- Document OAuth app setup.
- Add seed/demo data workflow.

