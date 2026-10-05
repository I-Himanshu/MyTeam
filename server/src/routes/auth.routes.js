import { Router } from 'express';
import { body } from 'express-validator';

import { register } from '../controllers/auth.controller.js';
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

const router = Router();

router.post('/register', validate(registerValidation), register);

export default router;
