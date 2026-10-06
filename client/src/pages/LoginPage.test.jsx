import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import LoginPage from './LoginPage.jsx';

// The component under test is the form UI: AuthContext (which owns the HTTP
// service layer + tokenStorage) and router navigation are mocked so these
// tests assert visible messages and navigation, never internals.
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

function renderPage() {
  render(<LoginPage />);
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'ada@example.com' },
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'password123' },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  vi.mocked(useAuth).mockReturnValue({ login: mockLogin });
});

describe('LoginPage', () => {
  it('renders email and password fields with a submit button', () => {
    mockLogin.mockResolvedValue({ user: { name: 'Ada' }, token: 'token-123' });
    renderPage();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('blocks submission and shows field-level messages for empty fields', async () => {
    mockLogin.mockResolvedValue({ user: { name: 'Ada' }, token: 'token-123' });
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('blocks submission and shows a field-level message for a malformed email', async () => {
    mockLogin.mockResolvedValue({ user: { name: 'Ada' }, token: 'token-123' });
    renderPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'not-an-email' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to /dashboard after a successful login', async () => {
    mockLogin.mockResolvedValue({ user: { name: 'Ada' }, token: 'token-123' });
    renderPage();
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'password123',
    }));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true }),
    );
  });

  it('renders the generic server message on 401 without enumerating the field', async () => {
    mockLogin.mockRejectedValue({
      message: 'Invalid email or password.',
      code: 'INVALID_CREDENTIALS',
    });
    renderPage();
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    // A single form-level message: no per-field hint about which part failed.
    expect(screen.queryByText('Email is required.')).not.toBeInTheDocument();
    expect(screen.queryByText('Password is required.')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('disables the submit button while the login request is pending', async () => {
    let resolveLogin;
    mockLogin.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      }),
    );
    renderPage();
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

    const submit = screen.getByRole('button', { name: /logging in/i });
    expect(submit).toBeDisabled();
    expect(mockLogin).toHaveBeenCalledTimes(1);

    resolveLogin({ user: { name: 'Ada' }, token: 'token-123' });

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true }),
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^login$/i })).not.toBeDisabled(),
    );
  });
});
