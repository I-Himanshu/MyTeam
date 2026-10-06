---
id: TASK-016
title: Local dev integration — root `npm run dev`, docs, and end-to-end smoke verification
team: backend
priority: HIGH
status: PR_CREATED
assigned_agent: backend-2
dependencies: [TASK-008, TASK-012, TASK-013, TASK-014, TASK-015]
branch: feature/TASK-016
pr: https://github.com/I-Himanshu/MyTeam/pull/25
review_cycles: 0
---

## Description

Final integration gate for the PRD's non-functional requirements (PRD §4): the whole
application must run locally with a single command, environment variables must be
documented, and all four user stories must work together. Cross-cutting task — assigned
to `backend` because it is primarily repo-level tooling and documentation; touch
`client/` only if a config value is missing.

## Requirements

- Root `package.json` with a `dev` script that starts both apps concurrently
  (server on 5000, client on 3000) using a single, justified dev dependency
  (e.g. `concurrently`) — document why it is needed in the commit message.
- Verify `server/.env.example` and `client/.env.example` list every required variable with
  placeholder values and that `CLIENT_URL` matches the client dev origin
  (`http://localhost:3000`) so CORS works out of the box.
- Update the root `README.md` with: prerequisites, env setup, `npm run dev`, test/lint
  commands, and a short architecture/ports summary.
- Run the full verification pass and paste results into the PR:
  1. `npm test` and `npm run lint` in `server/` and `client/`
  2. `npm run build` in `client/`
  3. Manual smoke checklist: register → duplicate-register rejected → login →
     dashboard welcome shows the name → profile view/update → logout →
     protected route redirects to login.
- Confirm no secrets, `.env` files, or build artifacts are committed (AGENTS.md §7).
- **CI note:** `.github/workflows/ci.yml` must not be edited by a developer agent
  (AGENTS.md §8). If backend tests require a MongoDB service or the
  `mongodb-memory-server` binary download, report it to the Manager — the Manager will
  schedule a separate, explicitly approved CI change.

## Expected Areas / Files

| File | Action |
|------|--------|
| `package.json` (root) | Added (`dev` script, workspaces/scripts) |
| `server/.env.example` | Verified/Modified (CLIENT_URL, rate-limit vars) |
| `client/.env.example` | Verified/Modified |
| `README.md` | Modified (setup, run, test instructions) |
| `.gitignore` | Verified (no `.env`, no build output) |
| `.ai/PRD.md` | Modified only to flip Status from Draft → Implemented |

## Acceptance Criteria

- [ ] `npm run dev` at the repo root starts API (5000) and client (3000) together
- [ ] Every environment variable referenced in code appears in the correct `.env.example`
- [ ] README documents install, env setup, run, test, and lint commands
- [ ] Full smoke checklist passes with a real MongoDB and both dev servers running
- [ ] `npm test` and `npm run lint` pass in both `server/` and `client/`;
      `npm run build` passes in `client/`
- [ ] No secrets, `.env` files, `node_modules/`, or build artifacts in the diff
- [ ] No CI/CD files changed without explicit Manager approval
- [ ] All four user stories (US-001 … US-004) verified working end to end

## Testing Requirements

- Not a feature task: it aggregates evidence rather than adding new unit tests.
- PR must contain: test/lint/build output for both packages, plus the completed smoke
  checklist results.
- If any smoke step fails, fix it through a normal task/PR cycle — do not patch on a
  branch outside the workflow.
