---
id: TASK-007
title: GET/PUT /api/users/profile — view and update profile (US-004 backend)
team: backend
priority: HIGH
status: READY
assigned_agent: null
dependencies: [TASK-002, TASK-003]
branch: null
pr: null
review_cycles: 0
---

## Description

Implement the profile read/update endpoints per API_CONTRACTS §3.1 and §3.2 (PRD US-004).
Uses its own route/controller files (`user.*`), so it can be built in parallel with the
auth endpoint tasks. It only touches `src/app.js` for a single router-mount line.

## Requirements

- `src/routes/user.routes.js` mounted at `/api/users` in `src/app.js`;
  `src/controllers/user.controller.js` holds the handlers.
- Both endpoints guarded by `requireAuth`; the affected user id always comes from the
  token — never from the URL or body (no access to other users' data).
- `GET /api/users/profile` → `200` with
  `{ id, name, email, createdAt, updatedAt }` (API_CONTRACTS §3.1).
- `PUT /api/users/profile`:
  - Validation: `name` optional, string, 2–50 chars (API_CONTRACTS §3.2).
  - Updates ONLY `name`. `email` is displayed but not editable in Phase 1 (PRD US-004):
    an `email` field in the body must be ignored and must never persist.
  - Unknown/extra fields are ignored (do not mass-assign onto the document).
  - Body without `name` → 200 returning the unchanged profile.
  - Success → `200` with `{ id, name, email, updatedAt }` per API_CONTRACTS §3.2.
- Never return `password` or `__v`.

## Expected Areas / Files

| File | Action |
|------|--------|
| `server/src/routes/user.routes.js` | Added |
| `server/src/controllers/user.controller.js` | Added |
| `server/src/app.js` | Modified (mount `/api/users`) |
| `server/tests/integration/user.profile.test.js` | Added |

## Acceptance Criteria

- [ ] `GET` returns the authenticated user's profile with the exact contract shape
- [ ] `GET`/`PUT` without a token return 401 `TOKEN_INVALID`
- [ ] `PUT` with a new name persists it and reflects an updated `updatedAt`
- [ ] `PUT` including an `email` field leaves the stored email unchanged
- [ ] `PUT` with `name` of 1 char or 51 chars returns 400 `VALIDATION_ERROR`
- [ ] `PUT` with an empty body returns 200 with the unchanged profile
- [ ] A user can never read or modify another user's profile
- [ ] No `password` or `__v` in any response
- [ ] `npm test` and `npm run lint` pass

## Testing Requirements

- Integration (supertest + `mongodb-memory-server`):
  - authenticated GET → 200 + exact body
  - unauthenticated GET/PUT → 401
  - PUT valid name → 200 and re-fetch confirms persistence
  - PUT with email in body → 200 but email unchanged in the database
  - PUT with invalid names (too short / too long / wrong type) → 400
  - token for user A attempting to act → only user A's document is touched
