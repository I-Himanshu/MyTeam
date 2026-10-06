import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '../context/AuthContext.jsx';
import { getProfile, updateProfile } from '../services/user.service.js';
import ProfilePage from './ProfilePage.jsx';

// The service layer and AuthContext are mocked; ProfilePage itself runs for
// real. Tests assert user-visible behavior (values, messages, button state),
// not internals.
vi.mock('../services/user.service.js', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

const mockedGetProfile = vi.mocked(getProfile);
const mockedUpdateProfile = vi.mocked(updateProfile);
const mockedUseAuth = vi.mocked(useAuth);
const mockLoadUser = vi.fn();

const storedProfile = {
  success: true,
  data: {
    id: 'abc123',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: '2026-10-05T00:00:00.000Z',
    updatedAt: '2026-10-05T00:00:00.000Z',
  },
};

function renderPage() {
  return render(<ProfilePage />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseAuth.mockReturnValue({ loadUser: mockLoadUser });
  mockedGetProfile.mockResolvedValue(storedProfile);
  mockedUpdateProfile.mockImplementation(async ({ name }) => ({
    success: true,
    data: { ...storedProfile.data, name },
  }));
});

describe('ProfilePage', () => {
  it('shows a loading state while the profile is being fetched', () => {
    mockedGetProfile.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('Loading profile…');
  });

  it('renders the fetched name and a read-only email input', async () => {
    renderPage();

    const nameInput = await screen.findByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    expect(nameInput).toHaveValue('John Doe');
    expect(emailInput).toHaveValue('john@example.com');
    expect(emailInput).toBeDisabled();
    expect(emailInput).toHaveAttribute('readOnly');
  });

  it('blocks saving when the name is shorter than 2 characters', async () => {
    renderPage();
    const nameInput = await screen.findByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'J' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Name must be at least 2 characters.')).toBeInTheDocument();
    expect(mockedUpdateProfile).not.toHaveBeenCalled();
  });

  it('blocks saving when the name is longer than 50 characters', async () => {
    renderPage();
    const nameInput = await screen.findByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'a'.repeat(51) } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Name must be no more than 50 characters.')).toBeInTheDocument();
    expect(mockedUpdateProfile).not.toHaveBeenCalled();
  });

  it('saves the new name, shows a confirmation, and syncs AuthContext', async () => {
    renderPage();
    const nameInput = await screen.findByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(mockedUpdateProfile).toHaveBeenCalledTimes(1);
    });
    expect(mockedUpdateProfile).toHaveBeenCalledWith({ name: 'Jane Doe' });
    expect(await screen.findByText('Profile updated successfully.')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Jane Doe');
    await waitFor(() => {
      expect(mockLoadUser).toHaveBeenCalledTimes(1);
    });
  });

  it('shows the new name after a reload following a successful save', async () => {
    const { unmount } = renderPage();
    const nameInput = await screen.findByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Profile updated successfully.');
    unmount();

    // A reload re-fetches the profile; the server now returns the new name.
    mockedGetProfile.mockResolvedValue({
      success: true,
      data: { ...storedProfile.data, name: 'Jane Doe' },
    });
    renderPage();

    expect(await screen.findByLabelText('Name')).toHaveValue('Jane Doe');
  });

  it('displays server validation errors without a confirmation', async () => {
    mockedUpdateProfile.mockRejectedValue({
      message: 'Name must be at least 2 characters.',
      code: 'VALIDATION_ERROR',
    });
    renderPage();
    const nameInput = await screen.findByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'Jo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Name must be at least 2 characters.')).toBeInTheDocument();
    expect(screen.queryByText('Profile updated successfully.')).not.toBeInTheDocument();
  });

  it('displays a load error with a retry option when fetching fails', async () => {
    mockedGetProfile.mockRejectedValue({ message: 'Failed to load profile.', code: 'UNKNOWN' });
    renderPage();

    expect(await screen.findByText('Failed to load profile.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();

    mockedGetProfile.mockResolvedValue(storedProfile);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByLabelText('Name')).toHaveValue('John Doe');
  });

  it('disables the save button while the update is pending', async () => {
    let resolveUpdate;
    mockedUpdateProfile.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve;
        }),
    );
    renderPage();
    const nameInput = await screen.findByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    const pendingButton = await screen.findByRole('button', { name: 'Saving…' });
    expect(pendingButton).toBeDisabled();

    resolveUpdate({ success: true, data: { ...storedProfile.data, name: 'Jane Doe' } });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save changes' })).not.toBeDisabled();
    });
  });
});
