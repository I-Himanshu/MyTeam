---
id: TASK-014
title: Protected dashboard with welcome message and logout (US-003 frontend)
team: frontend
priority: HIGH
status: IN_PROGRESS
assigned_agent: frontend-2
dependencies: [TASK-006, TASK-011]
branch: null
pr: null
review_cycles: 0
---

## Description

Build the protected dashboard for PRD US-003: proof that the session is active, a welcome
message using the user's name, and a logout button. Depends on the backend
`GET /api/auth/me` (TASK-006) and the frontend auth state/guards (TASK-011).

## Requirements

- Replace the `src/pages/DashboardPage.jsx` placeholder.
- Route is already protected by `ProtectedRoute` from TASK-011 — do not modify
  `App.jsx` or the guards in this task.
- Display a welcome message containing the authenticated user's name
  (from `AuthContext`; hydrate via `me()` if not already loaded).
- Logout button → `AuthContext.logout()` clears token + state, then navigates to
  `/login` and does not allow back-navigation to the dashboard.
- Explicit loading state while the user is being hydrated, and an error state with a
  retry path if `me()` fails (ENGINEERING_RULES §3.3).
- Styling with CSS Modules; no charts/widgets (PRD §5 out of scope).

## Expected Areas / Files

| File | Action |
|------|--------|
| `client/src/pages/DashboardPage.jsx` | Modified (placeholder → dashboard) |
| `client/src/pages/DashboardPage.module.css` | Added |
| `client/src/pages/DashboardPage.test.jsx` | Added |

## Acceptance Criteria

- [ ] Shows a welcome message including the logged-in user's name
- [ ] Unauthenticated access is redirected to `/login` (guard behavior verified end-to-end)
- [ ] Logout clears the session and lands on `/login`; the dashboard is unreachable
      afterwards (including via browser back)
- [ ] Loading and error states are both implemented and visible
- [ ] No `password` or sensitive data rendered or logged
- [ ] `npm test` and `npm run lint` pass

## Testing Requirements

- Component tests with `auth.service` mocked:
  - renders the welcome message with a supplied user name
  - loading state shown until hydration completes
  - error path renders an error message with a retry affordance
  - clicking logout clears storage and navigates to `/login`
- Integration-style route test: rendering the app without a session at `/dashboard`
  lands on `/login`.
