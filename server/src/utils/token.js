import jwt from 'jsonwebtoken';

import config from '../config/index.js';

/**
 * Sign a short-lived authentication token for the given user.
 *
 * The payload carries only the subject id (`{ sub: userId }`) — no personal
 * data, no secrets — so there is nothing sensitive to leak if the token is
 * decoded client-side (the payload is base64, not encrypted).
 *
 * @param {string} userId Authenticated user's id (goes into `sub`).
 * @returns {string} Signed JWT expiring after `JWT_EXPIRES_IN`.
 */
export function generateToken(userId) {
  return jwt.sign({ sub: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}
