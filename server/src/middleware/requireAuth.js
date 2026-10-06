import jwt from 'jsonwebtoken';

import config from '../config/index.js';
import { UnauthorizedError } from '../utils/errors.js';

/**
 * JWT auth guard. Verifies the `Authorization: Bearer <token>` header and
 * attaches the authenticated user id as `req.userId`.
 *
 * Every failure renders the identical `401` envelope shape (see
 * API_CONTRACTS §1.3/§1.4) via the centralized error handler — only the `code`
 * differs (`TOKEN_INVALID` vs `TOKEN_EXPIRED`) so clients can branch on it.
 * Token values are never included in messages or logs.
 *
 * @type {import('express').RequestHandler}
 */
export default function requireAuth(req, res, next) {
  const header = req.headers?.authorization;

  if (typeof header !== 'string') {
    return next(new UnauthorizedError('Authentication token is missing', 'TOKEN_INVALID'));
  }

  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || parts[1] === '') {
    return next(new UnauthorizedError('Authentication token is invalid', 'TOKEN_INVALID'));
  }

  let decoded;
  try {
    decoded = jwt.verify(parts[1], config.jwtSecret);
  } catch (error) {
    if (error?.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Authentication token has expired', 'TOKEN_EXPIRED'));
    }
    return next(new UnauthorizedError('Authentication token is invalid', 'TOKEN_INVALID'));
  }

  if (!decoded || typeof decoded !== 'object' || !decoded.sub) {
    return next(new UnauthorizedError('Authentication token is invalid', 'TOKEN_INVALID'));
  }

  req.userId = decoded.sub;
  return next();
}
