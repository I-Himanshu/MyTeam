import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ForgotPasswordPage from './ForgotPasswordPage.jsx';
import { forgotPassword } from '../services/auth.service.js';

// The service layer is mocked; ForgotPasswordPage itself runs for real. Tests
// assert user-visible behavior (messages, button state), not internals.
vi.mock('../services/auth.service.js', () => ({
  forgotPassword: vi.fn(),
}));

const mockedForgotPassword = vi.mocked(forgotPassword);

function renderPage() {
  return render(<ForgotPasswordPage />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedForgotPassword.mockResolvedValue({ success: true, data: {} });
});

describe('ForgotPasswordPage', () => {
  it('renders email input and submit button', () => {
    renderPage();

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Reset Link' })).toBeInTheDocument();
  });

  it('blocks submission for an empty email', async () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
    expect(mockedForgotPassword).not.toHaveBeenCalled();
  });

  it('blocks submission for an invalid email address', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'not-an-email' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(mockedForgotPassword).not.toHaveBeenCalled();
  });

  it('calls forgotPassword with the email and shows success message', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(mockedForgotPassword).toHaveBeenCalledTimes(1);
    });
    expect(mockedForgotPassword).toHaveBeenCalledWith({ email: 'ada@example.com' });
    expect(await screen.findByText(/reset link has been sent/i)).toBeInTheDocument();
  });

  it('shows error message on failure', async () => {
    mockedForgotPassword.mockRejectedValue({
      message: 'Server error',
      code: 'INTERNAL_ERROR',
    });
    renderPage();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    expect(await screen.findByText('Server error')).toBeInTheDocument();
  });

  it('disables the submit button while the request is pending', async () => {
    let resolveForgot;
    mockedForgotPassword.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveForgot = resolve;
        }),
    );
    renderPage();

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'ada@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    const pendingButton = await screen.findByRole('button', { name: /sending/i });
    expect(pendingButton).toBeDisabled();

    resolveForgot({ success: true, data: {} });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Send Reset Link' })).not.toBeDisabled();
    });
  });
});
