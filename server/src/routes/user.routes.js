import { Router } from 'express';
import { body } from 'express-validator';

import { getProfile, updateProfile } from '../controllers/user.controller.js';
import requireAuth from '../middleware/requireAuth.js';
import validate from '../middleware/validate.js';

/**
 * Validation chains for PUT /api/users/profile (API_CONTRACTS §3.2).
 *
 * `name` is optional: a body without it returns the unchanged profile.
 * Only `name` is validated — `email` and any extra fields are ignored by
 * the controller (PRD US-004: email is display-only in Phase 1).
 */
export const updateProfileValidation = [
  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
];

const router = Router();

// Both endpoints require a token; the affected user id always comes from
// the token via `requireAuth` — never from the URL or body.
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, validate(updateProfileValidation), updateProfile);

export default router;
