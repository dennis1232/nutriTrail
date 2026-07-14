# NutriTrail

A mobile-first nutrition tracker: manual meal logging, AI-assisted photo
analysis (always reviewed and corrected by the user before saving), barcode
entry, weight/activity tracking, and daily/weekly summaries — in Hebrew (RTL)
and English (LTR).

This is general-wellness tooling, not medical advice or a substitute for a
doctor or registered dietitian. See `/disclaimer` in the app.

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind v4 + shadcn/ui (on
Base UI, not Radix) · PostgreSQL + Prisma · Auth.js v5 · next-intl · Vitest ·
Playwright. See `docs/architecture.md` for the full breakdown and
`docs/implementation-plan.md` for what's built vs. what's a documented gap.

## Prerequisites

- Node.js 20.9+
- Docker (for local Postgres) — or point `DATABASE_URL` at any Postgres 14+
  instance you already have.

## Setup

```bash
cp .env.example .env
# Edit .env: at minimum set AUTH_SECRET (npx auth secret) and DATABASE_URL
# if you're not using the bundled docker-compose Postgres.

docker compose up -d
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open http://localhost:3000. It redirects to `/en` or `/he` based on your
browser's `Accept-Language` header.

**Demo account** (created by `npm run db:seed`): `demo@nutritrail.app` /
`demo1234` — has a completed profile and a couple of logged meals so you can
see the dashboard populated immediately, instead of registering a fresh
account and doing onboarding first.

> `docker-compose.yml` maps Postgres to host port **55432**, not 5432 — this
> avoids colliding with a Postgres instance you might already have running
> locally. If you change it, update `DATABASE_URL` in `.env` to match.

## Everyday commands

```bash
npm run dev          # start the dev server (Turbopack)
npm run build         # production build
npm run typecheck     # tsc --noEmit
npm run lint          # eslint
npm run test          # vitest (unit + DB-backed integration tests)
npm run test:e2e      # playwright (needs `npm run dev` running separately)
npm run db:migrate    # prisma migrate dev
npm run db:seed       # (re-)seed demo foods/account/meals
npm run db:studio     # prisma studio
```

## AI meal analysis without an API key

`AI_PROVIDER=mock` (the default) runs a deterministic offline provider — no
network call, no key required. It varies its output based on keywords in the
optional note you type ("chicken", "rice", "salad", "bread"), so the
review/edit flow is genuinely exercised. Set `AI_PROVIDER=openai` and
`AI_API_KEY` to use a real OpenAI-compatible vision endpoint instead — see
`docs/ai-analysis-flow.md`.

## Barcode lookup without a live external API

Manual barcode entry works out of the box against a small in-memory demo
catalog (`src/server/food-providers/mock-food-provider.ts`) — try
`0000000000017` or `0000000000024`. A real external provider (e.g. Open Food
Facts) would be a second implementation of the same `FoodProvider` interface;
see `docs/implementation-plan.md` for why that live integration isn't wired
up in this pass.

## Documentation

- `docs/implementation-plan.md` — plan, assumptions, phase-by-phase status
- `docs/architecture.md` — layering, data model notes, known gaps
- `docs/ai-analysis-flow.md` — AI provider abstraction and request path
- `docs/privacy-and-security.md` — auth, data handling, what's out of scope

## Using it from your phone — what YOU need to add

Everything is coded and wired; these are the only pieces that require your
secrets/accounts:

1. **Deploy behind HTTPS** (required for camera capture and barcode
   scanning on a phone). Easiest path: Vercel + a hosted Postgres
   (Neon/Supabase). Secrets to set in the host's env settings:
   - `DATABASE_URL` — from your Postgres provider
   - `AUTH_SECRET` — generate with `npx auth secret`
   - `AUTH_URL` — your deployed origin, e.g. `https://yourapp.vercel.app`
   - `STORAGE_PROVIDER=s3` + the five `STORAGE_S3_*` vars — any
     S3-compatible bucket (AWS S3, Cloudflare R2, Backblaze B2). Required on
     Vercel because local-disk uploads don't persist there.
   Then run migrations once against the production DB:
   `npx prisma migrate deploy` (and optionally `npm run db:seed`).
2. **Real AI photo analysis** (optional — mock works without it):
   `AI_PROVIDER=openai`, `AI_API_KEY=sk-…`, `AI_MODEL=gpt-4o-mini` (or any
   OpenAI-compatible vision model).
3. **Magic-link login emails** (optional — password login works without it):
   `SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD/EMAIL_FROM` from any SMTP
   provider (Resend, Postmark, SES…). Without SMTP the magic link is only
   printed to the server log.

Once deployed: open the URL on your phone → browser menu → **Add to Home
Screen**. The PWA manifest + icons are already included, so it installs with
a proper icon and standalone (no-browser-chrome) display. Camera barcode
scanning uses the browser's BarcodeDetector API (Chrome/Android; iOS Safari
falls back to manual entry automatically). Meal-photo capture works on both
platforms via the camera-enabled file input.

Quick LAN test without deploying: `npm run dev`, then open
`http://<your-mac-ip>:3000` from the phone — everything works except
camera/scanner (browsers require HTTPS for camera on non-localhost hosts).

## Deployment notes

- Set `AUTH_URL` to your production origin and generate a fresh
  `AUTH_SECRET` (`npx auth secret`).
- Set `STORAGE_PROVIDER=s3` plus the `STORAGE_S3_*` vars to use the
  S3-compatible adapter instead of local-disk storage — required for any
  deployment target without a persistent local filesystem (e.g. Vercel).
- `next.config.ts` is wrapped with `next-intl`'s plugin; no extra config
  needed beyond `.env` for locale routing to work in production.
