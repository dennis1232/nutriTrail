/**
 * Simple in-memory fixed-window rate limiter for AI analysis requests.
 * Sufficient for a single-instance deployment; a multi-instance production
 * deployment should replace this with a shared store (e.g. Redis) — see
 * docs/privacy-and-security.md.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;

const requestLog = new Map<string, number[]>();

export function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(userId) ?? []).filter(
    (ts) => now - ts < WINDOW_MS,
  );

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    requestLog.set(userId, timestamps);
    return true;
  }

  timestamps.push(now);
  requestLog.set(userId, timestamps);
  return false;
}
