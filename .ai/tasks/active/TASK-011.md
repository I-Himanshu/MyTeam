---
id: TASK-011
title: AuthContext and route guards (protected/public routes)
team: frontend
priority: HIGH
status: PR_CREATED
assigned_agent: frontend-1
dependencies: [TASK-010]
branch: feature/TASK-011
pr: https://github.com/I-Himanshu/MyTeam/pull/10
review_cycles: 0
---

## Description

Implement authentication state and route protection per ARCHITECTURE §4.1/§4.2 and PRD
US-003: unauthenticated users are redirected to `/login`, and the dashboard/profile are
only reachable with a valid token. This task owns `src/App.jsx` route wiring and the
`context/` directory; page tasks must not edit them.

## Requirements

- `src/context/AuthContext.jsx` exposing `useAuth()` with:
  - State: `user`, `token`, `loading`, `error`
  - `login(credentials)`, `logout()`, `loadUser()` built on TASK-010 services
  - Session restore on mount: if a token exists, call `me()` to hydrate `user`;
    if it fails with 401, clear the session (handled by the api interceptor)
  - `register()` is NOT part of context — PRD US-001 redirects to login after
    registering, so the Register page calls `authService.register()` directly
- `src/components/ProtectedRoute.jsx` — no/invalid token → redirect to `/login`;
  otherwise render children/outlet. Include a loading state so a restoring session does
  not flash a redirect.
- `src/components/PublicRoute.jsx` — an already-authenticated user visiting `/login` or
  `/register` is redirected to `/dashboard`.
- Wire both guards into `src/App.jsx`:
  `/dashboard` and `/profile` protected; `/login` and `/register` public.
- Loading and error states must be handled explicitly (ENGINEERING_RULES §3.3).
- Do not implement page contents in this task.

## Expected Areas / Files

| File | Action |
|------|--------|
| `client/src/context/AuthContext.jsx` | Added |
| `client/src/components/ProtectedRoute.jsx` | Added |
| `client/src/components/PublicRoute.jsx` | Added |
| `client/src/App.jsx` | Modified (wrap routes with guards) |
| `client/src/context/AuthContext.test.jsx` | Added |
| `client/src/components/ProtectedRoute.test.jsx` | Added |

## Acceptance Criteria

- [ ] Unauthenticated visit to `/dashboard` or `/profile` redirects to `/login`
- [ ] Authenticated visit to `/login` or `/register` redirects to `/dashboard`
- [ ] A stored token triggers `me()` on mount and hydrates the user name
- [ ] A stored-but-invalid token results in a clean logout (no crash, ends at `/login`)
- [ ] `logout()` clears token storage and auth state
- [ ] No redirect flash while the session is restoring
- [ ] `npm test` and `npm run lint` pass

## Testing Requirements

- Component tests with `auth.service` mocked (external dependency):
  - `ProtectedRoute` redirects without a token, renders with a valid session
  - `PublicRoute` redirects authenticated users away from `/login`
  - `AuthContext` login success populates `user`; failure surfaces `error`
  - session restore success and 401-failure paths
  - `logout()` clears state and storage
- Tests must assert navigation outcomes (where the user lands), not just state flags.
