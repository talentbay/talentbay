# Local Development

Last updated: 2026-07-23

## Requirements

- Node.js 22.
- pnpm 10.33.0.
- PostgreSQL for authenticated and admin workflows.
- Google/GitHub OAuth applications for real sign-in.

The versions are recorded in `package.json` and `.mise.toml`.

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Default URL: `http://localhost:3000`.

Required session value:

```env
NUXT_SESSION_PASSWORD=a-random-value-at-least-32-characters-long
```

Optional for public preview mode:

```env
DATABASE_URL=
NUXT_OAUTH_GOOGLE_CLIENT_ID=
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=
NUXT_OAUTH_GITHUB_CLIENT_ID=
NUXT_OAUTH_GITHUB_CLIENT_SECRET=
```

Without `DATABASE_URL`, `/jobs` and relocation preview work from labelled demo data. Database-backed auth/profile/application/admin routes do not.

Never commit `.env` or send production credentials in chat.

## Database

After provisioning PostgreSQL:

```bash
pnpm db:migrate
```

Useful development commands:

```bash
pnpm db:generate
pnpm db:studio
```

`db:push` is for deliberate local prototyping only; shared environments should use migrations.

## Quality Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

ESLint currently reports non-blocking formatting/security warnings in redirected legacy presentation files. New and active MVP code has no lint errors.

## OAuth Callbacks

Provider callback URLs must match the deployment origin:

```text
https://<origin>/api/v1/auth/google
https://<origin>/api/v1/auth/github
```

Exact provider configuration must be checked again when preview and production domains are known.
