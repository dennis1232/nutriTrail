# AI meal-analysis flow

## Request path

1. Client (`AiPhotoAnalyzer`) uploads an image + optional free-text note via
   `analyzeMealPhoto` (`src/server/actions/ai-actions.ts`), a Server Action
   invoked with `FormData`.
2. The action: checks auth, checks the per-user rate limit
   (`src/server/ai/rate-limiter.ts`, 5 requests/minute in-memory), validates
   MIME type (jpeg/png/webp only) and size (≤8MB), saves the image via the
   storage abstraction, then calls the configured `MealAnalysisProvider`.
3. The provider's raw output is parsed through `mealAnalysisResultSchema`
   (Zod) before anything is returned to the client or written to the
   database — this is non-negotiable per the product requirement that the
   app must never trust raw model output.
4. An `AIAnalysis` row is written recording `provider`, `model`,
   `promptVersion`, `status`, and the *sanitized* (schema-validated) result —
   never the raw request/response payload and never the image bytes
   themselves.
5. The client renders every detected food as an editable row
   (`MealItemsForm`/`DraftMealItem`) with its confidence score and any
   `assumptions` surfaced as visible text. Nothing is saved until the user
   presses "Save meal", which goes through the same `saveMeal` action (and
   the same server-side nutrition validation) as every other meal-entry
   path.

## Provider abstraction

`MealAnalysisProvider` (`src/server/ai/provider.ts`) has one method,
`analyzeMeal`. Two implementations exist:

- `MockMealAnalysisProvider` (default, `AI_PROVIDER=mock`): no network call,
  no API key. It varies its output based on keywords in the user's note
  (`chicken`, `rice`, `salad`, `bread`) so the review/edit flow is genuinely
  exercised in dev and in the Playwright suite, and falls back to a generic
  low-confidence "Mixed plate" item otherwise. Every item's `confidence` is
  `< 1` and `needsUserReview` is always `true`, matching the "never claim
  exact accuracy" rule.
- `OpenAiMealAnalysisProvider` (`AI_PROVIDER=openai`): calls an
  OpenAI-compatible chat-completions vision endpoint over `fetch`, with a
  20s timeout, up to 2 retries for transient failures (not for malformed
  responses — retrying a bad prompt response won't fix it), and maps
  provider errors to a small `MealAnalysisErrorCode` union
  (`TIMEOUT` / `PROVIDER_UNAVAILABLE` / `INVALID_RESPONSE` / `RATE_LIMITED`)
  so the UI can show a consistent message. **This adapter has not been
  exercised against a live endpoint in this environment** — it's written
  against the documented API shape but only code-reviewed, not integration
  tested, since doing so would require a real API key.

Selecting a provider is a one-line change in
`src/server/ai/index.ts#getMealAnalysisProvider` gated by `env.AI_PROVIDER`.

## Prompt versioning

The system prompt lives in `src/ai/prompts/meal-analysis-v1.ts`, not inlined
in the action or route handler. `MEAL_ANALYSIS_PROMPT_VERSION` is recorded on
every `AIAnalysis` row so a future prompt change (`meal-analysis-v2.ts`) can
be introduced without losing the ability to tell which version produced a
given historical analysis.

## Required output shape

`src/server/ai/schema.ts` mirrors the spec's `MealAnalysisResult` type
almost exactly (camelCase field names matched to the spec's TypeScript
example), with `needsUserReview` pinned to the literal `true` — a response
missing that literal fails validation outright.
