import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '../context/AuthContext.jsx';
import { me as meRequest } from '../services/auth.service.js';
import { getToken, setToken } from '../utils/tokenStorage.js';
import ProtectedRoute from './ProtectedRoute.jsx';
import PublicRoute from './PublicRoute.jsx';

// `auth.service` is the external (HTTP) dependency — mocked so these tests
// assert navigation outcomes, never the network.
vi.mock('../services/auth.service.js', () => ({
  register: vi.fn(),
  login: vi.fn(),
  me: vi.fn(),
}));

function renderGuardsAt(route) {
  render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <h1>Login Page</h1>
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <h1>Register Page</h1>
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <h1>Dashboard Content</h1>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <h1>Profile Content</h1>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

function givenValidSession() {
  setToken('valid-token');
  vi.mocked(meRequest).mockResolvedValue({ success: true, data: { name: 'Ada' } });
}

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

describe('ProtectedRoute', () => {
  it('redirects an unauthenticated visit to /dashboard to /login', async () => {
    renderGuardsAt('/dashboard');

    expect(await screen.findByRole('heading', { name: 'Login Page' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Dashboard Content' }),
    ).not.toBeInTheDocument();
  });

  it('redirects an unauthenticated visit to /profile to /login', async () => {
    renderGuardsAt('/profile');

    expect(await screen.findByRole('heading', { name: 'Login Page' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Profile Content' })).not.toBeInTheDocument();
  });

  it('renders protected content with a valid session', async () => {
    givenValidSession();
    renderGuardsAt('/dashboard');

    expect(await screen.findByRole('heading', { name: 'Dashboard Content' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Login Page' })).not.toBeInTheDocument();
  });

  it('ends at /login with a clean session for a stored-but-invalid token', async () => {
    setToken('stale-token');
    vi.mocked(meRequest).mockRejectedValue({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
    renderGuardsAt('/dashboard');

    expect(await screen.findByRole('heading', { name: 'Login Page' })).toBeInTheDocument();
    expect(getToken()).toBeNull();
  });

  it('shows a loading state instead of flashing a redirect while restoring', async () => {
    let resolveRestore;
    vi.mocked(meRequest).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRestore = resolve;
        }),
    );
    setToken('stored-token');
    renderGuardsAt('/dashboard');

    expect(await screen.findByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Login Page' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Dashboard Content' }),
    ).not.toBeInTheDocument();

    await act(async () => {
      resolveRestore({ success: true, data: { name: 'Ada' } });
    });

    expect(await screen.findByRole('heading', { name: 'Dashboard Content' })).toBeInTheDocument();
  });
});

describe('PublicRoute', () => {
  it('renders the login page for anonymous visitors', async () => {
    renderGuardsAt('/login');

    expect(await screen.findByRole('heading', { name: 'Login Page' })).toBeInTheDocument();
  });

  it('redirects an authenticated visit to /login to /dashboard', async () => {
    givenValidSession();
    renderGuardsAt('/login');

    expect(await screen.findByRole('heading', { name: 'Dashboard Content' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Login Page' })).not.toBeInTheDocument();
  });

  it('redirects an authenticated visit to /register to /dashboard', async () => {
    givenValidSession();
    renderGuardsAt('/register');

    expect(await screen.findByRole('heading', { name: 'Dashboard Content' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Register Page' })).not.toBeInTheDocument();
  });
});
