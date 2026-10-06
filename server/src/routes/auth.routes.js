import { Router } from 'express';
import { body } from 'express-validator';

import { login, me, register } from '../controllers/auth.controller.js';
import authRateLimiter from '../middleware/rateLimiter.js';
import requireAuth from '../middleware/requireAuth.js';
import validate from '../middleware/validate.js';

/**
 * Validation chains for POST /api/auth/register (API_CONTRACTS §2.1).
 *
 * Exported so tests or future handlers can reuse the rules. Additional
 * routes (login, me) attach their own handlers to this router without
 * touching the register route.
 */
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
];

/**
 * Validation chains for POST /api/auth/login (API_CONTRACTS §2.2).
 */
export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const router = Router();

// Login/register share one IP-based budget (ENGINEERING_RULES §2.3).
// GET /me is authenticated per-request and stays unlimited (YAGNI).
router.post('/register', authRateLimiter, validate(registerValidation), register);
router.post('/login', authRateLimiter, validate(loginValidation), login);
router.get('/me', requireAuth, me);

export default router;
