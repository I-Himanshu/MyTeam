---
id: TASK-008
title: Rate limiting and security hardening on authentication endpoints
team: backend
priority: MEDIUM
status: PR_CREATED
assigned_agent: backend-1
dependencies: [TASK-005]
branch: feature/TASK-008
pr: https://github.com/I-Himanshu/MyTeam/pull/22
review_cycles: 0
---

## Description

ENGINEERING_RULES §2.3 requires rate limiting on authentication endpoints, and
ARCHITECTURE §5 requires CORS restricted to the frontend origin. This task closes that
gap on top of the working login/register endpoints. Source: ENGINEERING_RULES/ARCHITECTURE
(not a PRD user story) — required because reviewers must verify these rules.

## Requirements

- Add `express-rate-limit` (justify the dependency in the commit message per
  ENGINEERING_RULES §6) and apply it to the authentication routes
  (`/api/auth/login`, `/api/auth/register`).
- Exceeded limit → `429` using the API_CONTRACTS §1.3 error envelope with a new
  `RATE_LIMITED` code.
- **Documentation first** (API_CONTRACTS §4): add the `429 / RATE_LIMITED` row to
  `.ai/API_CONTRACTS.md` §1.4 in a separate commit BEFORE implementing the middleware.
  The Manager owns this doc edit; coordinate before starting.
- Rate-limit configuration comes from environment variables with safe defaults and is
  documented in `.env.example` (no secrets).
- Verify CORS allows only `CLIENT_URL` (set in TASK-001) and does not use wildcard
  origins alongside credentials.
- Do not rate-limit non-auth endpoints in this task (YAGNI).
- Never log tokens, passwords, or IP addresses beyond what the middleware needs.

## Expected Areas / Files

| File | Action |
|------|--------|
| `server/src/middleware/rateLimiter.js` | Added |
| `server/src/routes/auth.routes.js` | Modified (attach limiter) |
| `server/.env.example` | Modified (rate-limit config vars) |
| `.ai/API_CONTRACTS.md` | Modified (add 429 `RATE_LIMITED`) |
| `server/tests/integration/auth.rateLimit.test.js` | Added |

## Acceptance Criteria

- [ ] `.ai/API_CONTRACTS.md` documents `429 / RATE_LIMITED` before the code lands
- [ ] Repeated login attempts over the configured threshold return 429 with the standard
      error envelope and `code: "RATE_LIMITED"`
- [ ] Requests under the threshold are unaffected
- [ ] Non-auth endpoints (e.g. `/api/health`) are not rate-limited
- [ ] Threshold/window are configurable via env vars and documented in `.env.example`
- [ ] CORS allows only `CLIENT_URL`
- [ ] `npm test` and `npm run lint` pass

## Testing Requirements

- Integration: use a low test threshold (e.g. `max: 2`) to assert 200/401 responses
  before the limit and 429 with the correct envelope after it.
- Unit: limiter configuration reads and validates its environment variables.
- Regression: a successful login still works in a fresh test instance (limiter state reset
  between tests — do not share limiter state across test files).
