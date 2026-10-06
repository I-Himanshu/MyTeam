import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from './AuthContext.jsx';
import { login as loginRequest, me as meRequest } from '../services/auth.service.js';
import { getToken, setToken } from '../utils/tokenStorage.js';

// `auth.service` is the external (HTTP) dependency — mocked so these tests
// verify context behavior, never the network.
vi.mock('../services/auth.service.js', () => ({
  register: vi.fn(),
  login: vi.fn(),
  me: vi.fn(),
}));

// Minimal consumer that exposes context state and actions as DOM assertions.
function Harness() {
  const { user, token, loading, error, login, logout } = useAuth();

  const handleLogin = () => {
    void login({ email: 'ada@example.com', password: 'password123' }).catch(() => {});
  };

  return (
    <div>
      <p data-testid="loading">{loading ? 'loading' : 'idle'}</p>
      <p data-testid="user">{user ? user.name : 'no-user'}</p>
      <p data-testid="token">{token ?? 'no-token'}</p>
      <p data-testid="error">{error ? error.message : 'no-error'}</p>
      <button type="button" onClick={handleLogin}>
        sign-in
      </button>
      <button type="button" onClick={logout}>
        sign-out
      </button>
    </div>
  );
}

function renderHarness() {
  render(
    <AuthProvider>
      <Harness />
    </AuthProvider>,
  );
}

async function waitForIdle() {
  await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('idle'));
}

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

describe('AuthContext', () => {
  it('populates the user and stores the token after a successful login', async () => {
    vi.mocked(loginRequest).mockResolvedValue({
      success: true,
      data: { user: { name: 'Ada' }, token: 'token-123' },
    });
    renderHarness();
    await waitForIdle();

    fireEvent.click(screen.getByRole('button', { name: 'sign-in' }));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Ada'));
    expect(screen.getByTestId('token')).toHaveTextContent('token-123');
    expect(getToken()).toBe('token-123');
    expect(meRequest).not.toHaveBeenCalled();
  });

  it('surfaces an error when login fails and keeps the session empty', async () => {
    vi.mocked(loginRequest).mockRejectedValue({
      message: 'Invalid email or password.',
      code: 'INVALID_CREDENTIALS',
    });
    renderHarness();
    await waitForIdle();

    fireEvent.click(screen.getByRole('button', { name: 'sign-in' }));

    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid email or password.'),
    );
    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(getToken()).toBeNull();
  });

  it('hydrates the user name from a stored token on mount', async () => {
    setToken('stored-token');
    vi.mocked(meRequest).mockResolvedValue({ success: true, data: { name: 'Ada' } });
    renderHarness();

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Ada'));
    expect(meRequest).toHaveBeenCalledTimes(1);
    expect(getToken()).toBe('stored-token');
  });

  it('clears a stored-but-invalid token instead of crashing', async () => {
    setToken('stale-token');
    vi.mocked(meRequest).mockRejectedValue({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
    renderHarness();

    await waitForIdle();

    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(screen.getByTestId('token')).toHaveTextContent('no-token');
    expect(getToken()).toBeNull();
  });

  it('logout clears token storage and auth state', async () => {
    vi.mocked(loginRequest).mockResolvedValue({
      success: true,
      data: { user: { name: 'Ada' }, token: 'token-123' },
    });
    renderHarness();
    await waitForIdle();
    fireEvent.click(screen.getByRole('button', { name: 'sign-in' }));
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Ada'));

    fireEvent.click(screen.getByRole('button', { name: 'sign-out' }));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('no-user'));
    expect(screen.getByTestId('token')).toHaveTextContent('no-token');
    expect(getToken()).toBeNull();
  });

  it('stays anonymous without calling me() when no token is stored', async () => {
    renderHarness();

    await waitForIdle();

    expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    expect(meRequest).not.toHaveBeenCalled();
  });
});
