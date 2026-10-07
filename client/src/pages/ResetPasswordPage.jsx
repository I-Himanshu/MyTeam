import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import * as authService from '../services/auth.service.js';
import styles from './ResetPasswordPage.module.css';

// Client-side validation mirrors API_CONTRACTS §2.1 so users get instant
// feedback; the server still validates authoritatively.
function validateValues({ password, confirmPassword }) {
  const errors = {};
  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validateValues({ password, confirmPassword });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setServerError('');
    setIsSubmitting(true);
    try {
      await authService.resetPassword({ token, newPassword: password });
      navigate('/login', { replace: true });
    } catch (err) {
      setServerError(err?.message ?? 'Reset failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <main className={styles.page}>
        <h1>Reset Password</h1>
        <p className={styles.serverError} role="alert">
          Invalid or missing reset token. Please request a new password reset link.
        </p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <h1>Reset Password</h1>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {serverError && (
          <p className={styles.serverError} role="alert">
            {serverError}
          </p>
        )}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="reset-password">
            New Password
          </label>
          <input
            id="reset-password"
            className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearFieldError('password');
            }}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'reset-password-error' : undefined}
          />
          {fieldErrors.password && (
            <p className={styles.error} id="reset-password-error" role="alert">
              {fieldErrors.password}
            </p>
          )}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="reset-confirm-password">
            Confirm New Password
          </label>
          <input
            id="reset-confirm-password"
            className={`${styles.input} ${fieldErrors.confirmPassword ? styles.inputError : ''}`}
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              clearFieldError('confirmPassword');
            }}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            aria-describedby={
              fieldErrors.confirmPassword ? 'reset-confirm-password-error' : undefined
            }
          />
          {fieldErrors.confirmPassword && (
            <p className={styles.error} id="reset-confirm-password-error" role="alert">
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>
        <button className={styles.submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Resetting…' : 'Reset Password'}
        </button>
      </form>
    </main>
  );
}

export default ResetPasswordPage;
