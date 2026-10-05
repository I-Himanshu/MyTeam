import { beforeEach, describe, expect, it } from 'vitest';

import { clearToken, getToken, setToken } from './tokenStorage.js';

describe('tokenStorage', () => {
  beforeEach(() => {
    clearToken();
  });

  it('returns null when no token is stored', () => {
    expect(getToken()).toBeNull();
  });

  it('round-trips a token through set and get', () => {
    setToken('jwt-123');

    expect(getToken()).toBe('jwt-123');
  });

  it('overwrites the previously stored token', () => {
    setToken('first');
    setToken('second');

    expect(getToken()).toBe('second');
  });

  it('clears the stored token', () => {
    setToken('jwt-123');
    clearToken();

    expect(getToken()).toBeNull();
  });

  it('clearing an empty store does not throw', () => {
    expect(() => clearToken()).not.toThrow();
    expect(getToken()).toBeNull();
  });
});
