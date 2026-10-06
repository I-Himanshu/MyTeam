import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import App from './App.jsx';

function renderAppAt(route) {
  render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('App routing skeleton', () => {
  it('renders the login placeholder when visiting /', async () => {
    renderAppAt('/');

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('renders the login placeholder at /login', async () => {
    renderAppAt('/login');

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('renders the register placeholder at /register', async () => {
    renderAppAt('/register');

    expect(await screen.findByRole('heading', { name: 'Register' })).toBeInTheDocument();
  });

  // TASK-011: /dashboard and /profile are protected — anonymous visits land
  // on /login instead of the page placeholders.
  it('redirects an unauthenticated visit to /dashboard to /login', async () => {
    renderAppAt('/dashboard');

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument();
  });

  it('redirects an unauthenticated visit to /profile to /login', async () => {
    renderAppAt('/profile');

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Profile' })).not.toBeInTheDocument();
  });

  it('renders navigation links to every route', async () => {
    renderAppAt('/login');

    await screen.findByRole('heading', { name: 'Login' });
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/profile');
  });
});
