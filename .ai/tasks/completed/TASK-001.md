---
id: TASK-001
title: Backend scaffolding — Express app, config, error envelope, and test tooling
team: backend
priority: CRITICAL
status: MERGED
assigned_agent: backend
dependencies: []
branch: feature/TASK-001
pr: https://github.com/I-Himanshu/MyTeam/pull/1
review_cycles: 0
---

## Description

Create the `server/` backend foundation described in `.ai/ARCHITECTURE.md` §2 and §3.
Every other backend task builds on this, so it must establish the conventions (response
envelope, error handling, config, lint, tests) that all later tasks reuse. No
authentication, database, or business logic belongs in this task.

## Requirements

- Initialize `server/package.json` as an ES module package (`"type": "module"`), Node 18+
  (must run on the CI matrix in `.github/workflows/ci.yml`).
- Scripts: `dev` (auto-reload), `start`, `test`, `lint`.
- Runtime dependencies: `express`, `cors`, `dotenv`.
  Dev dependencies: `eslint`, `prettier`, `vitest`, `supertest`.
  (mongoose, bcrypt, jsonwebtoken, express-validator are installed by TASK-002/TASK-003 —
  do NOT add them here.)
- `src/config/index.js` — centralized environment module reading `PORT`, `MONGO_URI`,
  `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`. Fail fast with a clear message when a
  required variable is missing. Never log secret values.
- `src/app.js` — pure Express app factory (does NOT call `listen`): JSON body parsing,
  CORS restricted to `CLIENT_URL`, `/api` router mount point, 404 handler, centralized
  error handler emitting the API_CONTRACTS §1.3 envelope:
  `{ success: false, error: { message, code } }`.
- `src/server.js` — entry point: load config, start listening on `PORT` (default 5000).
- `src/utils/errors.js` — custom error classes (`AppError`, `ValidationError`,
  `NotFoundError`, `UnauthorizedError`) carrying HTTP `status` and `code`.
- `src/middleware/notFoundHandler.js` and `src/middleware/errorHandler.js` — centralized
  handlers; log server-side, never expose stack traces in responses.
- `GET /api/health` → `200 { "success": true, "data": { "status": "ok" } }`.
- `.env.example` listing every variable with placeholder values; verify `.env` is gitignored.
- Commit ESLint and Prettier configuration files (CODING_STANDARDS §6).
- Test layout `server/tests/unit`, `server/tests/integration`, `server/tests/fixtures`
  plus Vitest configuration (ENGINEERING_RULES §4.3).

## Expected Areas / Files

| File | Action |
|------|--------|
| `server/package.json` | Added |
| `server/package-lock.json` | Added |
| `server/src/app.js` | Added |
| `server/src/server.js` | Added |
| `server/src/config/index.js` | Added |
| `server/src/utils/errors.js` | Added |
| `server/src/middleware/errorHandler.js` | Added |
| `server/src/middleware/notFoundHandler.js` | Added |
| `server/.env.example` | Added |
| `server/.eslintrc.cjs` / `server/.prettierrc` | Added |
| `server/vitest.config.js` | Added |
| `server/tests/integration/health.test.js` | Added |
| `server/tests/unit/errors.test.js` | Added |
| `.gitignore` | Modified (only if `.env` not already ignored) |

## Acceptance Criteria

- [ ] `npm install && npm run dev` starts the API on `PORT` (default 5000)
- [ ] `GET /api/health` returns 200 with the success envelope
- [ ] Unknown route returns 404 with `{ success: false, error: { message, code: "NOT_FOUND" } }`
- [ ] A thrown `AppError` renders its own status/code; an unexpected error returns
      500 `INTERNAL_ERROR` with no stack trace in the response body
- [ ] CORS allows only the `CLIENT_URL` origin
- [ ] Missing required environment variable prevents startup with a clear message
- [ ] `.env.example` committed, `.env` ignored, no secrets anywhere in the diff
- [ ] `npm test` and `npm run lint` both pass
- [ ] No auth, user, or database logic present (YAGNI)

## Testing Requirements

- Integration (supertest against the app): health endpoint returns 200 + envelope;
  unknown route returns 404 + error envelope.
- Unit: error handler maps `AppError` → its status/code and unknown errors → 500
  `INTERNAL_ERROR` without leaking a stack trace; config module fails on missing variables.
- All tests must verify behavior, not just that a response exists.
