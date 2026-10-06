import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

import createApp from '../../src/app.js';
import User from '../../src/models/User.js';
import {
  DEFAULT_RATE_LIMIT_MAX,
  DEFAULT_RATE_LIMIT_WINDOW_MS,
  resetAuthRateLimiter,
  resolveRateLimitConfig,
} from '../../src/middleware/rateLimiter.js';
import { buildUser } from '../fixtures/users.js';

/**
 * Rate limiting on the auth endpoints (TASK-008).
 *
 * The limiter reads its budget from `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS`
 * on every request, so each test sets a tiny budget, runs, then restores the
 * env. `resetAuthRateLimiter()` in `beforeEach`/`afterEach` guarantees no hit
 * counter leaks between tests. Budgets are deliberately small (2-3 requests)
 * to keep the suite fast.
 */

const ORIGINAL_MAX = process.env.RATE_LIMIT_MAX;

function useTinyLimit(max = 2) {
  process.env.RATE_LIMIT_MAX = String(max);
}

function restoreLimitEnv() {
  if (ORIGINAL_MAX === undefined) {
    delete process.env.RATE_LIMIT_MAX;
  } else {
    process.env.RATE_LIMIT_MAX = ORIGINAL_MAX;
  }
}

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
  restoreLimitEnv();
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await resetAuthRateLimiter();
  await User.deleteMany({});
});

afterEach(async () => {
  restoreLimitEnv();
  await resetAuthRateLimiter();
});

describe('rate limiter configuration', () => {
  it('uses safe defaults when the env vars are unset', () => {
    expect(resolveRateLimitConfig({})).toEqual({
      windowMs: DEFAULT_RATE_LIMIT_WINDOW_MS,
      limit: DEFAULT_RATE_LIMIT_MAX,
    });
  });

  it('reads window and max from the environment', () => {
    expect(
      resolveRateLimitConfig({ RATE_LIMIT_WINDOW_MS: '60000', RATE_LIMIT_MAX: '5' }),
    ).toEqual({ windowMs: 60000, limit: 5 });
  });

  it.each([
    ['blank max', { RATE_LIMIT_MAX: '' }],
    ['zero max', { RATE_LIMIT_MAX: '0' }],
    ['negative max', { RATE_LIMIT_MAX: '-3' }],
    ['non-numeric max', { RATE_LIMIT_MAX: 'many' }],
    ['fractional max', { RATE_LIMIT_MAX: '2.5' }],
    ['blank window', { RATE_LIMIT_WINDOW_MS: '   ' }],
    ['zero window', { RATE_LIMIT_WINDOW_MS: '0' }],
    ['non-numeric window', { RATE_LIMIT_WINDOW_MS: 'soon' }],
  ])('falls back to defaults for %s', (_label, env) => {
    const config = resolveRateLimitConfig(env);
    expect(config).toEqual({
      windowMs: DEFAULT_RATE_LIMIT_WINDOW_MS,
      limit: DEFAULT_RATE_LIMIT_MAX,
    });
  });
});

describe('POST /api/auth/login rate limiting', () => {
  it('lets requests through under the threshold', async () => {
    useTinyLimit(10);
    const payload = buildUser();
    const registered = await request(app).post('/api/auth/register').send(payload);
    expect(registered.status).toBe(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 429 with the RATE_LIMITED envelope once the threshold is exceeded', async () => {
    useTinyLimit(2);
    const credentials = { email: 'nobody-here@example.com', password: 'wrongPassword123' };

    const first = await request(app).post('/api/auth/login').send(credentials);
    const second = await request(app).post('/api/auth/login').send(credentials);
    expect(first.status).toBe(401);
    expect(second.status).toBe(401);

    const limited = await request(app).post('/api/auth/login').send(credentials);

    expect(limited.status).toBe(429);
    expect(limited.status).not.toBe(500);
    expect(Object.keys(limited.body)).toEqual(['success', 'error']);
    expect(limited.body.success).toBe(false);
    expect(Object.keys(limited.body.error)).toEqual(['message', 'code']);
    expect(limited.body.error.code).toBe('RATE_LIMITED');
    expect(typeof limited.body.error.message).toBe('string');
    expect(limited.headers['retry-after']).toMatch(/^\d+$/);
  });

  it('rate-limits registration as well', async () => {
    useTinyLimit(2);

    const first = await request(app).post('/api/auth/register').send(buildUser());
    expect(first.status).toBe(201);

    // A second registration with a fresh email still counts toward the budget.
    const payload = buildUser({ email: 'second-user@example.com' });
    const second = await request(app).post('/api/auth/register').send(payload);
    expect(second.status).toBe(201);

    const third = await request(app)
      .post('/api/auth/register')
      .send(buildUser({ email: 'third-user@example.com' }));
    expect(third.status).toBe(429);
    expect(third.body).toEqual({
      success: false,
      error: { message: expect.any(String), code: 'RATE_LIMITED' },
    });
  });
});

describe('non-auth endpoints are not rate-limited', () => {
  it('serves /api/health well beyond the auth budget', async () => {
    useTinyLimit(2);

    for (let i = 0; i < 6; i += 1) {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, data: { status: 'ok' } });
    }
  });

  it('does not rate-limit GET /api/auth/me', async () => {
    useTinyLimit(10);
    const payload = buildUser();
    const registered = await request(app).post('/api/auth/register').send(payload);
    expect(registered.status).toBe(201);
    const token = registered.body.data.token;

    for (let i = 0; i < 5; i += 1) {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }

    // Sanity: the auth POST budget is independent — one more register is fine.
    const extra = await request(app)
      .post('/api/auth/register')
      .send(buildUser({ email: 'extra-user@example.com' }));
    expect(extra.status).toBe(201);
  });
});

describe('regression', () => {
  it('a successful login still works with a fresh limiter and default budget', async () => {
    // Default env (no overrides) plus a reset limiter: the "fresh instance".
    restoreLimitEnv();
    const payload = buildUser();
    const registered = await request(app).post('/api/auth/register').send(payload);
    expect(registered.status).toBe(201);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.token).toBe('string');
  });
});

describe('CORS on auth endpoints', () => {
  it('does not echo an untrusted origin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ email: 'cors-check@example.com', password: 'somePassword123' });

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
