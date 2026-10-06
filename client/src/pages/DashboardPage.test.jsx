import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../App.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import { AuthProvider, useAuth } from '../context/AuthContext.jsx';
import { me as meRequest } from '../services/auth.service.js';
import { getToken, setToken } from '../utils/tokenStorage.js';
import DashboardPage from './DashboardPage.jsx';

// The component under test is the dashboard UI: AuthContext (which owns the
// HTTP service layer + tokenStorage) is mocked for unit tests so they assert
// visible messages and navigation, never internals. `auth.service` is mocked
// at the file level so the integration tests below drive the REAL AuthProvider
// (session restore + logout storage clearing) without touching the network.
vi.mock('../context/AuthContext.jsx', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useAuth: vi.fn() };
});

vi.mock('../services/auth.service.js', () => ({
  register: vi.fn(),
  login: vi.fn(),
  me: vi.fn(),
}));

// Navigation is mocked by default (prior page-task pattern) so unit tests can
// assert the exact navigate() call; integration tests swap in the real
// `useNavigate` to verify actual route changes.
const mockNavigate = vi.fn();
let useNavigateImpl = () => mockNavigate;
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: (...args) => useNavigateImpl(...args) };
});

const mockLoadUser = vi.fn();
const mockLogout = vi.fn();

const authenticatedState = () => ({
  user: { id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com' },
  token: 'token-123',
  loading: false,
  error: null,
  loadUser: mockLoadUser,
  logout: mockLogout,
});

function renderPage() {
  return render(<DashboardPage />);
}

async function useRealAuthAndRouter() {
  const actualAuth = await vi.importActual('../context/AuthContext.jsx');
  vi.mocked(useAuth).mockImplementation(actualAuth.useAuth);
  const actualRouter = await vi.importActual('react-router-dom');
  useNavigateImpl = actualRouter.useNavigate;
}

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  useNavigateImpl = () => mockNavigate;
  vi.mocked(useAuth).mockReturnValue({
    user: null,
    token: null,
    loading: false,
    error: null,
    loadUser: mockLoadUser,
    logout: mockLogout,
  });
  vi.mocked(meRequest).mockResolvedValue({
    success: true,
    data: { id: 'u1', name: 'Ada', email: 'ada@example.com' },
  });
});

describe('DashboardPage', () => {
  it('renders a welcome message with the logged-in user name', () => {
    vi.mocked(useAuth).mockReturnValue(authenticatedState());
    renderPage();

    expect(screen.getByText(/welcome, ada lovelace!/i)).toBeInTheDocument();
    expect(screen.getByText(/signed in as ada@example\.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^logout$/i })).toBeInTheDocument();
    // The session is already hydrated — no extra `me()` round-trip.
    expect(mockLoadUser).not.toHaveBeenCalled();
  });

  it('never renders password or token material', () => {
    vi.mocked(useAuth).mockReturnValue(authenticatedState());
    renderPage();

    expect(screen.queryByText(/password/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/token-123/)).not.toBeInTheDocument();
  });

  it('shows a loading state while the provider restores the session', () => {
    vi.mocked(useAuth).mockReturnValue({
      ...authenticatedState(),
      user: null,
      token: 'token-123',
      loading: true,
    });
    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
    expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument();
    // Skipped while the provider is already loading — no duplicate `me()`.
    expect(mockLoadUser).not.toHaveBeenCalled();
  });

  it('shows a loading state until hydration completes', async () => {
    mockLoadUser.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(await screen.findByRole('status')).toHaveTextContent(/loading/i);
    expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument();
    expect(mockLoadUser).toHaveBeenCalledTimes(1);
  });

  it('renders an error message with a retry affordance when hydration fails', async () => {
    mockLoadUser.mockRejectedValue({ message: 'Session expired. Please log in again.' });
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Session expired');
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => expect(mockLoadUser).toHaveBeenCalledTimes(2));
  });

  it('logs out, then navigates to /login with replace so back cannot return', () => {
    vi.mocked(useAuth).mockReturnValue(authenticatedState());
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /^logout$/i }));

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});

describe('DashboardPage route integration', () => {
  it('renders the app without a session at /dashboard on /login', async () => {
    await useRealAuthAndRouter();
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument();
  });

  it('logout clears the stored session and lands on /login', async () => {
    await useRealAuthAndRouter();
    setToken('valid-token');
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<h1>Login Page</h1>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/welcome, ada/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^logout$/i }));

    expect(await screen.findByRole('heading', { name: 'Login Page' })).toBeInTheDocument();
    expect(getToken()).toBeNull();
    expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument();
  });
});
