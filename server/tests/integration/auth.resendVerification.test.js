import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
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
 * Helper: register a user and return a valid JWT token.
 */
async function registerAndLogin(email = 'resend@example.com') {
  const payload = buildUser({ email });
  const res = await request(app).post('/api/auth/register').send(payload);
  return { payload, token: res.body.data.token };
}

describe('POST /api/auth/resend-verification', () => {
  it('returns 200 and sends a new verification email for an unverified user', async () => {
    const { payload, token } = await registerAndLogin();

    const res = await request(app)
      .post('/api/auth/resend-verification')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.success).toBe(true);
    expect(Object.keys(res.body)).toEqual(['success', 'data']);
    expect(typeof res.body.data.message).toBe('string');

    // Verify a new token was stored.
    const stored = await User.findOne({ email: payload.email })
      .select('+emailVerificationToken +emailVerificationExpires');
    expect(stored.emailVerificationToken).toBeDefined();
    expect(stored.emailVerificationToken).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.emailVerificationExpires).toBeInstanceOf(Date);
    expect(stored.emailVerificationExpires.getTime()).toBeGreaterThan(Date.now());
  });

  it('returns 400 when the user is already verified', async () => {
    const { payload, token } = await registerAndLogin();

    // Manually verify the user.
    await User.findOneAndUpdate(
      { email: payload.email },
      { emailVerified: true, emailVerificationToken: undefined, emailVerificationExpires: undefined },
    );

    const res = await request(app)
      .post('/api/auth/resend-verification')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('already verified');
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app).post('/api/auth/resend-verification');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  it('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/resend-verification')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  it('generates a new token different from the previous one', async () => {
    const { payload, token } = await registerAndLogin();

    // Get the original token.
    const before = await User.findOne({ email: payload.email })
      .select('+emailVerificationToken');
    const originalToken = before.emailVerificationToken;

    // Resend.
    const res = await request(app)
      .post('/api/auth/resend-verification')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    // Verify the token changed.
    const after = await User.findOne({ email: payload.email })
      .select('+emailVerificationToken');
    expect(after.emailVerificationToken).not.toBe(originalToken);
  });

  it('does not log the verification token', async () => {
    const { token } = await registerAndLogin();

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const res = await request(app)
        .post('/api/auth/resend-verification')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const logged = [...logSpy.mock.calls, ...warnSpy.mock.calls, ...errorSpy.mock.calls]
        .map((args) => args.map(String).join(' '))
        .join('\n');

      // The verification token should not appear in logs.
      const stored = await User.findOne({ email: 'resend@example.com' })
        .select('+emailVerificationToken');
      expect(logged).not.toContain(stored.emailVerificationToken);
    } finally {
      logSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });
});
