import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import RegisterPage from './RegisterPage.jsx';
import { register } from '../services/auth.service.js';

// The service layer is mocked; RegisterPage itself runs for real. Tests assert
// user-visible behavior (messages, navigation, button state), not internals.
vi.mock('../services/auth.service.js', () => ({
  register: vi.fn(),
}));

const mockedRegister = vi.mocked(register);

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  );
}

function fillValidForm({ name = 'John Doe', email = 'john@example.com', password = 'securePass1' } = {}) {
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: name } });
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedRegister.mockResolvedValue({
    success: true,
    data: { user: { id: 'abc123' }, token: 'jwt-123' },
  });
});

describe('RegisterPage', () => {
  it('renders name, email, and password fields with a submit button', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });

  it('blocks submission when the name is shorter than 2 characters', async () => {
    renderPage();
    fillValidForm({ name: 'J' });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Name must be at least 2 characters.')).toBeInTheDocument();
    expect(mockedRegister).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('blocks submission when the name is longer than 50 characters', async () => {
    renderPage();
    fillValidForm({ name: 'a'.repeat(51) });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Name must be no more than 50 characters.')).toBeInTheDocument();
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it('blocks submission for an invalid email address', async () => {
    renderPage();
    fillValidForm({ email: 'not-an-email' });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it('blocks submission when the password is shorter than 8 characters', async () => {
    renderPage();
    fillValidForm({ password: 'short' });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(mockedRegister).not.toHaveBeenCalled();
  });

  it('calls register with the form values, shows confirmation, and navigates to /login', async () => {
    renderPage();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(mockedRegister).toHaveBeenCalledTimes(1);
    });
    expect(mockedRegister).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'securePass1',
    });
    expect(await screen.findByText(/Registration successful!/)).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('displays the server DUPLICATE_EMAIL message without navigating', async () => {
    mockedRegister.mockRejectedValue({
      message: 'Email already registered',
      code: 'DUPLICATE_EMAIL',
    });
    renderPage();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    expect(await screen.findByText('Email already registered')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('disables the submit button while the request is pending', async () => {
    let resolveRegister;
    mockedRegister.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRegister = resolve;
        }),
    );
    renderPage();
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));

    const pendingButton = await screen.findByRole('button', { name: 'Registering…' });
    expect(pendingButton).toBeDisabled();

    resolveRegister({ success: true, data: {} });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Register' })).not.toBeDisabled();
    });
  });
});
