import api from './api.js';

// Thin auth wrappers (API_CONTRACTS §2.1–§2.3). Each resolves with the response
// envelope `{ success, data }`; failures reject with `{ message, code }`
// (normalized by the api.js response interceptor). Auth state and profile
// service functions are explicitly out of scope (later tasks).

/**
 * Register a new user.
 * @param {{ name: string, email: string, password: string }} payload
 * @returns {Promise<{ success: boolean, data: { user: object, token: string } }>}
 */
export async function register(payload) {
  const response = await api.post('/auth/register', payload);
  return response.data;
}

/**
 * Log in an existing user.
 * @param {{ email: string, password: string }} payload
 * @returns {Promise<{ success: boolean, data: { user: object, token: string } }>}
 */
export async function login(payload) {
  const response = await api.post('/auth/login', payload);
  return response.data;
}

/**
 * Fetch the user for the currently stored JWT.
 * @returns {Promise<{ success: boolean, data: object }>}
 */
export async function me() {
  const response = await api.get('/auth/me');
  return response.data;
}

/**
 * Request a password reset email.
 * @param {{ email: string }} payload
 * @returns {Promise<{ success: boolean, data: object }>}
 */
export async function forgotPassword(payload) {
  const response = await api.post('/auth/forgot-password', payload);
  return response.data;
}

/**
 * Reset a password using a token from the reset email.
 * @param {{ token: string, newPassword: string }} payload
 * @returns {Promise<{ success: boolean, data: object }>}
 */
export async function resetPassword(payload) {
  const response = await api.post('/auth/reset-password', payload);
  return response.data;
}
