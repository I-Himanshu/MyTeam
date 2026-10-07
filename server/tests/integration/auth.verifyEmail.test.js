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
 * Helper: register a user and return the plaintext verification token.
 * Since we can't reverse the hash, we generate a fresh token and store its
 * hash directly (simulating what the register endpoint does).
 */
async function createUserWithVerificationToken(email = 'verify@example.com') {
  const payload = buildUser({ email });
  await request(app).post('/api/auth/register').send(payload);

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

  await User.findOneAndUpdate(
    { email },
    {
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  );

  return { payload, verificationToken };
}

describe('GET /api/auth/verify-email', () => {
  it('returns 200 and sets emailVerified: true for a valid token', async () => {
    const { payload, verificationToken } = await createUserWithVerificationToken();

    const res = await request(app)
      .get('/api/auth/verify-email')
      .query({ token: verificationToken });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.success).toBe(true);
    expect(Object.keys(res.body)).toEqual(['success', 'data']);
    expect(typeof res.body.data.message).toBe('string');

    const stored = await User.findOne({ email: payload.email });
    expect(stored.emailVerified).toBe(true);
  });

  it('clears the verification token after successful verification (single-use)', async () => {
    const { payload, verificationToken } = await createUserWithVerificationToken();

    // First verification succeeds.
    const first = await request(app)
      .get('/api/auth/verify-email')
      .query({ token: verificationToken });
    expect(first.status).toBe(200);

    // Second attempt with the same token fails.
    const second = await request(app)
      .get('/api/auth/verify-email')
      .query({ token: verificationToken });
    expect(second.status).toBe(400);
    expect(second.body.success).toBe(false);
    expect(second.body.error.code).toBe('VALIDATION_ERROR');

    // Verify the token was cleared from the database.
    const stored = await User.findOne({ email: payload.email })
      .select('+emailVerificationToken +emailVerificationExpires');
    expect(stored.emailVerificationToken).toBeUndefined();
    expect(stored.emailVerificationExpires).toBeUndefined();
  });

  it('returns 400 for an invalid token', async () => {
    await createUserWithVerificationToken();

    const res = await request(app)
      .get('/api/auth/verify-email')
      .query({ token: 'invalid-token-123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('Invalid or expired');
  });

  it('returns 400 for an expired token', async () => {
    const payload = buildUser({ email: 'expired@example.com' });
    await request(app).post('/api/auth/register').send(payload);

    // Create an already-expired token.
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    await User.findOneAndUpdate(
      { email: payload.email },
      {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: new Date(Date.now() - 1000), // Expired 1 second ago.
      },
    );

    const res = await request(app)
      .get('/api/auth/verify-email')
      .query({ token: verificationToken });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('Invalid or expired');
  });

  it('returns 400 VALIDATION_ERROR for a missing token', async () => {
    const res = await request(app).get('/api/auth/verify-email');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(typeof res.body.error.message).toBe('string');
  });

  it('returns 400 VALIDATION_ERROR for an empty token', async () => {
    const res = await request(app)
      .get('/api/auth/verify-email')
      .query({ token: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('does not log the verification token', async () => {
    const { verificationToken } = await createUserWithVerificationToken();

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const res = await request(app)
        .get('/api/auth/verify-email')
        .query({ token: verificationToken });

      expect(res.status).toBe(200);
      const logged = [...logSpy.mock.calls, ...warnSpy.mock.calls, ...errorSpy.mock.calls]
        .map((args) => args.map(String).join(' '))
        .join('\n');

      expect(logged).not.toContain(verificationToken);
    } finally {
      logSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });
});
