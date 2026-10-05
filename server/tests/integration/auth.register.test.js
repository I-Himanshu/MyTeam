import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

import createApp from '../../src/app.js';
import User from '../../src/models/User.js';
import testEnv from '../fixtures/testEnv.js';
import { buildUser } from '../fixtures/users.js';

// Bcrypt hashes are versioned `$2a$`/`$2b$` strings: `$2b$<cost>$<53 chars>`.
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

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

describe('POST /api/auth/register', () => {
  it('returns 201 with user and verifiable token matching the contract', async () => {
    const payload = buildUser();
    const res = await request(app).post('/api/auth/register').send(payload);

    expect(res.status).toBe(201);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.success).toBe(true);
    expect(Object.keys(res.body)).toEqual(['success', 'data']);
    expect(Object.keys(res.body.data).sort()).toEqual(['token', 'user']);
    expect(Object.keys(res.body.data.user).sort()).toEqual([
      'createdAt',
      'email',
      'id',
      'name',
    ]);
    expect(res.body.data.user.name).toBe(payload.name);
    expect(res.body.data.user.email).toBe(payload.email);
    expect(typeof res.body.data.user.id).toBe('string');
    expect(typeof res.body.data.token).toBe('string');

    // Token verifies against JWT_SECRET and carries the new user id.
    const decoded = jwt.verify(res.body.data.token, testEnv.JWT_SECRET);
    expect(decoded.sub).toBe(res.body.data.user.id);
  });

  it('returns 400 DUPLICATE_EMAIL when the email is already registered', async () => {
    const payload = buildUser();
    await request(app).post('/api/auth/register').send(payload);

    const res = await request(app).post('/api/auth/register').send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: { message: 'Email already registered', code: 'DUPLICATE_EMAIL' },
    });
  });

  it('treats duplicate email case-insensitively (stored lowercase)', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(buildUser({ email: 'ada@example.com' }));

    const res = await request(app)
      .post('/api/auth/register')
      .send(buildUser({ email: 'Ada@Example.COM', name: 'Someone Else' }));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
  });

  it.each([
    ['missing name', { name: undefined }],
    ['name too short', { name: 'A' }],
    ['name too long', { name: 'A'.repeat(51) }],
    ['malformed email', { email: 'not-an-email' }],
    ['missing email', { email: undefined }],
    ['short password', { password: 'short1' }],
    ['missing password', { password: undefined }],
  ])('returns 400 VALIDATION_ERROR for %s', async (_label, overrides) => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(buildUser(overrides));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(typeof res.body.error.message).toBe('string');
  });

  it('persists a bcrypt hash and never returns password or __v', async () => {
    const payload = buildUser({ password: 'superSecret123' });
    const res = await request(app).post('/api/auth/register').send(payload);

    expect(res.status).toBe(201);
    expect(JSON.stringify(res.body)).not.toContain(payload.password);
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.__v).toBeUndefined();
    expect(res.body.data.password).toBeUndefined();

    const stored = await User.findOne({ email: payload.email }).select('+password');
    expect(stored.password).not.toBe(payload.password);
    expect(stored.password).toMatch(BCRYPT_HASH_PATTERN);
  });

  it('stores email in lowercase', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(buildUser({ email: 'Ada.Lovelace@Example.COM' }));

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('ada.lovelace@example.com');

    const stored = await User.findOne({ email: 'ada.lovelace@example.com' });
    expect(stored.email).toBe('ada.lovelace@example.com');
  });

  it('does not log the password or token during registration', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const payload = buildUser({ password: 'neverLogMe123' });

    try {
      const res = await request(app).post('/api/auth/register').send(payload);

      expect(res.status).toBe(201);
      const logged = [...logSpy.mock.calls, ...warnSpy.mock.calls, ...errorSpy.mock.calls]
        .map((args) => args.map(String).join(' '))
        .join('\n');

      expect(logged).not.toContain(payload.password);
      expect(logged).not.toContain(res.body.data.token);
    } finally {
      logSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });
});
