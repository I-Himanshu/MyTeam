import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import styles from './DashboardPage.module.css';

// Protected landing for PRD US-003: proof the session is active. The route
// guard (ProtectedRoute) owns unauthenticated redirects — this page only
// renders for a session, showing the user's name from AuthContext and a
// logout button. Hydration goes through `loadUser()` (API_CONTRACTS §2.3
// shape `{ success, data: { id, name, email, createdAt } }` normalized by
// AuthContext), never a direct endpoint call.
const FALLBACK_ERROR = 'Could not load your session. Please try again.';

function DashboardPage() {
  const { user, loading, error, loadUser, logout } = useAuth();
  const navigate = useNavigate();
  const [hydrating, setHydrating] = useState(false);
  const [hydrateError, setHydrateError] = useState(null);

  const hydrate = useCallback(async () => {
    setHydrating(true);
    setHydrateError(null);
    try {
      const currentUser = await loadUser();
      if (!currentUser) {
        setHydrateError(new Error(FALLBACK_ERROR));
      }
    } catch (err) {
      setHydrateError(err instanceof Error ? err : new Error(err?.message ?? FALLBACK_ERROR));
    } finally {
      setHydrating(false);
    }
  }, [loadUser]);

  // Safety net: AuthProvider already hydrates on mount, so this only fires
  // when the page mounts without a user (e.g. a session that has not been
  // restored yet). Skipped while the provider is already loading to avoid a
  // duplicate `me()` request.
  useEffect(() => {
    if (!user && !loading) {
      hydrate();
    }
  }, [user, loading, hydrate]);

  const handleLogout = () => {
    // AuthContext clears the token + state; `replace` keeps the dashboard
    // out of the history stack so back-navigation lands on `/login`,
    // where the guard keeps the dashboard unreachable.
    logout();
    navigate('/login', { replace: true });
  };

  // Explicit loading state (ENGINEERING_RULES §3.3) while the user hydrates.
  if (loading || hydrating) {
    return (
      <main className={styles.page}>
        <h1>Dashboard</h1>
        <p role="status">Loading your dashboard…</p>
      </main>
    );
  }

  // Error state with a retry path when hydration fails. Only non-sensitive
  // fields (name, email) are ever rendered — never password or token.
  if (!user) {
    const message = hydrateError?.message ?? error?.message ?? FALLBACK_ERROR;
    return (
      <main className={styles.page}>
        <h1>Dashboard</h1>
        <p className={styles.error} role="alert">
          {message}
        </p>
        <button className={styles.retry} type="button" onClick={hydrate}>
          Try again
        </button>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <h1>Dashboard</h1>
      <p className={styles.welcome}>Welcome, {user.name}!</p>
      {user.email && <p className={styles.session}>Signed in as {user.email}</p>}
      <button className={styles.logout} type="button" onClick={handleLogout}>
        Logout
      </button>
    </main>
  );
}

export default DashboardPage;
