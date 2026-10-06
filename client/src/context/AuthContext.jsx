import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { login as loginRequest, me as meRequest } from '../services/auth.service.js';
import { clearToken, getToken, setToken } from '../utils/tokenStorage.js';

// Authentication state (ARCHITECTURE §4.2). This context owns the session:
// the current user, the stored JWT, and the loading/error flags every auth
// call must expose (ENGINEERING_RULES §3.3). `register()` is deliberately
// absent — PRD US-001 redirects to login after registering, so the Register
// page calls `authService.register()` directly.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // The token initializes from storage so a refresh keeps the session; the
  // user object is re-hydrated via `me()` on mount because only the token
  // persists across reloads.
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the current user for the stored token. A missing token is a clean
  // anonymous state; a failed fetch means the token is invalid/expired, so
  // the session is dropped and route guards send the user to `/login`. (The
  // api.js 401 interceptor clears storage on real HTTP traffic; catching
  // here keeps React state consistent for every failure shape.)
  const loadUser = useCallback(async () => {
    const storedToken = getToken();
    setTokenState(storedToken ?? null);
    if (!storedToken) {
      setUser(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const envelope = await meRequest();
      const currentUser = envelope?.data?.user ?? envelope?.data ?? null;
      setUser(currentUser);
      return currentUser;
    } catch (err) {
      clearToken();
      setTokenState(null);
      setUser(null);
      setError(err ?? null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const envelope = await loginRequest(credentials);
      const payload = envelope?.data ?? {};
      const nextToken = payload.token ?? null;
      const nextUser = payload.user ?? null;
      if (nextToken) {
        setToken(nextToken);
      }
      setTokenState(nextToken);
      setUser(nextUser);
      return { user: nextUser, token: nextToken };
    } catch (err) {
      setError(err ?? null);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
    setError(null);
  }, []);

  // Session restore: a stored token triggers `me()` to hydrate the user.
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      loading,
      error,
      login,
      logout,
      loadUser,
    }),
    [user, token, loading, error, login, logout, loadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
