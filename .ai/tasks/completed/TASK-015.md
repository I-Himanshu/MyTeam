---
id: TASK-015
title: Profile page — view and edit name (US-004 frontend)
team: frontend
priority: HIGH
status: MERGED
assigned_agent: frontend-1
dependencies: [TASK-007, TASK-011]
branch: feature/TASK-015
pr: https://github.com/I-Himanshu/MyTeam/pull/19
review_cycles: 0
---

## Description

Build the profile page for PRD US-004 on top of the profile endpoints (TASK-007) and the
auth state (TASK-011): display name and email, allow editing the name only, and confirm
saved changes.

## Requirements

- Replace the `client/src/pages/ProfilePage.jsx` placeholder (route is already protected).
- Add `src/services/user.service.js` with `getProfile()` and `updateProfile({ name })`
  matching API_CONTRACTS §3.1/§3.2.
- Load the profile on mount; render `name` and `email`.
- `email` is displayed read-only (an `<input>` with `disabled`/`readOnly`, no change
  handler) — PRD US-004: email is not editable in Phase 1.
- Editable `name` field with client validation 2–50 chars; field-level error messages.
- Save → `updateProfile()`; on success show a confirmation message and refresh the
  displayed values (PRD US-004: "Changes are saved and confirmed to the user").
- Handle loading, success, and error states; disable the save button while in flight.
- Keep `AuthContext` user name in sync after a name change if the context is the source
  for the dashboard welcome message.
- Styling with CSS Modules.

## Expected Areas / Files

| File | Action |
|------|--------|
| `client/src/pages/ProfilePage.jsx` | Modified (placeholder → profile form) |
| `client/src/pages/ProfilePage.module.css` | Added |
| `client/src/pages/ProfilePage.test.jsx` | Added |
| `client/src/services/user.service.js` | Added |
| `client/src/services/user.service.test.js` | Added |

## Acceptance Criteria

- [ ] Displays the current name and email after load
- [ ] Email field is not editable (no successful change possible)
- [ ] Name updates validate 2–50 chars with field-level errors
- [ ] Saving shows a confirmation and the new name persists after a reload
- [ ] Server validation errors (400) are surfaced to the user
- [ ] Loading and error states are implemented; save disabled while pending
- [ ] No other user's data is ever requested (profile comes from the token's user)
- [ ] `npm test` and `npm run lint` pass

## Testing Requirements

- Unit: `user.service` calls the correct endpoints/bodies (HTTP layer mocked).
- Component tests with services mocked:
  - renders fetched name/email; email input is read-only
  - name validation errors block saving
  - successful save renders confirmation and shows the new value
  - API error is displayed
  - save button disabled while pending
