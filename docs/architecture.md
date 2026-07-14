# Architecture

## Stack

- Next.js 16 (App Router, Turbopack), TypeScript strict, React 19.
- Tailwind CSS v4 + shadcn/ui — note this shadcn/ui build is on **Base UI**
  (`@base-ui/react`), not Radix. Composable primitives use a `render` prop
  (`<Button render={<Link href="/x" />}>`), not `asChild`.
- PostgreSQL + Prisma.
- Auth.js v5 (Credentials + magic-link email, JWT sessions — see
  `src/server/auth.ts` for why Credentials can't use database sessions here).
- next-intl for Hebrew (RTL, primary) / English (LTR) locale routing under
  `src/app/[locale]/...`.
- Vitest (unit + DB-backed integration tests) and Playwright (E2E).

## Layering

```
src/app/[locale]/...        Route segments — thin, mostly server components
src/components/...          Presentational + client-interactive components
src/server/actions/...      Server Actions — auth check, Zod validation, calls into services/repositories
src/server/services/...     Pure domain logic, no Prisma/Next imports
src/server/repositories/... All Prisma access, one file per aggregate
src/server/ai/...           AI provider abstraction, schema validation, mock + real adapters
src/server/storage/...      Image storage abstraction, local + S3 adapters
src/server/food-providers/  Barcode lookup abstraction, mock adapter
src/ai/prompts/...          Versioned AI system prompts
```

This split exists so the domain/service layer (nutrition math, calorie
targets, AI validation, authorization) has no framework dependency and could
be lifted into a standalone NestJS service later without a rewrite — Server
Actions and route handlers are adapters, not where business logic lives.

## Authorization model

Every mutation and every read of user-owned data takes the user id from the
server-side `auth()` session — never from a client-supplied field. Repository
functions that mutate (`updateMealItems`, `deleteMeal`, `deleteSavedMeal`, …)
re-check `where: { id, userId }` before writing, so a request for someone
else's resource fails closed with "not found" rather than leaking existence.
See `src/server/repositories/meal-repository.test.ts` for the tests that
pin this behavior against a real database.

## Data model

See `prisma/schema.prisma`. Notable deviations from a naive reading of the
product spec, each because the literal schema shape given in the spec was
ambiguous or incomplete — see `docs/implementation-plan.md` §4 for the full
assumption list:

- `UserProfile.biologicalSex` (optional, defaults to `UNSPECIFIED`) was added
  because the Mifflin-St Jeor BMR formula needs it for accuracy and the spec
  never asked for it during onboarding.
- Nutrition values are stored as `Float` at full precision on `MealItem` /
  `Food`; rounding happens only in `nutrition-calculation-service.ts`'s
  `roundForDisplay`, never before that.

## Known gaps (see status table in implementation-plan.md)

- Barcode scanning is manual-entry + a mock lookup provider; there's no live
  camera scanner UI or a call to a real external food database (Open Food
  Facts, etc.) in this pass — see the assumption note for why.
- The S3 storage adapter and the real (OpenAI-compatible) AI provider are
  implemented against their respective official client / plain `fetch`, but
  neither has been exercised against a live endpoint in this environment —
  only the local storage adapter and the mock AI provider have been run.
- PWA manifest/service worker, Apple Health / Health Connect data-layer
  stubs, and the full Playwright suite listed in the spec are not built out;
  what exists is `tests/e2e/core-flows.spec.ts` covering the primary path.
