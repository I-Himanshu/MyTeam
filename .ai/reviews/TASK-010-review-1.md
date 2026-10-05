# Review: TASK-010 — Cycle 1

**Date:** 2026-10-05
**Task:** TASK-010
**Branch:** feature/TASK-010
**PR:** https://github.com/I-Himanshu/MyTeam/pull/7
**Reviewer:** Manager Agent
**Decision:** APPROVED

## Findings

### Issues Found

None blocking. One accepted deviation: `client/vite.config.js` vitest
`include` widened to `src/**/*.test.{js,jsx}` although not listed in the
task's Expected Areas table. Justified — without it `npm test` silently
ignores the required `.test.js` suites. Kept.

### Positive Observations

- Correctness: axios `baseURL` imported from `apiConfig.js` (hardcoded
  nowhere else); `Bearer` header attached only when a token exists; 401
  clears storage + redirects with a `/login` pathname guard (no loop);
  errors normalized to `{ message, code }`; `register/login/me` match
  API_CONTRACTS §2 shapes; localStorage encapsulated in `tokenStorage.js`
  (grep-verified), XSS trade-off documented in code, no
  `dangerouslySetInnerHTML` anywhere.
- Verified independently in the task worktree: `npm test` 5 files / 26
  passed (axios mocked as external dep; units under test real),
  `npm run lint` clean, `npm run build` succeeds.
- Scope: `client/src/services|utils` + tests, axios dep, vitest include
  fix; no components or context (TASK-011 territory untouched).
- PR records the httpOnly-cookie follow-up as an ADR candidate as required.

## Required Changes

None.
