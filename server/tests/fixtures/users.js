/**
 * Reusable user payloads for model tests.
 *
 * Passwords here are plaintext fixtures on purpose: the `User` model's
 * pre-save hook is responsible for hashing them before persistence.
 */
export const validUser = Object.freeze({
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'securePass123',
});

/**
 * Build a user payload, overriding any of the valid defaults.
 *
 * @param {Partial<typeof validUser>} [overrides={}] Fields to override.
 * @returns {{name: string, email: string, password: string}} A user payload.
 */
export function buildUser(overrides = {}) {
  return { ...validUser, ...overrides };
}

export default validUser;
