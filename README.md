# CoachSphere

Internal podcast/video platform MVP for sharing private company stories,
concepts, and go-to-market enablement content.

## Tech stack

- Next.js App Router + TypeScript
- Tailwind CSS
- NextAuth with Okta OIDC and gated local development auth
- Prisma + SQLite for local development
- Slack-first publishing notifications

## Getting started

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The local development auth provider is only enabled when
`ENABLE_DEV_AUTH=true` and the app is not running in production.

## Scripts

- `pnpm dev` — start the local Next.js server
- `pnpm lint` — run ESLint
- `pnpm typecheck` — run TypeScript without emitting files
- `pnpm test` — run Vitest
- `pnpm build` — create a production build

Database and admin publishing functionality is implemented in later phases of
the MVP.
