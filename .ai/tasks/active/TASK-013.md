---
id: TASK-013
title: Login page (US-002 frontend)
team: frontend
priority: HIGH
status: PR_CREATED
assigned_agent: frontend-2
dependencies: [TASK-010, TASK-011]
branch: feature/TASK-013
pr: https://github.com/I-Himanshu/MyTeam/pull/13
review_cycles: 0
---

## Description

Build the login form UI for PRD US-002. Uses the service layer for the request and
`AuthContext` for session state, so it must follow both TASK-010 and TASK-011.

## Requirements

- Replace the `src/pages/LoginPage.jsx` placeholder with an `email` + `password` form.
- Client-side validation: email required and valid format, password required
  (API_CONTRACTS §2.2) — client checks are UX only; the server remains authoritative.
- Call `AuthContext.login()`; on success store the token and navigate to `/dashboard`
  (PRD US-002: "Login redirects to the dashboard").
- On `401 INVALID_CREDENTIALS`, display a single clear error message — the message must
  not indicate whether the email or the password was wrong (PRD US-002).
- Show loading/error states; disable submit while in flight (ENGINEERING_RULES §3.4).
- Field-level messages for client validation errors; form-level message for server errors.
- Styling with CSS Modules.

## Expected Areas / Files

| File | Action |
|------|--------|
| `client/src/pages/LoginPage.jsx` | Modified (placeholder → real form) |
| `client/src/pages/LoginPage.module.css` | Added |
| `client/src/pages/LoginPage.test.jsx` | Added |

## Acceptance Criteria

- [ ] Renders email and password fields with a submit button
- [ ] Empty/malformed email or empty password shows a field-level message and blocks submit
- [ ] Successful login navigates to `/dashboard` and the session persists across a reload
- [ ] Invalid credentials show the server's generic message (no user/email enumeration)
- [ ] Submit button disabled during submission
- [ ] Token is written only through `tokenStorage` (no direct `localStorage` usage)
- [ ] `npm test` and `npm run lint` pass

## Testing Requirements

- Component tests with `AuthContext`/services mocked:
  - validation errors block submission and render messages
  - successful login navigates to `/dashboard`
  - `401` renders the generic invalid-credentials error
  - submit disabled while pending
- Assert navigation and visible messages, not component internals.
