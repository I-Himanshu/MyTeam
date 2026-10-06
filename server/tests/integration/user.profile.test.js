import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

import createApp from '../../src/app.js';
import User from '../../src/models/User.js';
import { generateToken } from '../../src/utils/token.js';
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
 * Create a user directly and mint a token for them.
 *
 * @param {object} [overrides={}] Payload overrides for `buildUser`.
 * @returns {Promise<{user: import('mongoose').HydratedDocument, token: string}>} Stored user and token.
 */
async function createUserWithToken(overrides = {}) {
  const user = await User.create(buildUser(overrides));
  const token = generateToken(user._id.toString());
  return { user, token };
}

describe('GET /api/users/profile', () => {
  it('returns 200 with the exact contract shape for the authenticated user', async () => {
    const { user, token } = await createUserWithToken();

    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.success).toBe(true);
    expect(Object.keys(res.body)).toEqual(['success', 'data']);
    expect(Object.keys(res.body.data).sort()).toEqual([
      'createdAt',
      'email',
      'id',
      'name',
      'updatedAt',
    ]);
    expect(res.body.data.id).toBe(user._id.toString());
    expect(res.body.data.name).toBe(user.name);
    expect(res.body.data.email).toBe(user.email);
    expect(new Date(res.body.data.createdAt).toISOString()).toBe(
      user.createdAt.toISOString(),
    );
    expect(new Date(res.body.data.updatedAt).toISOString()).toBe(
      user.updatedAt.toISOString(),
    );
  });

  it('returns 401 TOKEN_INVALID without a token', async () => {
    await createUserWithToken();

    const res = await request(app).get('/api/users/profile');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  it('returns 401 TOKEN_INVALID with a malformed token', async () => {
    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  it('only ever returns the token owner profile, never another user', async () => {
    const { token } = await createUserWithToken({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    await User.create(
      buildUser({ name: 'Grace Hopper', email: 'grace@example.com' }),
    );

    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Ada Lovelace');
    expect(res.body.data.email).toBe('ada@example.com');
  });

  it('never returns password or __v', async () => {
    const { token } = await createUserWithToken();

    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.__v).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('securePass');
  });
});

describe('PUT /api/users/profile', () => {
  it('returns 401 TOKEN_INVALID without a token', async () => {
    const res = await request(app).put('/api/users/profile').send({ name: 'New Name' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  it('persists a new name and reflects an updated updatedAt', async () => {
    const { user, token } = await createUserWithToken();
    const originalUpdatedAt = user.updatedAt.toISOString();

    // Ensure a measurable time gap so updatedAt visibly advances.
    await new Promise((resolve) => setTimeout(resolve, 10));

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Augusta King' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Object.keys(res.body.data).sort()).toEqual([
      'email',
      'id',
      'name',
      'updatedAt',
    ]);
    expect(res.body.data.id).toBe(user._id.toString());
    expect(res.body.data.name).toBe('Augusta King');
    expect(res.body.data.email).toBe(user.email);
    expect(new Date(res.body.data.updatedAt).getTime()).toBeGreaterThan(
      new Date(originalUpdatedAt).getTime(),
    );

    // Re-fetch confirms persistence.
    const fetched = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.name).toBe('Augusta King');

    const stored = await User.findById(user._id);
    expect(stored.name).toBe('Augusta King');
  });

  it('ignores an email field and never persists it', async () => {
    const { user, token } = await createUserWithToken();

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ada Updated', email: 'hacker@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Ada Updated');
    expect(res.body.data.email).toBe(user.email);

    const stored = await User.findById(user._id);
    expect(stored.email).toBe(user.email);
    expect(stored.name).toBe('Ada Updated');
  });

  it('ignores unknown/extra fields instead of mass-assigning them', async () => {
    const { user, token } = await createUserWithToken();

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ada Updated', role: 'admin', password: 'newPassword123' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Ada Updated');
    expect(res.body.data.role).toBeUndefined();

    const stored = await User.findById(user._id).select('+password');
    expect(stored.email).toBe(user.email);
    // The stored password hash still verifies against the original password.
    expect(await stored.matchPassword('securePass123')).toBe(true);
  });

  it.each([
    ['too short (1 char)', { name: 'A' }],
    ['too long (51 chars)', { name: 'A'.repeat(51) }],
    ['wrong type (number)', { name: 123 }],
    ['wrong type (object)', { name: { first: 'Ada' } }],
    ['empty string', { name: '' }],
  ])('returns 400 VALIDATION_ERROR for %s', async (_label, payload) => {
    const { token } = await createUserWithToken();

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 200 with the unchanged profile when the body has no name', async () => {
    const { user, token } = await createUserWithToken();

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(user._id.toString());
    expect(res.body.data.name).toBe(user.name);
    expect(res.body.data.email).toBe(user.email);

    const stored = await User.findById(user._id);
    expect(stored.name).toBe(user.name);
    expect(stored.email).toBe(user.email);
  });

  it('only touches the token owner document when two users exist', async () => {
    const { user: userA, token: tokenA } = await createUserWithToken({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    const userB = await User.create(
      buildUser({ name: 'Grace Hopper', email: 'grace@example.com' }),
    );

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Ada Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(userA._id.toString());
    expect(res.body.data.name).toBe('Ada Updated');

    const storedB = await User.findById(userB._id);
    expect(storedB.name).toBe('Grace Hopper');
    expect(storedB.email).toBe('grace@example.com');
  });

  it('never returns password or __v', async () => {
    const { token } = await createUserWithToken();

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ada Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.__v).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('securePass');
  });
});
