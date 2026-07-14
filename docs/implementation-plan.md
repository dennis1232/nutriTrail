# Implementation Plan — NutriTrail (working name)

## 1. Existing repository

Fresh `create-next-app` output: Next.js 16.2.10, React 19.2.4, TypeScript 7,
Tailwind v4, ESLint flat config. App Router, no src/pages router. No backend,
no DB, no auth, no tests. Nothing to preserve except the toolchain versions —
built on top of them rather than downgrading.

`AGENTS.md` flags that Next 16 has real breaking changes vs. older training
data. Confirmed via `node_modules/next/dist/docs/.../upgrading/version-16.md`:

- `params` / `searchParams` are **always async** (Promises) in layouts, pages,
  route handlers — no sync fallback.
- `middleware.ts` is deprecated in favor of `proxy.ts` (export `proxy`, not
  `middleware`). Runtime is always `nodejs`.
- `next lint` is removed; ESLint flat config + `eslint` CLI directly (already
  reflected in this repo's `package.json`).
- Turbopack is the default bundler for `dev`/`build`.
- `revalidateTag` requires a second `cacheLife` arg; prefer `updateTag` for
  read-your-writes after mutations.

All server actions / route handlers / pages in this project are written
against these rules from the start.

## 2. Architecture

- **Next.js App Router**, locale-prefixed routes (`/[locale]/...`) via
  `next-intl` for Hebrew (RTL, primary) and English (LTR).
- **Service layer** (`src/server/services/*`): pure domain logic (nutrition
  math, calorie targets, AI validation) with zero Next.js/Prisma imports where
  possible, so it can be lifted into a standalone NestJS service later without
  a rewrite. Server Actions and Route Handlers are thin adapters that call
  into services.
- **Data access** (`src/server/repositories/*`): Prisma-backed, one file per
  aggregate (meals, foods, users, weight, activity). Only repositories touch
  `prisma.*`.
- **Auth.js** (credentials + email magic link), session in DB via Prisma
  adapter.
- **AI abstraction** (`src/server/ai/*`): `MealAnalysisProvider` interface,
  `MockMealAnalysisProvider` (default, no API key needed) and an
  `OpenAiMealAnalysisProvider`-style adapter gated by env vars. All output
  validated with Zod before it ever reaches the DB.
- **Storage abstraction** (`src/server/storage/*`): local filesystem adapter
  for dev, S3-compatible adapter interface for prod, selected by env var.
- **Food provider abstraction** (`src/server/food-providers/*`): barcode
  lookup interface with a mock/local provider now; Open Food Facts adapter
  interface stubbed for later — not implemented against the live API in this
  pass (see §5 assumptions).

## 3. Files created/changed (high level, grows per phase)

```
docs/implementation-plan.md        (this file)
docs/architecture.md
docs/ai-analysis-flow.md
docs/privacy-and-security.md
README.md
.env.example
docker-compose.yml
prisma/schema.prisma
prisma/seed.ts
src/i18n/*                         next-intl config + messages/{en,he}.json
src/app/[locale]/layout.tsx         RTL/LTR aware root shell
src/app/[locale]/(public)/...       landing, login, register, legal
src/app/[locale]/(app)/...          today, add-meal, meal/[id], history, progress, settings
src/server/db.ts                   Prisma client singleton
src/server/auth.ts                 Auth.js config
src/server/services/*              nutrition-calculation, calorie-target, ai-validation
src/server/repositories/*
src/server/ai/*                    provider interface, mock provider, prompts
src/server/storage/*
src/server/actions/*               Server Actions per domain
src/components/*                   shared UI (progress ring, macro bar, food row, meal card, ...)
vitest.config.ts, playwright.config.ts
.github/workflows/ci.yml
```

## 4. Assumptions (documented per ambiguous requirement)

1. **Package manager**: npm (matches existing `package-lock.json`).
2. **App name**: "NutriTrail" as a placeholder original brand — user can
   rename later; no CalBuddy branding/colors reused.
3. **Auth**: Auth.js Credentials provider (email+password, hashed with
   bcrypt) for the primary flow; magic-link email provider wired against a
   console/log transport in dev (no real SMTP required to run locally).
4. **Real AI provider**: adapter built against a generic vision-capable chat
   completion API (OpenAI-compatible shape) behind env vars, but **disabled
   by default** — mock provider is the default so the app runs with zero paid
   API keys. Enabling the real provider is opt-in via `AI_PROVIDER=openai`.
5. **Barcode external lookup**: provider abstraction + local/mock provider
   implemented and cached like a real one; a real Open Food Facts adapter is
   stubbed (interface + TODO) rather than calling the live network in this
   pass, to avoid an untested runtime dependency on a third party inside an
   agentic build. Manual barcode entry + manual product creation fully work.
1. **Units**: both metric and imperial supported; stored internally in
   metric (kg, cm) and converted for display.
2. **Activity/HealthKit**: manual entry only, per spec — no fake wearable
   integrations.
3. **Given the size of this spec**, phases 1–4 (foundation, onboarding,
   manual logging, AI photo analysis with mock provider) are the priority for
   a working, tested MVP in this pass. Phases 5–7 (barcode scanner UI,
   full history/progress charts, production hardening, CI, Playwright
   suite) are scaffolded with real, non-fake implementations as far as time
   allows; anything not finished is left as an explicit TODO in this file's
   status table below, never as silently-fake UI.

## 5. Implementation order

Phase 1 → 2 → 3 → 4 → 5 → 6 → 7, per AGENTS.md. Status as of this pass —
"verified" means driven end-to-end in a real browser (Playwright) against
the real dev database, not just typechecked:

| Phase | Status |
|---|---|
| 1. Foundation (Next/TS/Tailwind/shadcn, Prisma+Postgres, Auth.js, next-intl, Docker Compose, env validation) | done, verified |
| 2. Onboarding (adult date-of-birth check, body/goal steps, Mifflin-St Jeor target, user override) | done, verified |
| 3. Manual meal logging (food search, custom food, dashboard, history, saved/recent meals, weight & activity entries, settings) | done, verified |
| 4. AI image analysis (mock provider, review/edit before save, rate limiting, error states) | done, verified |
| 5. Barcode / external food data | partial — manual entry + mock provider done and verified; no camera scanner UI, no live external API (see §4 assumption 5) |
| 6. History & progress | done, verified (date navigation, weekly averages, weight chart, activity log) |
| 7. Production readiness | partial — security/privacy documented (`docs/privacy-and-security.md`), CI workflow added, one Playwright suite (`tests/e2e/core-flows.spec.ts`) added; image-retention cleanup job, PWA manifest, and full accessibility/perf audit not done |

### Known gaps, stated plainly

- No PWA manifest/service worker.
- No camera-based barcode scanning (manual entry only).
- Real OpenAI-compatible AI provider and the S3 storage adapter are written
  against their documented APIs but not exercised against a live endpoint in
  this environment — only the mock AI provider and local-disk storage have
  been run and tested here.
- Image-retention preference is stored but not enforced by any cleanup job.
- Test coverage is unit + integration (Vitest, including a real-DB ownership
  test) plus one Playwright end-to-end spec covering the core path
  (register → onboard → manual meal → AI mock photo meal → weight entry →
  locale switch), not the full matrix of Playwright specs listed in the
  original spec.
