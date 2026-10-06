import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getProfile, updateProfile } from './user.service.js';
import api from './api.js';

// The HTTP layer is mocked; the service functions under test run for real and
// are verified by the URLs, methods, and bodies they build.
vi.mock('./api.js', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

describe('user.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getProfile() GETs /users/profile and returns the envelope', async () => {
    const envelope = {
      success: true,
      data: {
        id: 'abc123',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: '2026-10-05T00:00:00.000Z',
        updatedAt: '2026-10-05T00:00:00.000Z',
      },
    };
    mockedApi.get.mockResolvedValue({ data: envelope });

    await expect(getProfile()).resolves.toEqual(envelope);
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
    expect(mockedApi.get).toHaveBeenCalledWith('/users/profile');
  });

  it('updateProfile() PUTs the name to /users/profile and returns the envelope', async () => {
    const envelope = {
      success: true,
      data: {
        id: 'abc123',
        name: 'Jane Doe',
        email: 'john@example.com',
        updatedAt: '2026-10-05T12:00:00.000Z',
      },
    };
    mockedApi.put.mockResolvedValue({ data: envelope });

    await expect(updateProfile({ name: 'Jane Doe' })).resolves.toEqual(envelope);
    expect(mockedApi.put).toHaveBeenCalledTimes(1);
    expect(mockedApi.put).toHaveBeenCalledWith('/users/profile', { name: 'Jane Doe' });
  });

  it('propagates normalized { message, code } errors to callers', async () => {
    const normalized = { message: 'Name must be at least 2 characters.', code: 'VALIDATION_ERROR' };
    mockedApi.put.mockRejectedValue(normalized);

    await expect(updateProfile({ name: 'J' })).rejects.toEqual(normalized);
  });
});
