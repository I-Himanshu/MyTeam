import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { body } from 'express-validator';

import validate from '../../src/middleware/validate.js';
import errorHandler from '../../src/middleware/errorHandler.js';

const registerChains = [
  body('email').isEmail().withMessage('Must be a valid email address'),
  body('password').isLength({ min: 8 }).withMessage('Must be at least 8 characters long'),
];

function buildApp() {
  const app = express();
  app.use(express.json());
  app.post('/test', validate(registerChains), (req, res) => {
    res.status(200).json({ success: true, data: { ok: true } });
  });
  // Centralized handler renders the standard error envelope.
  app.use(errorHandler);
  return app;
}

describe('validate', () => {
  it('passes valid input through to the handler', async () => {
    const response = await request(buildApp())
      .post('/test')
      .send({ email: 'ada@example.com', password: 'correct-horse-8' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: { ok: true } });
  });

  it('rejects invalid input with 400 VALIDATION_ERROR and per-field messages', async () => {
    const response = await request(buildApp())
      .post('/test')
      .send({ email: 'not-an-email', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toContain('email');
    expect(response.body.error.message).toContain('password');
  });

  it('reports which field failed when only one field is invalid', async () => {
    const response = await request(buildApp())
      .post('/test')
      .send({ email: 'ada@example.com', password: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toContain('password');
  });
});
