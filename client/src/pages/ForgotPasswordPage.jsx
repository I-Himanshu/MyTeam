import { useState } from 'react';

import * as authService from '../services/auth.service.js';
import styles from './ForgotPasswordPage.module.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Client-side validation mirrors API_CONTRACTS §2.1 so users get instant
// feedback; the server still validates authoritatively.
function validateEmail(email) {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Email is required.';
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return 'Enter a valid email address.';
  }
  return null;
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const error = validateEmail(email);
    setFieldError(error);
    if (error) return;

    setServerError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    try {
      await authService.forgotPassword({ email: email.trim() });
      setSuccessMessage('If an account exists for that email, a reset link has been sent.');
    } catch (err) {
      setServerError(err?.message ?? 'Request failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <h1>Forgot Password</h1>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {serverError && (
          <p className={styles.serverError} role="alert">
            {serverError}
          </p>
        )}
        {successMessage && (
          <p className={styles.success} role="status">
            {successMessage}
          </p>
        )}
        <div className={styles.field}>
          <label className={styles.label} htmlFor="forgot-email">
            Email
          </label>
          <input
            id="forgot-email"
            className={`${styles.input} ${fieldError ? styles.inputError : ''}`}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (fieldError) setFieldError(null);
            }}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? 'forgot-email-error' : undefined}
          />
          {fieldError && (
            <p className={styles.error} id="forgot-email-error" role="alert">
              {fieldError}
            </p>
          )}
        </div>
        <button className={styles.submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Send Reset Link'}
        </button>
      </form>
    </main>
  );
}

export default ForgotPasswordPage;
