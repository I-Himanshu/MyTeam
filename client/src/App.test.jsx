import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import App from './App.jsx';

function renderAppAt(route) {
  render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  );
}

describe('App routing skeleton', () => {
  it('renders the login placeholder when visiting /', () => {
    renderAppAt('/');

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('renders the login placeholder at /login', () => {
    renderAppAt('/login');

    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('renders the register placeholder at /register', () => {
    renderAppAt('/register');

    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
  });

  it('renders the dashboard placeholder at /dashboard', () => {
    renderAppAt('/dashboard');

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('renders the profile placeholder at /profile', () => {
    renderAppAt('/profile');

    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
  });

  it('renders navigation links to every route', () => {
    renderAppAt('/login');

    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile');
  });
});
