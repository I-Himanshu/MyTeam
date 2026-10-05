---
id: TASK-003
title: Shared middleware — input validation helper, JWT auth guard, and token utility
team: backend
priority: CRITICAL
status: READY
assigned_agent: null
dependencies: [TASK-001]
branch: null
pr: null
review_cycles: 0
---

## Description

Build the reusable middleware layer that every authenticated endpoint depends on:
server-side validation (ENGINEERING_RULES §2.3), JWT verification (ARCHITECTURE §3.2),
and token generation. Keeping these in one task prevents register/login/me from each
reinventing them.

## Requirements

- `src/middleware/validate.js` — runs express-validator validation chains and converts
  failures into `400` with the API_CONTRACTS §1.3 error envelope and code
  `VALIDATION_ERROR`, including human-readable, field-specific messages.
- `src/middleware/requireAuth.js` —
  - No / malformed `Authorization` header → `401 TOKEN_INVALID`
  - Expired token → `401 TOKEN_EXPIRED`
  - Invalid signature / malformed JWT → `401 TOKEN_INVALID`
  - Valid token → attach the authenticated user id to the request (e.g. `req.userId`)
- `src/utils/token.js` — `generateToken(userId)` signs a JWT with `JWT_SECRET`,
  `expiresIn: JWT_EXPIRES_IN`, payload `{ sub: userId }`.
- Error messages and codes must match API_CONTRACTS §1.4; never expose stack traces.
- Never log tokens, secrets, or passwords (ENGINEERING_RULES §2.3).
- Add dependencies: `jsonwebtoken`, `express-validator`.
- Failure responses must be identical in shape for all auth failures so clients can parse
  them uniformly.

## Expected Areas / Files

| File | Action |
|------|--------|
| `server/src/middleware/requireAuth.js` | Added |
| `server/src/middleware/validate.js` | Added |
| `server/src/utils/token.js` | Added |
| `server/package.json` | Modified (deps) |
| `server/tests/unit/requireAuth.test.js` | Added |
| `server/tests/unit/validate.test.js` | Added |
| `server/tests/unit/token.test.js` | Added |

## Acceptance Criteria

- [ ] Missing, malformed, and expired tokens each return 401 with the correct code
      (`TOKEN_INVALID` vs `TOKEN_EXPIRED`)
- [ ] A valid token allows the request through and populates the user id on the request
- [ ] Validation failures return 400 `VALIDATION_ERROR` with per-field messages
- [ ] No endpoint business logic or database access is implemented in this task
- [ ] No token or secret value appears in logs or error responses
- [ ] `npm test` and `npm run lint` pass

## Testing Requirements

- Unit: `requireAuth` — missing header, `Bearer` with empty value, tampered signature,
  expired token (sign with `expiresIn: 0s`), and valid token paths.
- Unit: `generateToken` — payload contains the subject id, verifies against `JWT_SECRET`,
  and respects the configured expiry.
- Unit: `validate` — a representative chain passes valid input and rejects invalid input
  with `VALIDATION_ERROR`.
- Use a real JWT secret in tests; do not mock `jsonwebtoken` (it is the thing under test).
