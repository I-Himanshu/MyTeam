import api from './api.js';

// Thin profile wrappers (API_CONTRACTS §3.1–§3.2). Each resolves with the
// response envelope `{ success, data }`; failures reject with
// `{ message, code }` (normalized by the api.js response interceptor).
// The profile always belongs to the token's user — no user id is ever sent.

/**
 * Fetch the profile of the currently authenticated user.
 * @returns {Promise<{ success: boolean, data: object }>}
 */
export async function getProfile() {
  const response = await api.get('/users/profile');
  return response.data;
}

/**
 * Update the profile name of the currently authenticated user.
 * @param {{ name: string }} payload
 * @returns {Promise<{ success: boolean, data: object }>}
 */
export async function updateProfile(payload) {
  const response = await api.put('/users/profile', payload);
  return response.data;
}
