import User from '../models/User.js';
import { ValidationError } from '../utils/errors.js';
import { generateToken } from '../utils/token.js';

/**
 * Register a new user (POST /api/auth/register).
 *
 * Password hashing is handled by the `User` model pre-save hook — the
 * controller never hashes or logs credentials. Duplicate emails surface as
 * MongoDB E11000 and are mapped to a client-safe 400 `DUPLICATE_EMAIL`.
 *
 * Kept as a standalone named handler so TASK-005 (login) and TASK-006 (me)
 * can add sibling handlers to this module without rewrites.
 *
 * @type {import('express').RequestHandler}
 */
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id.toString());

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return next(new ValidationError('Email already registered', 'DUPLICATE_EMAIL'));
    }
    if (error?.name === 'ValidationError') {
      const messages = Object.values(error.errors ?? {})
        .map((entry) => entry?.message)
        .filter(Boolean)
        .join('; ');
      return next(new ValidationError(messages || 'Validation failed', 'VALIDATION_ERROR'));
    }
    return next(error);
  }
}
