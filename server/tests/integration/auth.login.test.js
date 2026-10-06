import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

import createApp from '../../src/app.js';
import User from '../../src/models/User.js';
import testEnv from '../fixtures/testEnv.js';
import { buildUser } from '../fixtures/users.js';

/** Exact 401 envelope — unknown email and wrong password must be identical. */
const INVALID_CREDENTIALS_BODY = {
  success: false,
  error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
};

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

describe('POST /api/auth/login', () => {
  it('logs in a registered user with 200 and a verifiable token', async () => {
    const payload = buildUser();
    const registered = await request(app).post('/api/auth/register').send(payload);
    expect(registered.status).toBe(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.success).toBe(true);
    expect(Object.keys(res.body)).toEqual(['success', 'data']);
    expect(Object.keys(res.body.data).sort()).toEqual(['token', 'user']);
    expect(Object.keys(res.body.data.user).sort()).toEqual(['email', 'id', 'name']);
    expect(res.body.data.user.name).toBe(payload.name);
    expect(res.body.data.user.email).toBe(payload.email);
    expect(typeof res.body.data.user.id).toBe('string');
    expect(typeof res.body.data.token).toBe('string');

    // Token verifies against JWT_SECRET and carries the logged-in user id.
    const decoded = jwt.verify(res.body.data.token, testEnv.JWT_SECRET);
    expect(decoded.sub).toBe(res.body.data.user.id);
    expect(decoded.sub).toBe(registered.body.data.user.id);
  });

  it('logs in even though password has select: false on the model', async () => {
    const payload = buildUser({ password: 'selectFalseCheck123' });
    await User.create(payload);

    // Sanity: a plain findOne must NOT include the password hash.
    const withoutPassword = await User.findOne({ email: payload.email });
    expect(withoutPassword.password).toBeUndefined();

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.token).toBe('string');
  });

  it('returns 401 INVALID_CREDENTIALS for a wrong password', async () => {
    const payload = buildUser();
    await request(app).post('/api/auth/register').send(payload);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: 'totallyWrong123' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual(INVALID_CREDENTIALS_BODY);
  });

  it('returns a byte-identical 401 INVALID_CREDENTIALS for an unknown email', async () => {
    const payload = buildUser();
    await request(app).post('/api/auth/register').send(payload);

    const wrongPasswordRes = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: 'totallyWrong123' });

    const unknownEmailRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody-here@example.com', password: 'totallyWrong123' });

    expect(unknownEmailRes.status).toBe(401);
    expect(unknownEmailRes.body).toEqual(INVALID_CREDENTIALS_BODY);
    // Regression guard against user enumeration: both bodies must match exactly.
    expect(unknownEmailRes.body).toEqual(wrongPasswordRes.body);
    expect(JSON.stringify(unknownEmailRes.body)).toBe(JSON.stringify(wrongPasswordRes.body));
  });

  it.each([
    ['missing email', (base) => ({ password: base.password })],
    ['malformed email', (base) => ({ ...base, email: 'not-an-email' })],
    ['missing password', (base) => ({ email: base.email })],
    ['empty password', (base) => ({ ...base, password: '' })],
    ['empty body', () => ({})],
  ])('returns 400 VALIDATION_ERROR for %s', async (_label, makeBody) => {
    const payload = buildUser();
    await request(app).post('/api/auth/register').send(payload);

    const base = { email: payload.email, password: payload.password };
    const res = await request(app).post('/api/auth/login').send(makeBody(base));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(typeof res.body.error.message).toBe('string');
  });

  it('never includes the password field in any login response body', async () => {
    const payload = buildUser({ password: 'neverLeakMe123' });
    await request(app).post('/api/auth/register').send(payload);

    const successRes = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });
    expect(successRes.status).toBe(200);
    expect(JSON.stringify(successRes.body)).not.toContain(payload.password);
    expect(successRes.body.data.user.password).toBeUndefined();
    expect(successRes.body.data.password).toBeUndefined();

    const failureRes = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: 'wrongPassword123' });
    expect(failureRes.status).toBe(401);
    expect(JSON.stringify(failureRes.body)).not.toContain(payload.password);
    expect(JSON.stringify(failureRes.body)).not.toContain('password');
  });

  it('does not log passwords, hashes, or tokens during login', async () => {
    const payload = buildUser({ password: 'neverLogMe123' });
    await request(app).post('/api/auth/register').send(payload);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: payload.email, password: payload.password });

      expect(res.status).toBe(200);
      const logged = [...logSpy.mock.calls, ...warnSpy.mock.calls, ...errorSpy.mock.calls]
        .map((args) => args.map(String).join(' '))
        .join('\n');

      expect(logged).not.toContain(payload.password);
      expect(logged).not.toContain(res.body.data.token);

      const stored = await User.findOne({ email: payload.email }).select('+password');
      expect(logged).not.toContain(stored.password);
    } finally {
      logSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });
});
