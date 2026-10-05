import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';

import { generateToken } from '../../src/utils/token.js';
import testEnv from '../fixtures/testEnv.js';

const SECRET = testEnv.JWT_SECRET;
const USER_ID = '507f1f77bcf86cd799439011';

describe('generateToken', () => {
  it('returns a signed JWT whose payload contains the subject id', () => {
    const token = generateToken(USER_ID);

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const decoded = jwt.verify(token, SECRET);
    expect(decoded.sub).toBe(USER_ID);
  });

  it('signs with JWT_SECRET so verification with another secret fails', () => {
    const token = generateToken(USER_ID);

    expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
  });

  it('respects the configured expiry (JWT_EXPIRES_IN)', () => {
    const before = Math.floor(Date.now() / 1000);
    const token = generateToken(USER_ID);
    const decoded = jwt.decode(token);

    // Fixture expiry is `1h`: the token must live for one hour from issuance.
    expect(decoded).toMatchObject({ sub: USER_ID });
    expect(decoded.iat).toBeGreaterThanOrEqual(before);
    expect(decoded.exp - decoded.iat).toBe(60 * 60);
  });

  it('issues distinct tokens that all verify against JWT_SECRET', () => {
    const first = generateToken(USER_ID);
    const second = generateToken(USER_ID);

    expect(jwt.verify(first, SECRET).sub).toBe(USER_ID);
    expect(jwt.verify(second, SECRET).sub).toBe(USER_ID);
  });
});
