import { validationResult } from 'express-validator';

import { ValidationError } from '../utils/errors.js';

/**
 * Run express-validator chains and convert failures into a `400
 * VALIDATION_ERROR` error (rendered by the centralized error handler using the
 * API_CONTRACTS §1.3 envelope). The message lists every failing field so
 * clients can show field-specific errors.
 *
 * @param {import('express-validator').ValidationChain | import('express-validator').ValidationChain[]} validations
 * @returns {import('express').RequestHandler} Express middleware.
 */
export default function validate(validations) {
  const chains = Array.isArray(validations) ? validations : [validations];

  return async (req, res, next) => {
    await Promise.all(chains.map((chain) => chain.run(req)));

    const result = validationResult(req);
    if (result.isEmpty()) {
      return next();
    }

    const messages = result.array().map((failure) => {
      const field = failure.path ?? failure.param ?? 'body';
      return `${field}: ${failure.msg}`;
    });

    return next(new ValidationError(messages.join('; '), 'VALIDATION_ERROR'));
  };
}
