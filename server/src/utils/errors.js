/**
 * Custom error classes used across the API.
 *
 * Every error carries an HTTP `status` and a stable machine-readable `code`
 * (see `.ai/API_CONTRACTS.md` §1.4) so the centralized error handler can render
 * the standard envelope without inspecting each error type individually.
 */

/**
 * Base class for all expected application errors.
 *
 * Anything that is NOT an `AppError` is treated as an unexpected failure and is
 * reported to the client as `500 INTERNAL_ERROR` without leaking details.
 */
export class AppError extends Error {
  /**
   * @param {string} message Human-readable message safe to send to the client.
   * @param {number} [status=500] HTTP status code.
   * @param {string} [code='INTERNAL_ERROR'] Stable error code from API_CONTRACTS.
   */
  constructor(message, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    Error.captureStackTrace?.(this, new.target);
  }
}

/** A request that failed server-side validation → 400 `VALIDATION_ERROR`. */
export class ValidationError extends AppError {
  /**
   * @param {string} [message='Validation failed'] Client-safe message.
   * @param {string} [code='VALIDATION_ERROR'] Error code (e.g. `DUPLICATE_EMAIL`).
   */
  constructor(message = 'Validation failed', code = 'VALIDATION_ERROR') {
    super(message, 400, code);
  }
}

/** The requested resource or route does not exist → 404 `NOT_FOUND`. */
export class NotFoundError extends AppError {
  /**
   * @param {string} [message='Resource not found'] Client-safe message.
   * @param {string} [code='NOT_FOUND'] Error code.
   */
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

/**
 * Missing/invalid credentials → 401.
 *
 * Callers should pass an explicit code from API_CONTRACTS §1.4
 * (`TOKEN_INVALID`, `TOKEN_EXPIRED`, `INVALID_CREDENTIALS`).
 */
export class UnauthorizedError extends AppError {
  /**
   * @param {string} [message='Unauthorized'] Client-safe message.
   * @param {string} [code='UNAUTHORIZED'] Error code.
   */
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}
