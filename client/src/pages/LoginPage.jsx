import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext.jsx';
import styles from './LoginPage.module.css';

// Client-side checks are UX only (API_CONTRACTS §2.2) — the server remains
// authoritative. The form-level message never indicates whether the email or
// the password was wrong (PRD US-002: no enumeration).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_ERROR = 'Invalid email or password.';

function validate(email, password) {
  const errors = { email: null, password: null };
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  }
  return errors;
}

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: null, password: null });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validate(email, password);
    setFieldErrors(errors);
    if (errors.email || errors.password) {
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      // Session persistence is owned by AuthContext (tokenStorage); this page
      // never touches storage directly.
      await login({ email: email.trim(), password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setFormError(err?.message ?? GENERIC_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <h1>Login</h1>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            className={styles.input}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
          />
          {fieldErrors.email && (
            <p className={styles.fieldError} id="login-email-error" role="alert">
              {fieldErrors.email}
            </p>
          )}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            className={styles.input}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
          />
          {fieldErrors.password && (
            <p className={styles.fieldError} id="login-password-error" role="alert">
              {fieldErrors.password}
            </p>
          )}
        </div>
        <button className={styles.submit} type="submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Login'}
        </button>
      </form>
    </main>
  );
}

export default LoginPage;
