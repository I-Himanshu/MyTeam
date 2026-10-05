import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';

// Guards anonymous-only pages (ARCHITECTURE §4.1). An already-authenticated
// user visiting `/login` or `/register` is sent to `/dashboard`. The loading
// placeholder keeps a restoring session from flashing the login form first.
function PublicRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <p role="status">Loading session…</p>;
  }

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ?? <Outlet />;
}

export default PublicRoute;
