---
id: TASK-006
title: GET /api/auth/me — current user session endpoint (US-003 backend)
team: backend
priority: HIGH
status: READY
assigned_agent: null
dependencies: [TASK-005]
branch: null
pr: null
review_cycles: 0
---

## Description

Implement the protected `GET /api/auth/me` endpoint (API_CONTRACTS §2.3, PRD US-003).
The frontend dashboard uses it to prove the session is active and to display the user's
name. Depends on TASK-005 because it shares the auth route/controller files.

## Requirements

- `GET /api/auth/me` guarded by the TASK-003 `requireAuth` middleware.
- On success → `200` with exactly the API_CONTRACTS §2.3 shape:
  `{ success: true, data: { id, name, email, createdAt } }` (note: no `updatedAt`
  in this contract — follow it literally).
- No token / invalid token / expired token → 401 `TOKEN_INVALID` or `TOKEN_EXPIRED`
  (handled by `requireAuth`).
- Valid token whose user no longer exists → `401` (treat the token as unusable) rather
  than a 500. **Contract gap:** API_CONTRACTS §2.3 does not document this error case;
  the Manager will add it to `.ai/API_CONTRACTS.md` before this task starts — record the
  chosen code there and keep implementation and docs in sync (AGENTS.md §9).
- Never return `password` or `__v`.

## Expected Areas / Files

| File | Action |
|------|--------|
| `server/src/routes/auth.routes.js` | Modified (add `/me` route) |
| `server/src/controllers/auth.controller.js` | Modified (add `me` handler) |
| `.ai/API_CONTRACTS.md` | Modified by Manager (document `/me` error case) |
| `server/tests/integration/auth.me.test.js` | Added |

## Acceptance Criteria

- [ ] Valid token returns 200 with `id`, `name`, `email`, `createdAt` only
- [ ] Request without an `Authorization` header returns 401 `TOKEN_INVALID`
- [ ] Expired token returns 401 `TOKEN_EXPIRED`
- [ ] Tampered/forged token returns 401 `TOKEN_INVALID`
- [ ] Token for a deleted user returns 401, never a 500
- [ ] No `password` or `__v` in any response
- [ ] Response matches API_CONTRACTS §2.3 exactly
- [ ] `npm test` and `npm run lint` pass

## Testing Requirements

- Integration (supertest + `mongodb-memory-server`):
  - authenticated request → 200 with the exact contract body
  - missing / malformed / expired / tampered token → 401 with the correct codes
  - deleted-user token → 401
- Each case is a separate test with a descriptive behavior-focused name.
