import { Navigate, Route, Routes } from 'react-router-dom';

import Navigation from './components/Navigation.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicRoute from './components/PublicRoute.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import styles from './App.module.css';

// Route guards (TASK-011, ARCHITECTURE §4.1): `/dashboard` and `/profile`
// require a session, `/login` and `/register` redirect authenticated users
// to `/dashboard`. Page contents belong to their own tasks — no logic here.
function App() {
  return (
    <div className={styles.app}>
      <AuthProvider>
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPasswordPage />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;
