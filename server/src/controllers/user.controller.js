import User from '../models/User.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Serialize a user document into the GET profile contract shape
 * (API_CONTRACTS §3.1). Fields are picked explicitly — never spread —
 * so `password` and `__v` can never leak into the response.
 *
 * @param {import('mongoose').HydratedDocument<import('../models/User.js').User>} user User document.
 * @returns {{id: string, name: string, email: string, createdAt: Date, updatedAt: Date}} Profile payload.
 */
function toProfile(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Serialize a user document into the PUT profile contract shape
 * (API_CONTRACTS §3.2). The update response carries no `createdAt`.
 *
 * @param {import('mongoose').HydratedDocument<import('../models/User.js').User>} user User document.
 * @returns {{id: string, name: string, email: string, updatedAt: Date}} Updated-profile payload.
 */
function toUpdatedProfile(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    updatedAt: user.updatedAt,
  };
}

/**
 * Return the authenticated user's profile (GET /api/users/profile).
 *
 * The user id always comes from `req.userId` (set by `requireAuth` from the
 * JWT `sub` claim) — never from the URL or body — so a caller can only ever
 * read their own profile.
 *
 * @type {import('express').RequestHandler}
 */
export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return next(new NotFoundError('User not found'));
    }
    return res.status(200).json({ success: true, data: toProfile(user) });
  } catch (error) {
    return next(error);
  }
}

/**
 * Update the authenticated user's profile (PUT /api/users/profile).
 *
 * Only `name` is ever written: `email` is display-only in Phase 1 (PRD
 * US-004) and unknown/extra fields are ignored rather than mass-assigned
 * onto the document. A body without `name` returns the unchanged profile
 * with 200.
 *
 * @type {import('express').RequestHandler}
 */
export async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    if (req.body?.name === undefined) {
      return res.status(200).json({ success: true, data: toUpdatedProfile(user) });
    }

    // Explicit single-field assignment: email and any extra body fields
    // (role, password, _id, ...) are silently ignored and never persist.
    user.name = req.body.name;
    await user.save();

    return res.status(200).json({ success: true, data: toUpdatedProfile(user) });
  } catch (error) {
    return next(error);
  }
}
