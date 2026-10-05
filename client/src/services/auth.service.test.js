import { beforeEach, describe, expect, it, vi } from 'vitest';

import { login, me, register } from './auth.service.js';
import api from './api.js';

// The HTTP layer is mocked; the service functions under test run for real and
// are verified by the URLs, methods, and bodies they build.
vi.mock('./api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('register() POSTs the payload to /auth/register and returns the envelope', async () => {
    const payload = { name: 'John Doe', email: 'john@example.com', password: 'securePass1' };
    const envelope = {
      success: true,
      data: {
        user: { id: 'abc123', name: 'John Doe', email: 'john@example.com' },
        token: 'jwt-123',
      },
    };
    mockedApi.post.mockResolvedValue({ data: envelope });

    await expect(register(payload)).resolves.toEqual(envelope);
    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', payload);
  });

  it('login() POSTs the payload to /auth/login and returns the envelope', async () => {
    const payload = { email: 'john@example.com', password: 'securePass1' };
    const envelope = {
      success: true,
      data: { user: { id: 'abc123', name: 'John Doe', email: 'john@example.com' }, token: 'jwt' },
    };
    mockedApi.post.mockResolvedValue({ data: envelope });

    await expect(login(payload)).resolves.toEqual(envelope);
    expect(mockedApi.post).toHaveBeenCalledTimes(1);
    expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', payload);
  });

  it('me() GETs /auth/me and returns the envelope', async () => {
    const envelope = {
      success: true,
      data: { id: 'abc123', name: 'John Doe', email: 'john@example.com' },
    };
    mockedApi.get.mockResolvedValue({ data: envelope });

    await expect(me()).resolves.toEqual(envelope);
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
    expect(mockedApi.get).toHaveBeenCalledWith('/auth/me');
  });

  it('propagates normalized { message, code } errors to callers', async () => {
    const normalized = { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' };
    mockedApi.post.mockRejectedValue(normalized);

    await expect(login({ email: 'john@example.com', password: 'wrong' })).rejects.toEqual(
      normalized,
    );
  });
});
