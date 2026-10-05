---
id: TASK-009
title: Frontend scaffolding — Vite React app, routing skeleton, and test tooling
team: frontend
priority: CRITICAL
status: PR_CREATED
assigned_agent: frontend
dependencies: []
branch: feature/TASK-009
pr: https://github.com/I-Himanshu/MyTeam/pull/3
review_cycles: 0
---

## Description

Create the `client/` frontend foundation described in `.ai/ARCHITECTURE.md` §2 and §4:
the React app, folder structure, router with placeholder pages, app shell, and the
lint/test toolchain. Runs fully in parallel with TASK-001 (separate directory, no shared
files). No auth logic yet — that is TASK-010/TASK-011.

## Requirements

- Scaffold with **Vite** + React (PRD §3.2 allows CRA or Vite; Vite is chosen because CRA
  is deprecated — record this choice in the PR description).
- `client/package.json` scripts: `dev` (port 3000 per ARCHITECTURE §1), `build`, `test`,
  `lint`.
- Folder structure exactly per ARCHITECTURE §2: `src/components`, `src/pages`,
  `src/context`, `src/services`, `src/utils`, `src/App.jsx`.
- React Router routes with placeholder page components:
  `/login`, `/register`, `/dashboard`, `/profile`; `/` redirects to `/login`.
  Route guards arrive in TASK-011 — only declare the routes here.
- `src/components/Navigation.jsx` — minimal nav shell (placeholder links are fine).
- Styling: CSS Modules (CODING_STANDARDS §4) — a basic app shell is enough, no advanced UI
  (PRD §5 out of scope).
- Dev dependencies: `eslint`, `prettier`, `vitest`, `@testing-library/react`,
  `@testing-library/jest-dom`, `jsdom`.
- Test placement: component tests co-located next to components
  (`LoginPage.test.jsx`) per ENGINEERING_RULES §3.1; shared fixtures live in
  `client/tests/fixtures/` to satisfy ARCHITECTURE §2.
- API base URL convention: `import.meta.env.VITE_API_BASE_URL` with default
  `http://localhost:5000/api` (used by TASK-010). Do not hardcode the URL elsewhere.

## Expected Areas / Files

| File | Action |
|------|--------|
| `client/package.json` | Added |
| `client/vite.config.js` | Added |
| `client/index.html` | Added |
| `client/src/main.jsx` | Added |
| `client/src/App.jsx` | Added (routes + placeholders) |
| `client/src/pages/{LoginPage,RegisterPage,DashboardPage,ProfilePage}.jsx` | Added (placeholders) |
| `client/src/components/Navigation.jsx` | Added |
| `client/src/styles/*` / `*.module.css` | Added |
| `client/.eslintrc.cjs` / `client/.prettierrc` | Added |
| `client/vitest.setup.js` | Added |
| `client/tests/fixtures/` | Added |
| `client/src/App.test.jsx` | Added |
| `client/.env.example` | Added (`VITE_API_BASE_URL`) |

## Acceptance Criteria

- [ ] `npm install && npm run dev` serves the app on port 3000
- [ ] All four routes render their placeholder page; `/` redirects to `/login`
- [ ] Folder structure matches ARCHITECTURE §2
- [ ] `VITE_API_BASE_URL` is documented in `client/.env.example` with no secrets
- [ ] `npm test` runs and passes (≥ 1 real routing assertion), `npm run lint` passes,
      `npm run build` succeeds
- [ ] No authentication, API calls, or business logic yet (YAGNI)
- [ ] No changes outside `client/`

## Testing Requirements

- Component test: rendering `App` shows the login route by default and navigates to
  each placeholder route (React Router test rendering).
- Tests must assert rendered output, not snapshot existence.
