# Privacy & security

## Authentication & authorization

- Auth.js v5, Credentials (bcrypt, 12 rounds) + magic-link email, JWT
  sessions (see `src/server/auth.ts` for why Credentials + a DB adapter
  forces JWT here).
- Every Server Action re-derives the user id from `auth()` server-side. No
  action trusts a client-supplied user id.
- Ownership is enforced at the repository layer: mutations filter by
  `{ id, userId }` and throw if the row doesn't match, rather than trusting
  a prior "is this mine" check done elsewhere. Pinned by
  `src/server/repositories/meal-repository.test.ts` against a real database.

## AI privacy

- No image is sent to any AI provider until the user explicitly submits it
  from the "Analyze meal photo" screen (see the disclaimer text on that
  screen and `docs/ai-analysis-flow.md`).
- Only the image and the user's optional free-text note are sent to the
  provider — no name, email, weight, or other profile data.
- Raw provider responses are never stored; only the Zod-validated,
  structurally-sanitized result is persisted on `AIAnalysis.sanitizedResponse`.
- Server logs never include image bytes or full AI payloads.
- `AI_PROVIDER=mock` is the default so the app runs with zero external calls
  and zero paid API keys out of the box.

## Rate limiting

`src/server/ai/rate-limiter.ts` caps meal-photo analysis at 5 requests/minute
per user. It's in-memory and per-process — adequate for local dev and a
single-instance deployment; a multi-instance production deployment should
swap it for a shared store (Redis, etc.) before relying on it as a real
abuse control.

## File uploads

- MIME type allowlist (jpeg/png/webp) and an 8MB size cap, enforced
  server-side in `analyzeMealPhoto`, not just via the `<input accept>` hint.
- Filenames are never derived from user input — `LocalStorageProvider` and
  `S3StorageProvider` both generate a random UUID-based key.
- Users can configure `Settings → Image retention` — the `ImageRetentionPreference`
  enum on `UserProfile` exists for this. **Not yet implemented**: an actual
  scheduled cleanup job that deletes images after the configured period.
  Today the preference is stored but has no enforcement job wired up —
  documented here rather than silently claimed as done.

## Data export & deletion

- `exportUserDataAction` returns the user's full row set (profile, meals,
  weight entries, activity entries) as JSON, downloaded client-side.
- `deleteAccountAction` hard-deletes the `User` row; all owned rows cascade
  via `onDelete: Cascade` in `prisma/schema.prisma`. This is irreversible by
  design (matches the confirmation copy shown before the button is enabled).

## What's out of scope in this pass

- CSRF: Auth.js handles CSRF tokens for its own endpoints; Server Actions get
  Next's built-in Origin-header check. No additional custom CSRF layer was
  added.
- Image EXIF/metadata stripping is not implemented — uploaded images are
  written to storage as-is. If this ships to production with real user
  photos, strip metadata before persisting.
- Prompt-injection hardening for the user's free-text note is limited to the
  system prompt instructing the model to treat it as context, not
  instructions; there's no separate sanitization pass on that string.
