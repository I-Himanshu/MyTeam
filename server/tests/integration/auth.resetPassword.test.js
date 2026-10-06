import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import crypto from 'crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

import createApp from '../../src/app.js';
import User from '../../src/models/User.js';
import { buildUser } from '../fixtures/users.js';

const app = createApp();

let mongoServer;
let testUri;

beforeAll(async () => {
  if (process.env.MONGO_TEST_URI) {
    testUri = process.env.MONGO_TEST_URI;
  } else {
    mongoServer = await MongoMemoryServer.create();
    testUri = mongoServer.getUri();
  }
  await mongoose.connect(testUri);
}, 180000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
});

/**
 * Helper: register a user and trigger a forgot-password flow.
 * Returns the plaintext reset token (extracted from the stored hash by
 * generating a new one — we can't reverse the hash, so we generate a fresh
 * token and store its hash directly for testing).
 */
async function createUserWithResetToken(email = 'reset@example.com') {
  const payload = buildUser({ email });
  await request(app).post('/api/auth/register').send(payload);

  // Generate a token and store its hash directly (simulating forgot-password).
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  await User.findOneAndUpdate(
    { email },
    {
      passwordResetToken: hashedToken,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
    },
  );

  return { payload, resetToken };
}

describe('POST /api/auth/reset-password', () => {
  it('resets the password with a valid token and clears the reset fields', async () => {
    const { payload, resetToken } = await createUserWithResetToken();
    const newPassword = 'newSecurePass456';

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, newPassword });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.success).toBe(true);
    expect(Object.keys(res.body)).toEqual(['success', 'data']);
    expect(typeof res.body.data.message).toBe('string');

    // Verify the password was updated.
    const stored = await User.findOne({ email: payload.email }).select('+password');
    expect(stored.password).not.toBe(newPassword); // Hashed, not plaintext.

    // Verify the old password no longer works.
    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });
    expect(oldLogin.status).toBe(401);

    // Verify the new password works.
    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: newPassword });
    expect(newLogin.status).toBe(200);
    expect(newLogin.body.success).toBe(true);
  });

  it('clears the reset token after successful reset (single-use)', async () => {
    const { payload, resetToken } = await createUserWithResetToken();
    const newPassword = 'newSecurePass456';

    // First reset succeeds.
    const first = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, newPassword });
    expect(first.status).toBe(200);

    // Second attempt with the same token fails.
    const second = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, newPassword: 'anotherPass789' });
    expect(second.status).toBe(400);
    expect(second.body.success).toBe(false);
    expect(second.body.error.code).toBe('VALIDATION_ERROR');

    // Verify the token was cleared from the database.
    const stored = await User.findOne({ email: payload.email })
      .select('+passwordResetToken +passwordResetExpires');
    expect(stored.passwordResetToken).toBeUndefined();
    expect(stored.passwordResetExpires).toBeUndefined();
  });

  it('returns 400 for an invalid token', async () => {
    await createUserWithResetToken();

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'invalid-token-123', newPassword: 'newSecurePass456' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('Invalid or expired');
  });

  it('returns 400 for an expired token', async () => {
    const payload = buildUser({ email: 'expired@example.com' });
    await request(app).post('/api/auth/register').send(payload);

    // Create an already-expired token.
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await User.findOneAndUpdate(
      { email: payload.email },
      {
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() - 1000), // Expired 1 second ago.
      },
    );

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: resetToken, newPassword: 'newSecurePass456' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('Invalid or expired');
  });

  it.each([
    ['missing token', { newPassword: 'newSecurePass456' }],
    ['empty token', { token: '', newPassword: 'newSecurePass456' }],
    ['missing newPassword', { token: 'some-token' }],
    ['short newPassword', { token: 'some-token', newPassword: 'short' }],
    ['empty newPassword', { token: 'some-token', newPassword: '' }],
  ])('returns 400 VALIDATION_ERROR for %s', async (_label, body) => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(typeof res.body.error.message).toBe('string');
  });

  it('does not log the token or new password during reset', async () => {
    const { resetToken } = await createUserWithResetToken();
    const newPassword = 'newSecurePass456';

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: resetToken, newPassword });

      expect(res.status).toBe(200);
      const logged = [...logSpy.mock.calls, ...warnSpy.mock.calls, ...errorSpy.mock.calls]
        .map((args) => args.map(String).join(' '))
        .join('\n');

      expect(logged).not.toContain(resetToken);
      expect(logged).not.toContain(newPassword);
    } finally {
      logSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });

  it('returns 400 when the token does not match any user', async () => {
    await createUserWithResetToken();

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'nonexistent-token', newPassword: 'newSecurePass456' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
