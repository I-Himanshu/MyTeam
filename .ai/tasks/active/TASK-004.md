---
id: TASK-004
title: POST /api/auth/register (US-001 backend)
team: backend
priority: HIGH
status: PR_CREATED
assigned_agent: backend-1
dependencies: [TASK-002, TASK-003]
branch: feature/TASK-004
pr: https://github.com/I-Himanshu/MyTeam/pull/9
review_cycles: 0
---

## Description

Implement user registration per API_CONTRACTS §2.1 and PRD US-001. This task also creates
the shared auth route/controller files that TASK-005 (login) and TASK-006 (`/api/auth/me`)
will extend, so those tasks depend on it to avoid conflicting edits.

## Requirements

- `src/routes/auth.routes.js` mounted at `/api/auth` in `src/app.js`;
  `src/controllers/auth.controller.js` holds the handler.
- Validation (API_CONTRACTS §2.1): `name` required 2–50 chars; `email` required and
  valid format; `password` required, minimum 8 characters. Enforced server-side via the
  TASK-003 `validate` middleware (client validation is never sufficient).
- Duplicate email → `400` with `code: "DUPLICATE_EMAIL"` and message
  "Email already registered" — catch the Mongo E11000 error, never return a raw 500.
- Invalid payload → `400 VALIDATION_ERROR` with field messages.
- Success → `201` with exactly the API_CONTRACTS §2.1 shape:
  `{ success: true, data: { user: { id, name, email, createdAt }, token } }`.
- Map MongoDB `_id` to `id` in responses; never return `password`, `__v`, or internal fields.
- `token` produced by `generateToken()` from TASK-003.
- Password hashing comes from the User model — do not hash in the controller.
- Passwords must never be logged.

## Expected Areas / Files

| File | Action |
|------|--------|
| `server/src/routes/auth.routes.js` | Added |
| `server/src/controllers/auth.controller.js` | Added |
| `server/src/app.js` | Modified (mount `/api/auth`) |
| `server/tests/integration/auth.register.test.js` | Added |

## Acceptance Criteria

- [ ] Valid payload returns 201 with `user` and `token` matching the contract exactly
- [ ] The returned token verifies against `JWT_SECRET`
- [ ] Duplicate email returns 400 `DUPLICATE_EMAIL` (not 500)
- [ ] Password < 8 chars, missing name, and malformed email each return 400
      `VALIDATION_ERROR`
- [ ] The persisted password is a bcrypt hash; the response body contains no password
- [ ] Email is stored lowercase
- [ ] Registration does not log the password or token
- [ ] `npm test` and `npm run lint` pass

## Testing Requirements

- Integration (supertest + `mongodb-memory-server`):
  - successful registration → 201, correct body shape, token verifiable
  - duplicate email → 400 `DUPLICATE_EMAIL`
  - each validation rule (name too short/long, bad email, short password) → 400
  - response and database contain no plaintext password
- Tests must assert response bodies and status codes, not just that a request succeeded.
