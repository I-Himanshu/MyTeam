import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';

// Guards authenticated pages (ARCHITECTURE §4.1). Without a token the user
// goes to `/login`. While a stored session is still restoring (`loading`),
// a placeholder renders instead of redirecting so the page never flashes
// to `/login` before `me()` resolves.
function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <p role="status">Loading session…</p>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children ?? <Outlet />;
}

export default ProtectedRoute;
