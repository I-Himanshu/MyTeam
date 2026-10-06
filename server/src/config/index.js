// Load `.env` exactly once, before any variable is read, so every entry point
// (server, tests, scripts) sees the same values.
import 'dotenv/config';

/**
 * Variables that must be present for the process to start.
 * `PORT` is intentionally excluded: it has a default (5000).
 */
export const REQUIRED_ENV_VARS = ['MONGO_URI', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'CLIENT_URL'];

/**
 * Validate an environment object and build the immutable runtime config.
 *
 * Fails fast: a missing required variable throws immediately with a message
 * naming every missing variable. Values are never echoed back, so secrets can
 * not leak into logs or error output.
 *
 * @param {Record<string, string | undefined>} [env=process.env] Environment source.
 * @returns {Readonly<{port: number, mongoUri: string, jwtSecret: string, jwtExpiresIn: string, clientUrl: string}>}
 * @throws {Error} When a required variable is missing or `PORT` is not a valid port number.
 */
export function loadConfig(env = process.env) {
  const missing = REQUIRED_ENV_VARS.filter((name) => !env[name] || `${env[name]}`.trim() === '');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill in the missing values.',
    );
  }

  const rawPort = env.PORT === undefined || env.PORT === '' ? '5000' : `${env.PORT}`;
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid PORT: expected an integer between 1 and 65535, received "${rawPort}".`,
    );
  }

  return Object.freeze({
    port,
    mongoUri: `${env.MONGO_URI}`,
    jwtSecret: `${env.JWT_SECRET}`,
    jwtExpiresIn: `${env.JWT_EXPIRES_IN}`,
    clientUrl: `${env.CLIENT_URL}`,
    smtpHost: env.SMTP_HOST || '',
    smtpPort: env.SMTP_PORT ? Number(env.SMTP_PORT) : 587,
    smtpUser: env.SMTP_USER || '',
    smtpPass: env.SMTP_PASS || '',
    smtpFrom: env.SMTP_FROM || '',
  });
}

// Fail fast at import time: a misconfigured process must never reach `listen`.
const config = loadConfig();

export default config;
