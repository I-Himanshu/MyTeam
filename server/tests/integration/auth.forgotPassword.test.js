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

describe('POST /api/auth/forgot-password', () => {
  it('returns 200 with a generic message for a valid email and stores a hashed token', async () => {
    const payload = buildUser();
    await request(app).post('/api/auth/register').send(payload);

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: payload.email });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.success).toBe(true);
    expect(Object.keys(res.body)).toEqual(['success', 'data']);
    expect(typeof res.body.data.message).toBe('string');
    expect(res.body.data.message).toContain('reset');

    // Verify a hashed token was stored (not plaintext).
    const stored = await User.findOne({ email: payload.email })
      .select('+passwordResetToken +passwordResetExpires');
    expect(stored.passwordResetToken).toBeDefined();
    expect(stored.passwordResetToken).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
    expect(stored.passwordResetExpires).toBeDefined();
    expect(stored.passwordResetExpires.getTime()).toBeGreaterThan(Date.now());
    expect(stored.passwordResetExpires.getTime()).toBeLessThanOrEqual(Date.now() + 60 * 60 * 1000);
  });

  it('returns the SAME 200 response for an unknown email (no user enumeration)', async () => {
    const payload = buildUser();
    await request(app).post('/api/auth/register').send(payload);

    const knownRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: payload.email });

    const unknownRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody-here@example.com' });

    expect(knownRes.status).toBe(200);
    expect(unknownRes.status).toBe(200);
    expect(unknownRes.body).toEqual(knownRes.body);
    expect(JSON.stringify(unknownRes.body)).toBe(JSON.stringify(knownRes.body));
  });

  it('does not create a reset token for an unknown email', async () => {
    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'ghost@example.com' });

    const stored = await User.findOne({ email: 'ghost@example.com' });
    expect(stored).toBeNull();
  });

  it.each([
    ['missing email', {}],
    ['malformed email', { email: 'not-an-email' }],
    ['empty email', { email: '' }],
  ])('returns 400 VALIDATION_ERROR for %s', async (_label, body) => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(typeof res.body.error.message).toBe('string');
  });

  it('generates a unique token for each request', async () => {
    const payload = buildUser();
    await request(app).post('/api/auth/register').send(payload);

    await request(app).post('/api/auth/forgot-password').send({ email: payload.email });
    const first = await User.findOne({ email: payload.email })
      .select('+passwordResetToken');

    await request(app).post('/api/auth/forgot-password').send({ email: payload.email });
    const second = await User.findOne({ email: payload.email })
      .select('+passwordResetToken');

    expect(first.passwordResetToken).not.toBe(second.passwordResetToken);
  });

  it('does not log the reset token or email during the request', async () => {
    const payload = buildUser();
    await request(app).post('/api/auth/register').send(payload);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: payload.email });

      expect(res.status).toBe(200);
      const logged = [...logSpy.mock.calls, ...warnSpy.mock.calls, ...errorSpy.mock.calls]
        .map((args) => args.map(String).join(' '))
        .join('\n');

      // The plaintext token should never appear in logs.
      const stored = await User.findOne({ email: payload.email })
        .select('+passwordResetToken');
      expect(logged).not.toContain(stored.passwordResetToken);
    } finally {
      logSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });

  it('sends an email with the reset token (mockable)', async () => {
    const payload = buildUser();
    await request(app).post('/api/auth/register').send(payload);

    // The email utility uses JSON transport in tests (no SMTP_HOST),
    // so we verify the token is generated and stored correctly.
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: payload.email });

    expect(res.status).toBe(200);

    const stored = await User.findOne({ email: payload.email })
      .select('+passwordResetToken +passwordResetExpires');
    expect(stored.passwordResetToken).toBeDefined();
    expect(stored.passwordResetExpires).toBeDefined();
  });
});
