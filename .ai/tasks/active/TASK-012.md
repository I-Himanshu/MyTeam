---
id: TASK-012
title: Registration page (US-001 frontend)
team: frontend
priority: HIGH
status: PR_CREATED
assigned_agent: frontend-1
dependencies: [TASK-010]
branch: feature/TASK-012
pr: https://github.com/I-Himanshu/MyTeam/pull/12
review_cycles: 0
---

## Description

Build the registration form UI for PRD US-001. It depends only on the service layer
(TASK-010) — the route already exists as a placeholder from TASK-009 — so it can be built
in parallel with TASK-011 (AuthContext). On success it shows confirmation and redirects
to the login page, per the PRD.

## Requirements

- Replace the `src/pages/RegisterPage.jsx` placeholder with a form: `name`, `email`,
  `password`. No confirm-password field (not in the PRD — YAGNI).
- Client-side validation mirroring the server rules (API_CONTRACTS §2.1): name 2–50 chars,
  valid email format, password ≥ 8 chars.
- Show clear error messages next to the relevant fields (ENGINEERING_RULES §3.4).
- Disable the submit button while the request is in flight; show a loading state.
- Call `authService.register()` from TASK-010; on success display a confirmation message
  and navigate to `/login` (PRD US-001).
- On failure, surface the server error message (`DUPLICATE_EMAIL`, `VALIDATION_ERROR`)
  near the form — never swallow errors.
- No token handling, no AuthContext usage, no storage writes.
- Styling with CSS Modules; no advanced UI (PRD §5).

## Expected Areas / Files

| File | Action |
|------|--------|
| `client/src/pages/RegisterPage.jsx` | Modified (placeholder → real form) |
| `client/src/pages/RegisterPage.module.css` | Added |
| `client/src/pages/RegisterPage.test.jsx` | Added |

## Acceptance Criteria

- [ ] Renders name, email, and password fields with a submit button
- [ ] Client validation blocks submission for name < 2 / > 50 chars, invalid email,
      password < 8 chars, with field-level messages
- [ ] Submit button is disabled during submission
- [ ] Successful registration shows confirmation and lands on `/login`
- [ ] Duplicate email shows the server's `DUPLICATE_EMAIL` message
- [ ] No password is written to storage or logged
- [ ] `npm test` and `npm run lint` pass

## Testing Requirements

- Component tests with `auth.service` mocked:
  - renders fields
  - each validation rule produces its message and blocks the API call
  - valid submit calls `register` with the form values and navigates to `/login`
  - API error (`DUPLICATE_EMAIL`) is displayed to the user
  - submit button disabled while the promise is pending
- Tests assert user-visible behavior (messages, navigation), not internal state.
