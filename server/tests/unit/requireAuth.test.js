import { describe, it, expect, vi, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';

import requireAuth from '../../src/middleware/requireAuth.js';
import errorHandler from '../../src/middleware/errorHandler.js';
import { UnauthorizedError } from '../../src/utils/errors.js';
import testEnv from '../fixtures/testEnv.js';

const SECRET = testEnv.JWT_SECRET;
const USER_ID = '507f1f77bcf86cd799439011';

/** Drive the middleware directly and capture what it passes to `next()`. */
function runMiddleware(headers) {
  return new Promise((resolve) => {
    const req = { headers };
    const next = (error) => resolve({ req, error });
    requireAuth(req, {}, next);
  });
}

function createRes() {
  return {
    statusCode: undefined,
    body: undefined,
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('requireAuth', () => {
  it('rejects a request with no Authorization header as 401 TOKEN_INVALID', async () => {
    const { req, error } = await runMiddleware({});

    expect(req.userId).toBeUndefined();
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.status).toBe(401);
    expect(error.code).toBe('TOKEN_INVALID');
  });

  it('rejects a non-Bearer Authorization header as 401 TOKEN_INVALID', async () => {
    const { error } = await runMiddleware({ authorization: 'Token abc.def.ghi' });

    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.status).toBe(401);
    expect(error.code).toBe('TOKEN_INVALID');
  });

  it('rejects `Bearer` with an empty value as 401 TOKEN_INVALID', async () => {
    const { error } = await runMiddleware({ authorization: 'Bearer ' });

    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.status).toBe(401);
    expect(error.code).toBe('TOKEN_INVALID');
  });

  it('rejects a malformed JWT as 401 TOKEN_INVALID', async () => {
    const { error } = await runMiddleware({ authorization: 'Bearer not-a-jwt' });

    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.status).toBe(401);
    expect(error.code).toBe('TOKEN_INVALID');
  });

  it('rejects a token with a tampered signature as 401 TOKEN_INVALID', async () => {
    const tampered = jwt.sign({ sub: USER_ID }, 'a-different-secret');

    const { error } = await runMiddleware({ authorization: `Bearer ${tampered}` });

    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.status).toBe(401);
    expect(error.code).toBe('TOKEN_INVALID');
  });

  it('rejects an expired token as 401 TOKEN_EXPIRED', async () => {
    const expired = jwt.sign({ sub: USER_ID }, SECRET, { expiresIn: '0s' });

    const { error } = await runMiddleware({ authorization: `Bearer ${expired}` });

    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.status).toBe(401);
    expect(error.code).toBe('TOKEN_EXPIRED');
  });

  it('rejects a token signed for a different secret as 401 TOKEN_INVALID', async () => {
    const foreign = jwt.sign({ sub: USER_ID }, 'wrong-secret', { expiresIn: '1h' });

    const { error } = await runMiddleware({ authorization: `Bearer ${foreign}` });

    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.code).toBe('TOKEN_INVALID');
  });

  it('lets a valid token through and populates req.userId', async () => {
    const token = jwt.sign({ sub: USER_ID }, SECRET, { expiresIn: '1h' });

    const { req, error } = await runMiddleware({ authorization: `Bearer ${token}` });

    expect(error).toBeUndefined();
    expect(req.userId).toBe(USER_ID);
  });

  it('renders auth failures in the standard envelope without leaking the token', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const token = jwt.sign({ sub: USER_ID }, 'wrong-secret', { expiresIn: '1h' });
    const { error } = await runMiddleware({ authorization: `Bearer ${token}` });
    const res = createRes();

    errorHandler(error, { method: 'GET', originalUrl: '/api/me' }, res, () => {});

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      success: false,
      error: { message: expect.any(String), code: 'TOKEN_INVALID' },
    });
    expect(JSON.stringify(res.body)).not.toContain(token);
  });
});
