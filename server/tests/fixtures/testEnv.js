/**
 * Deterministic environment values for tests.
 *
 * Injected into `process.env` by `vitest.config.js` (`test.env`) before any
 * test module is imported, so `src/config/index.js` can be imported safely.
 * These are placeholders, never real credentials.
 */
const testEnv = {
  PORT: '5000',
  MONGO_URI: 'mongodb://127.0.0.1:27017/myteam-test',
  JWT_SECRET: 'test-only-secret-not-a-real-credential',
  JWT_EXPIRES_IN: '1h',
  CLIENT_URL: 'http://localhost:3000',
};

export default testEnv;
