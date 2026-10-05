import axios from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { API_BASE_URL } from '../utils/apiConfig.js';
import { clearToken, getToken, setToken } from '../utils/tokenStorage.js';

// The HTTP layer (axios) is an external dependency, so it is mocked; the
// interceptors and handlers under test run for real against the mock instance.
vi.mock('axios');

const mockedAxios = vi.mocked(axios);

function stubLocation(pathname) {
  // jsdom's Location#assign is read-only, so swap out window.location itself
  // (restored in afterEach) and control the pathname via history-free stub.
  const assign = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    writable: true,
    value: { pathname, assign },
  });
  return assign;
}

const originalLocation = window.location;

describe('api service', () => {
  let requestInterceptor;
  let responseSuccessInterceptor;
  let responseErrorInterceptor;
  let createConfig;

  beforeEach(async () => {
    vi.resetModules();
    clearToken();
    mockedAxios.create.mockImplementation((config) => {
      createConfig = config;
      return {
        interceptors: {
          request: {
            use: vi.fn((handler) => {
              requestInterceptor = handler;
            }),
          },
          response: {
            use: vi.fn((onSuccess, onError) => {
              responseSuccessInterceptor = onSuccess;
              responseErrorInterceptor = onError;
            }),
          },
        },
      };
    });
    await import('./api.js');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
    clearToken();
  });

  it('creates the axios instance with the configured base URL', () => {
    expect(mockedAxios.create).toHaveBeenCalledTimes(1);
    expect(createConfig.baseURL).toBe(API_BASE_URL);
  });

  it('attaches the Bearer token when one is stored', () => {
    setToken('secret-jwt');

    const config = requestInterceptor({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer secret-jwt');
  });

  it('omits the Authorization header when no token is stored', () => {
    const config = requestInterceptor({ headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });

  it('preserves existing headers when attaching the token', () => {
    setToken('secret-jwt');

    const config = requestInterceptor({ headers: { 'X-Custom': 'yes' } });

    expect(config.headers.Authorization).toBe('Bearer secret-jwt');
    expect(config.headers['X-Custom']).toBe('yes');
  });

  it('clears the token and redirects to /login on 401', async () => {
    setToken('expired-jwt');
    const assign = stubLocation('/dashboard');
    const error = {
      response: {
        status: 401,
        data: { success: false, error: { message: 'Token expired', code: 'TOKEN_EXPIRED' } },
      },
    };

    await expect(responseErrorInterceptor(error)).rejects.toEqual({
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
    expect(getToken()).toBeNull();
    expect(assign).toHaveBeenCalledWith('/login');
  });

  it('does not redirect-loop when the 401 happens on /login', async () => {
    setToken('expired-jwt');
    const assign = stubLocation('/login');
    const error = {
      response: {
        status: 401,
        data: { success: false, error: { message: 'Unauthorized', code: 'TOKEN_INVALID' } },
      },
    };

    await expect(responseErrorInterceptor(error)).rejects.toEqual({
      message: 'Unauthorized',
      code: 'TOKEN_INVALID',
    });
    expect(getToken()).toBeNull();
    expect(assign).not.toHaveBeenCalled();
  });

  it('normalizes 4xx contract errors to { message, code } without clearing the token', async () => {
    setToken('valid-jwt');
    stubLocation('/dashboard');
    const error = {
      response: {
        status: 400,
        data: {
          success: false,
          error: { message: 'Email already registered', code: 'DUPLICATE_EMAIL' },
        },
      },
    };

    await expect(responseErrorInterceptor(error)).rejects.toEqual({
      message: 'Email already registered',
      code: 'DUPLICATE_EMAIL',
    });
    expect(getToken()).toBe('valid-jwt');
  });

  it('normalizes 5xx contract errors to { message, code }', async () => {
    stubLocation('/dashboard');
    const error = {
      response: {
        status: 500,
        data: {
          success: false,
          error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' },
        },
      },
    };

    await expect(responseErrorInterceptor(error)).rejects.toEqual({
      message: 'Something went wrong',
      code: 'INTERNAL_ERROR',
    });
  });

  it('falls back to a generic shape when the payload has no contract error', async () => {
    stubLocation('/dashboard');
    const error = { message: 'Network Error', request: {} };

    await expect(responseErrorInterceptor(error)).rejects.toEqual({
      message: 'Network Error',
      code: 'UNKNOWN_ERROR',
    });
  });

  it('passes successful responses through untouched', () => {
    const response = { data: { success: true, data: { id: 'abc123' } } };

    expect(responseSuccessInterceptor(response)).toBe(response);
  });
});
