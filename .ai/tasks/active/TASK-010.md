---
id: TASK-010
title: Frontend API service layer and JWT token storage
team: frontend
priority: HIGH
status: PR_CREATED
assigned_agent: frontend
dependencies: [TASK-009]
branch: feature/TASK-010
pr: https://github.com/I-Himanshu/MyTeam/pull/7
review_cycles: 0
---

## Description

Build the centralized API service module required by ARCHITECTURE §4.3 and
ENGINEERING_RULES §3.3. Every page-level feature task consumes this layer, so it lands
before auth state and pages. It defines where and how the JWT lives on the client
(PRD US-002: "Token is stored securely on the client side").

## Requirements

- `src/services/api.js` — Axios instance with `baseURL` from `VITE_API_BASE_URL`.
  - Request interceptor attaches `Authorization: Bearer <token>` when a token exists.
  - Response interceptor normalizes errors to `{ message, code }` so components can render
    consistent messages (ENGINEERING_RULES §3.3: handle loading/success/error states).
  - On `401` responses: clear the stored token and redirect to `/login` (graceful token
    expiration) — avoid redirect loops when already on `/login`.
- `src/utils/tokenStorage.js` — `getToken()`, `setToken()`, `clearToken()` using
  `localStorage`.
  - **Documented trade-off (required by ENGINEERING_RULES §3.3):** localStorage is chosen
    for Phase 1 because the API contract returns a bearer token in JSON and no
    httpOnly-cookie flow exists; it is reachable by XSS, so any rendered server data must
    be escaped by React and no `dangerouslySetInnerHTML` is permitted. Add a short comment
    in the module and record the future httpOnly-cookie improvement in the PR description
    as an ADR candidate for the Manager.
- `src/services/auth.service.js` — thin wrappers: `register(payload)`, `login(payload)`,
  `me()`, matching API_CONTRACTS §2.1–§2.3 request/response shapes.
  (Profile service functions are added by TASK-015.)
- Add dependency: `axios`.
- No React components or context in this task.

## Expected Areas / Files

| File | Action |
|------|--------|
| `client/src/services/api.js` | Added |
| `client/src/services/auth.service.js` | Added |
| `client/src/utils/tokenStorage.js` | Added |
| `client/package.json` | Modified (axios) |
| `client/src/services/api.test.js` | Added |
| `client/src/utils/tokenStorage.test.js` | Added |
| `client/src/services/auth.service.test.js` | Added |

## Acceptance Criteria

- [ ] Requests carry `Authorization: Bearer` only when a token exists
- [ ] 401 responses clear the token and redirect to `/login` (and do not loop)
- [ ] Errors are normalized to `{ message, code }` for UI consumption
- [ ] Token storage is fully encapsulated in `tokenStorage.js` (no direct
      `localStorage` calls elsewhere — grep-verifiable)
- [ ] The localStorage trade-off and XSS constraint are documented in code
- [ ] `register()`, `login()`, `me()` match API_CONTRACTS request/response shapes
- [ ] `npm test` and `npm run lint` pass

## Testing Requirements

- Unit with the HTTP layer mocked (axios is an external dependency — mocking it is
  allowed; do not mock the functions under test):
  - auth header attached / omitted
  - 401 clears storage and triggers the login redirect
  - error normalization for 4xx/5xx payloads
- Unit: token storage set/get/clear round-trip and behavior when storage is empty.
- Unit: `auth.service` functions build the correct URLs, methods, and bodies.
