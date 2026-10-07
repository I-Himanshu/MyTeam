import crypto from 'crypto';

import User from '../models/User.js';
import { UnauthorizedError, ValidationError } from '../utils/errors.js';
import { generateToken } from '../utils/token.js';
import { sendPasswordResetEmail, sendVerificationEmail } from '../utils/email.js';

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

    // Generate a crypto-random verification token (32 bytes hex = 64 chars).
    const verificationToken = crypto.randomBytes(32).toString('hex');
    // Store only the SHA-256 hash — never the plaintext token.
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    const user = await User.create({
      name,
      email,
      password,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
    const token = generateToken(user._id.toString());

    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      // If email fails, clear the verification fields so the token can't be used.
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();
      return next(emailError);
    }

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

/**
 * Return the authenticated user's session identity (GET /api/auth/me).
 *
 * The user id always comes from `req.userId` (set by `requireAuth` from the
 * JWT `sub` claim) — never from the URL or body — so a caller can only ever
 * read their own session. The response follows API_CONTRACTS §2.3 exactly:
 * `{ success: true, data: { id, name, email, createdAt } }` (no `updatedAt`).
 * Fields are picked explicitly — never spread — so `password` and `__v` can
 * never leak. A valid token whose user no longer exists yields 401
 * `TOKEN_INVALID` ("Invalid token") rather than a 500.
 *
 * @type {import('express').RequestHandler}
 */
export async function me(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return next(new UnauthorizedError('Invalid token', 'TOKEN_INVALID'));
    }
    return res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Authenticate a user with email and password (POST /api/auth/login).
 *
 * The lookup lowercases the email and explicitly selects `+password` because
 * the `User` model marks it `select: false`. Unknown email and wrong password
 * both yield the identical 401 `INVALID_CREDENTIALS` response so callers cannot
 * enumerate registered emails (PRD US-002). Plaintext is only compared via
 * `matchPassword()` (bcrypt.compare) and credentials are never logged.
 *
 * @type {import('express').RequestHandler}
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const normalizedEmail = typeof email === 'string' ? email.toLowerCase() : email;
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return next(new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS'));
    }

    const matches = await user.matchPassword(password);
    if (!matches) {
      return next(new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS'));
    }

    const token = generateToken(user._id.toString());

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
        token,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Request a password reset (POST /api/auth/forgot-password).
 *
 * Always returns 200 with a generic message — even when the email is unknown —
 * to prevent user enumeration. When the email exists, a crypto-random token is
 * generated, its SHA-256 hash is stored with a 1-hour expiry, and a reset email
 * is sent. The plaintext token is never stored or logged.
 *
 * @type {import('express').RequestHandler}
 */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase() : email;
    const user = await User.findOne({ email: normalizedEmail });

    // Always return the same response to prevent user enumeration.
    const genericMessage = 'If an account exists for that email, a reset link has been sent.';

    if (!user) {
      return res.status(200).json({ success: true, data: { message: genericMessage } });
    }

    // Generate a crypto-random token (32 bytes hex = 64 chars).
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Store only the SHA-256 hash — never the plaintext token.
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      // If email fails, clear the reset fields so the token can't be used.
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      return next(emailError);
    }

    return res.status(200).json({ success: true, data: { message: genericMessage } });
  } catch (error) {
    return next(error);
  }
}

/**
 * Reset a password using a valid token (POST /api/auth/reset-password).
 *
 * Validates the token (exists, not expired), hashes the new password, clears
 * the reset fields, and returns success. The token is single-use — it is
 * cleared after a successful reset.
 *
 * @type {import('express').RequestHandler}
 */
export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== 'string') {
      return next(new ValidationError('Token is required', 'VALIDATION_ERROR'));
    }

    // Hash the provided token to compare with the stored hash.
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password');

    if (!user) {
      return next(new ValidationError('Invalid or expired token', 'VALIDATION_ERROR'));
    }

    // Update password — the pre-save hook handles hashing.
    user.password = newPassword;
    // Clear reset fields (single-use token).
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      data: { message: 'Password has been reset successfully' },
    });
  } catch (error) {
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

/**
 * Verify a user's email using a token (GET /api/auth/verify-email).
 *
 * Validates the token (exists, not expired), sets `emailVerified: true`,
 * clears the verification fields, and returns success. The token is
 * single-use — it is cleared after a successful verification.
 *
 * @type {import('express').RequestHandler}
 */
export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return next(new ValidationError('Verification token is required', 'VALIDATION_ERROR'));
    }

    // Hash the provided token to compare with the stored hash.
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return next(new ValidationError('Invalid or expired verification token', 'VALIDATION_ERROR'));
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      data: { message: 'Email verified successfully' },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * Resend a verification email to the authenticated user (POST /api/auth/resend-verification).
 *
 * Generates a new verification token, stores its hash with a 24-hour expiry,
 * and sends a new verification email. Returns 400 if the user is already verified.
 *
 * @type {import('express').RequestHandler}
 */
export async function resendVerification(req, res, next) {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return next(new UnauthorizedError('Invalid token', 'TOKEN_INVALID'));
    }

    if (user.emailVerified) {
      return next(new ValidationError('Email is already verified', 'VALIDATION_ERROR'));
    }

    // Generate a new crypto-random token (32 bytes hex = 64 chars).
    const verificationToken = crypto.randomBytes(32).toString('hex');
    // Store only the SHA-256 hash — never the plaintext token.
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      // If email fails, clear the verification fields so the token can't be used.
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();
      return next(emailError);
    }

    return res.status(200).json({
      success: true,
      data: { message: 'Verification email has been resent' },
    });
  } catch (error) {
    return next(error);
  }
}
