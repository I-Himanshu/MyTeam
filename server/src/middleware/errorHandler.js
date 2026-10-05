import { AppError } from '../utils/errors.js';

/** Client errors (4xx) raised by body-parser while decoding the JSON payload. */
function isBodyParseError(error) {
  return typeof error?.type === 'string' && error.type.startsWith('entity.');
}

/**
 * Centralized error handler. Must be registered last, after every route.
 *
 * - `AppError` (and body-parser errors) render their own status/code/message.
 * - Anything else is an unexpected failure: it is logged server-side and
 *   reported as `500 INTERNAL_ERROR` with a generic message — stack traces and
 *   internal details never reach the response body.
 *
 * @type {import('express').ErrorRequestHandler}
 */
export default function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  let status;
  let code;
  let message;

  if (error instanceof AppError) {
    status = error.status;
    code = error.code;
    message = error.message;
  } else if (isBodyParseError(error)) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid JSON payload';
  } else {
    status = 500;
    code = 'INTERNAL_ERROR';
    message = 'Internal server error';
  }

  if (status >= 500) {
    // Log the full error for debugging; never send it to the client.
    console.error(`[error] ${req.method} ${req.originalUrl}`, error);
  } else {
    console.warn(`[warn] ${req.method} ${req.originalUrl} -> ${status} ${code}`);
  }

  res.status(status).json({
    success: false,
    error: { message, code },
  });
}
