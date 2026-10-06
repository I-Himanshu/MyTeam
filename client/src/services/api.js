import axios from 'axios';

import { API_BASE_URL } from '../utils/apiConfig.js';
import { clearToken, getToken } from '../utils/tokenStorage.js';

// Centralized API client (ARCHITECTURE §4.3, ENGINEERING_RULES §3.3). Every
// feature imports this instance instead of calling fetch/axios directly, so
// auth headers and error shapes stay consistent across the app.

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach `Authorization: Bearer <token>` when a token is stored; leave the
// request untouched otherwise so public endpoints stay anonymous.
export function attachAuthHeader(config) {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

// Send an expired/invalid-token user back to /login. The pathname guard avoids
// a redirect loop when the 401 already happened on the login page itself.
export function redirectToLogin() {
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

// Normalize every failure to `{ message, code }` (API_CONTRACTS §1.3–§1.4) so
// components can render consistent messages. On 401 the stored token is
// cleared and the user is redirected (graceful token expiration).
export function handleApiError(error) {
  if (error?.response?.status === 401) {
    clearToken();
    redirectToLogin();
  }
  const payload = error?.response?.data?.error;
  return Promise.reject({
    message: payload?.message ?? error?.message ?? 'An unexpected error occurred.',
    code: payload?.code ?? 'UNKNOWN_ERROR',
  });
}

api.interceptors.request.use(attachAuthHeader);
api.interceptors.response.use(
  (response) => response,
  handleApiError,
);

export default api;
