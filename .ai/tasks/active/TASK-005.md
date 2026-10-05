---
id: TASK-005
title: POST /api/auth/login (US-002 backend)
team: backend
priority: HIGH
status: IN_PROGRESS
assigned_agent: backend-1
dependencies: [TASK-003, TASK-004]
branch: null
pr: null
review_cycles: 0
---

## Description

Implement credential login per API_CONTRACTS §2.2 and PRD US-002. Extends the auth
route/controller files created by TASK-004 (hence the dependency — one task owns those
files at a time).

## Requirements

- `POST /api/auth/login` in `src/routes/auth.routes.js` / `src/controllers/auth.controller.js`.
- Validation: `email` required and valid format; `password` required (API_CONTRACTS §2.2).
- Look the user up by lowercase email with the password explicitly selected
  (`+password`), because the model marks it `select: false`.
- Unknown email AND wrong password MUST both return the identical
  `401 { code: "INVALID_CREDENTIALS", message: "Invalid credentials" }` — do not reveal
  which field is wrong (no user enumeration, PRD US-002).
- Use `matchPassword()` (bcrypt.compare) — never compare or log plaintext.
- Success → `200` with `{ success: true, data: { user: { id, name, email }, token } }`.
- Token produced by `generateToken()`.
- Never log passwords, hashes, or tokens.

## Expected Areas / Files

| File | Action |
|------|--------|
| `server/src/routes/auth.routes.js` | Modified (add login route) |
| `server/src/controllers/auth.controller.js` | Modified (add login handler) |
| `server/tests/integration/auth.login.test.js` | Added |

## Acceptance Criteria

- [ ] Valid credentials return 200 with `user` and a verifiable `token`
- [ ] Unknown email and incorrect password produce byte-identical 401 responses
      (`INVALID_CREDENTIALS`)
- [ ] Missing email or password returns 400 `VALIDATION_ERROR`
- [ ] Login for an existing user works even though `password` has `select: false`
- [ ] Response body never contains the password field
- [ ] `npm test` and `npm run lint` pass

## Testing Requirements

- Integration (supertest + `mongodb-memory-server`):
  - registered user logs in → 200, token verifies against `JWT_SECRET`
  - wrong password → 401 `INVALID_CREDENTIALS`
  - unknown email → 401 `INVALID_CREDENTIALS`, and the body is identical to the
    wrong-password case (assert equality to prevent enumeration regressions)
  - missing fields → 400 `VALIDATION_ERROR`
- Regression guard: assert no response body includes `password`.
