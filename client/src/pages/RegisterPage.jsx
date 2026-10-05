import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import * as authService from '../services/auth.service.js';
import styles from './RegisterPage.module.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Client-side validation mirrors API_CONTRACTS §2.1 so users get instant
// feedback; the server still validates authoritatively.
function validateValues({ name, email, password }) {
  const errors = {};
  const trimmedName = name.trim();
  if (!trimmedName) {
    errors.name = 'Name is required.';
  } else if (trimmedName.length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (trimmedName.length > 50) {
    errors.name = 'Name must be no more than 50 characters.';
  }
  if (!email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  return errors;
}

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
    const values = { name, email, password };
    const errors = validateValues(values);
    setFieldErrors(errors);
    setServerError('');
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await authService.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      // Per PRD US-001 registration redirects to login; no token is stored
      // and no AuthContext is touched here.
      setSuccessMessage('Registration successful! Redirecting to login…');
      navigate('/login');
    } catch (error) {
      // Surface the normalized server message (DUPLICATE_EMAIL,
      // VALIDATION_ERROR, …) — never swallow errors.
      setServerError(error?.message ?? 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <h1>Register</h1>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="register-name">
            Name
          </label>
          <input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            className={`${styles.input} ${fieldErrors.name ? styles.inputError : ''}`}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              clearFieldError('name');
            }}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? 'register-name-error' : undefined}
          />
          {fieldErrors.name && (
            <p id="register-name-error" className={styles.error} role="alert">
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="register-email">
            Email
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearFieldError('email');
            }}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
          />
          {fieldErrors.email && (
            <p id="register-email-error" className={styles.error} role="alert">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="register-password">
            Password
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearFieldError('password');
            }}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'register-password-error' : undefined}
          />
          {fieldErrors.password && (
            <p id="register-password-error" className={styles.error} role="alert">
              {fieldErrors.password}
            </p>
          )}
        </div>

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

        <button className={styles.submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Registering…' : 'Register'}
        </button>
      </form>
    </main>
  );
}

export default RegisterPage;
