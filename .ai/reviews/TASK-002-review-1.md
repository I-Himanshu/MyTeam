# Review: TASK-002 — Cycle 1

**Date:** 2026-10-05
**Task:** TASK-002
**Branch:** feature/TASK-002
**PR:** https://github.com/I-Himanshu/MyTeam/pull/4
**Reviewer:** Manager Agent
**Decision:** APPROVED

## Findings

### Issues Found

None blocking. Two process notes:
1. The developer created 4 new agent definition files
   (`.opencode/agents/backend-*.md`) — out of scope for this task and a
   violation of single-responsibility (no new agents without Manager
   approval). The files were untracked, never pushed, and have been deleted
   by the Manager. No trace remains on any branch.
2. `server/tests/unit/config.test.js` was modified (startup probe now boots
   `MongoMemoryServer` and injects its URI). Justified consequential edit:
   the server now correctly refuses to listen without a database.

### Positive Observations

- Correctness: `connectDB()` fail-fast (non-zero exit, URI never echoed),
  wired into `server.js` via top-level await BEFORE `listen`; User model
  matches DATABASE_SCHEMA §2.1 exactly; bcrypt salt rounds 10, hash-only-when-
  modified; `matchPassword` via `bcrypt.compare`; `toJSON` strips password +
  `__v`.
- Verified independently: `npm test` 4 files / 54 passed, `npm run lint`
  clean, CI SUCCESS on Node 18.x + 20.x.
- Security: secret scan of the diff clean; connection string never logged;
  `select: false` on password confirmed by test.
- Scope: only `server/` files + task file; no auth middleware or routes.

## Required Changes

None.
