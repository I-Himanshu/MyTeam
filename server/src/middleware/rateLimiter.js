import { rateLimit, MemoryStore } from 'express-rate-limit';

/**
 * Rate limiting for authentication endpoints (ENGINEERING_RULES §2.3).
 *
 * Applied to `POST /api/auth/login` and `POST /api/auth/register` only —
 * non-auth endpoints are intentionally unlimited (YAGNI). When the budget is
 * exceeded the limiter answers `429` with the standard API_CONTRACTS §1.3
 * error envelope (`code: "RATE_LIMITED"`) and a `Retry-After` header.
 *
 * Configuration comes from the environment with safe defaults and is
 * documented in `server/.env.example`:
 *
 * - `RATE_LIMIT_WINDOW_MS` — window length, read once at startup.
 * - `RATE_LIMIT_MAX` — max auth requests per IP per window, resolved on
 *   every request so tests can lower the threshold via env vars without
 *   re-importing modules.
 *
 * Privacy: this middleware never logs tokens, passwords, or IP addresses —
 * the client key stays inside the hit counter only.
 */

/** Window in ms: 15 minutes. */
export const DEFAULT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

/** Max auth requests per IP per window. */
export const DEFAULT_RATE_LIMIT_MAX = 100;

/**
 * Parse a positive integer env value, falling back when it is missing,
 * blank, non-numeric, fractional, or non-positive.
 *
 * @param {string | undefined} raw Raw env value.
 * @param {number} fallback Value to use when `raw` is unusable.
 * @returns {number} A positive integer.
 */
export function parsePositiveInt(raw, fallback) {
  if (raw === undefined || raw === null || `${raw}`.trim() === '') {
    return fallback;
  }
  const parsed = Number(`${raw}`.trim());
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

/**
 * Resolve the rate-limit configuration from the environment.
 *
 * @param {Record<string, string | undefined>} [env=process.env] Env source.
 * @returns {{windowMs: number, limit: number}} Validated config.
 */
export function resolveRateLimitConfig(env = process.env) {
  return {
    windowMs: parsePositiveInt(env.RATE_LIMIT_WINDOW_MS, DEFAULT_RATE_LIMIT_WINDOW_MS),
    limit: parsePositiveInt(env.RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_MAX),
  };
}

// Window is fixed for the process lifetime; the threshold is read per
// request (see below) so tests can reconfigure it through the environment.
const { windowMs: RATE_LIMIT_WINDOW_MS } = resolveRateLimitConfig();

/**
 * Backing hit counter. Exported so tests can clear it between cases via
 * `resetAuthRateLimiter()` without touching route wiring.
 */
export const authRateLimitStore = new MemoryStore();

/**
 * Drop every recorded hit, giving the next request a fresh budget. Used by
 * tests to isolate cases that share this module's limiter instance.
 *
 * @returns {Promise<void>}
 */
export function resetAuthRateLimiter() {
  return authRateLimitStore.resetAll();
}

/**
 * Rate-limit middleware for the auth routes. The threshold is resolved from
 * `RATE_LIMIT_MAX` on each request; anything unusable falls back to
 * `DEFAULT_RATE_LIMIT_MAX`.
 *
 * @type {import('express').RequestHandler}
 */
const authRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: () => parsePositiveInt(process.env.RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_MAX),
  store: authRateLimitStore,
  // Emit `RateLimit-*` headers; the legacy `X-RateLimit-*` headers stay off.
  standardHeaders: true,
  legacyHeaders: false,
  // Render the §1.3 envelope instead of the library's plain-text default,
  // and always advertise when the client may retry (API_CONTRACTS §1.4).
  handler: (_req, res) => {
    res.set('Retry-After', String(Math.max(1, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000))));
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests, please try again later',
        code: 'RATE_LIMITED',
      },
    });
  },
});

export default authRateLimiter;
