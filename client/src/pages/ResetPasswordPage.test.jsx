import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ResetPasswordPage from './ResetPasswordPage.jsx';
import { resetPassword } from '../services/auth.service.js';

// The service layer is mocked; ResetPasswordPage itself runs for real. Tests
// assert user-visible behavior (messages, navigation, button state), not
// internals.
vi.mock('../services/auth.service.js', () => ({
  resetPassword: vi.fn(),
}));

const mockedResetPassword = vi.mocked(resetPassword);

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderPage({ token = 'valid-token-123' } = {}) {
  const initialEntry = token ? `/reset-password?token=${token}` : '/reset-password';
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function fillValidForm({ password = 'newPass123', confirmPassword = 'newPass123' } = {}) {
  fireEvent.change(screen.getByLabelText('New Password'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('Confirm New Password'), {
    target: { value: confirmPassword },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedResetPassword.mockResolvedValue({ success: true, data: {} });
});

describe('ResetPasswordPage', () => {
  it('renders password and confirm password inputs with a submit button', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
  });

  it('shows an error when the token is missing', () => {
    renderPage({ token: null });

    expect(screen.getByText(/invalid or missing reset token/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('New Password')).not.toBeInTheDocument();
  });

  it('blocks submission when the password is shorter than 8 characters', async () => {
    renderPage();

    fillValidForm({ password: 'short', confirmPassword: 'short' });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(mockedResetPassword).not.toHaveBeenCalled();
  });

  it('blocks submission when passwords do not match', async () => {
    renderPage();

    fillValidForm({ password: 'newPass123', confirmPassword: 'differentPass' });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument();
    expect(mockedResetPassword).not.toHaveBeenCalled();
  });

  it('blocks submission when the confirm password is empty', async () => {
    renderPage();

    fillValidForm({ password: 'newPass123', confirmPassword: '' });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(await screen.findByText('Please confirm your password.')).toBeInTheDocument();
    expect(mockedResetPassword).not.toHaveBeenCalled();
  });

  it('extracts token from URL and calls resetPassword, then redirects to /login', async () => {
    renderPage({ token: 'abc-token-xyz' });

    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(mockedResetPassword).toHaveBeenCalledTimes(1);
    });
    expect(mockedResetPassword).toHaveBeenCalledWith({
      token: 'abc-token-xyz',
      newPassword: 'newPass123',
    });
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('shows error on invalid or expired token', async () => {
    mockedResetPassword.mockRejectedValue({
      message: 'Reset token is invalid or has expired',
      code: 'TOKEN_INVALID',
    });
    renderPage({ token: 'expired-token' });

    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('disables the submit button while the request is pending', async () => {
    let resolveReset;
    mockedResetPassword.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReset = resolve;
        }),
    );
    renderPage();

    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    const pendingButton = await screen.findByRole('button', { name: /resetting/i });
    expect(pendingButton).toBeDisabled();

    resolveReset({ success: true, data: {} });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reset Password' })).not.toBeDisabled();
    });
  });
});
