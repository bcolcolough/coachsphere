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
pnpm db:push
pnpm db:seed
pnpm dev
```

The local development auth provider is only enabled when
`ENABLE_DEV_AUTH=true` and the app is not running in production.

Seeded local credentials:

- Admin: `admin@anysphere.co` / `password`
- Listener: `user@anysphere.co` / `password`

Uploaded thumbnails, MP4, and M4A assets are stored outside the public web root
under `.data/uploads` and are streamed through authenticated media routes.

## Configuration notes

- Okta SSO is configured with `OKTA_ISSUER`, `OKTA_CLIENT_ID`, and
  `OKTA_CLIENT_SECRET`.
- Admin access can be bootstrapped through `ADMIN_EMAILS` and/or
  `OKTA_ADMIN_GROUPS`.
- Slack publishing notifications are enabled by setting `SLACK_WEBHOOK_URL`.
  Local development falls back to a console notification provider when Slack is
  not configured.
- The MVP accepts browser-playable MP4 video and M4A/MP4 audio uploads. It does
  not transcode media.

## Scripts

- `pnpm dev` — start the local Next.js server
- `pnpm lint` — run ESLint
- `pnpm typecheck` — run TypeScript without emitting files
- `pnpm test` — run Vitest
- `pnpm build` — create a production build
- `pnpm db:push` — apply the Prisma schema to the local SQLite database
- `pnpm db:seed` — seed local users, a sample episode, thumbnail, and playable M4A audio

## Production follow-ups

- Move media storage to object storage or Mux signed URLs before large-scale
  use.
- Replace local development auth with Anysphere Okta credentials in production.
- Decide whether Slack-only notifications are sufficient or whether email/web
  push should be layered on later.
