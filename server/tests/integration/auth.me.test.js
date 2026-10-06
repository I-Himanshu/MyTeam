import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

import createApp from '../../src/app.js';
import User from '../../src/models/User.js';
import { generateToken } from '../../src/utils/token.js';
import testEnv from '../fixtures/testEnv.js';
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
 * Create a user directly and mint a valid session token for them.
 *
 * @param {object} [overrides={}] Payload overrides for `buildUser`.
 * @returns {Promise<{user: import('mongoose').HydratedDocument, token: string}>} Stored user and token.
 */
async function createUserWithToken(overrides = {}) {
  const user = await User.create(buildUser(overrides));
  const token = generateToken(user._id.toString());
  return { user, token };
}

describe('GET /api/auth/me', () => {
  it('returns 200 with exactly id, name, email, createdAt for a valid token', async () => {
    const { user, token } = await createUserWithToken();

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.success).toBe(true);
    expect(Object.keys(res.body)).toEqual(['success', 'data']);
    expect(Object.keys(res.body.data).sort()).toEqual(['createdAt', 'email', 'id', 'name']);
    expect(res.body.data.id).toBe(user._id.toString());
    expect(res.body.data.name).toBe(user.name);
    expect(res.body.data.email).toBe(user.email);
    expect(new Date(res.body.data.createdAt).toISOString()).toBe(user.createdAt.toISOString());
  });

  it('returns 401 TOKEN_INVALID when the Authorization header is missing', async () => {
    await createUserWithToken();

    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
    expect(typeof res.body.error.message).toBe('string');
  });

  it('returns 401 TOKEN_INVALID for a malformed Authorization header', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  it('returns 401 TOKEN_INVALID for a tampered/forged token', async () => {
    const { token } = await createUserWithToken();

    const tampered = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`;
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tampered}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  it('returns 401 TOKEN_INVALID for a token signed with the wrong secret', async () => {
    const { user } = await createUserWithToken();

    const forged = jwt.sign({ sub: user._id.toString() }, 'wrong-secret-not-the-config-value', {
      expiresIn: '1h',
    });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${forged}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  it('returns 401 TOKEN_EXPIRED for an expired token', async () => {
    const { user } = await createUserWithToken();

    const expired = jwt.sign({ sub: user._id.toString() }, testEnv.JWT_SECRET, {
      expiresIn: '-10s',
    });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expired}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('returns 401 TOKEN_INVALID with message "Invalid token" for a deleted user, never a 500', async () => {
    const { user, token } = await createUserWithToken();

    await User.findByIdAndDelete(user._id);

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      success: false,
      error: { message: 'Invalid token', code: 'TOKEN_INVALID' },
    });
  });

  it('never returns password, __v, or updatedAt in the me response', async () => {
    const { token } = await createUserWithToken();

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.__v).toBeUndefined();
    expect(res.body.data.updatedAt).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('securePass');
  });
});
