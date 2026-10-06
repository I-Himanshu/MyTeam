// Base URL convention for the backend API.
//
// Configured via the `VITE_API_BASE_URL` environment variable and defaulting to
// the local Express server. TASK-010 will import this for auth requests — no
// other file may hardcode the URL.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';
