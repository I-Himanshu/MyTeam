// JWT storage for Phase 1 (see ARCHITECTURE §4.3).
//
// Trade-off (required by ENGINEERING_RULES §3.3): the token lives in
// localStorage because the API contract returns a bearer token in JSON and no
// httpOnly-cookie flow exists yet. localStorage is readable by any script on
// the page, so it is reachable by XSS: any server-rendered data must be escaped
// by React and `dangerouslySetInnerHTML` is never permitted. The follow-up is
// to move to httpOnly cookies (recorded as an ADR candidate in the TASK-010 PR).
//
// This module is the ONLY place that may touch localStorage for auth state —
// grep-verifiable: no other client file may call localStorage directly.

const TOKEN_KEY = 'myteam.auth.token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
