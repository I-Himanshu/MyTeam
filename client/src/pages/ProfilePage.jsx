import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext.jsx';
import { getProfile, updateProfile } from '../services/user.service.js';
import styles from './ProfilePage.module.css';

// Client-side validation mirrors API_CONTRACTS §3.2 (name 2–50 chars) so
// users get instant feedback; the server still validates authoritatively.
function validateName(name) {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Name is required.';
  }
  if (trimmed.length < 2) {
    return 'Name must be at least 2 characters.';
  }
  if (trimmed.length > 50) {
    return 'Name must be no more than 50 characters.';
  }
  return null;
}

function ProfilePage() {
  // `loadUser` re-hydrates AuthContext from `GET /auth/me` so the dashboard
  // welcome message picks up a renamed user (ARCHITECTURE §4.2).
  const { loadUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // The profile always belongs to the token's user — no user id is ever
  // requested, so no other user's data can be loaded from this page.
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const envelope = await getProfile();
      const profile = envelope?.data ?? {};
      setName(profile.name ?? '');
      setEmail(profile.email ?? '');
    } catch (error) {
      setLoadError(error?.message ?? 'Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load the token owner's profile on mount.
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateName(name);
    setFieldError(validationError);
    setSuccessMessage('');
    if (validationError) return;

    setIsSaving(true);
    setSaveError('');
    try {
      // Only the name is editable in Phase 1 (PRD US-004) — the email is
      // never sent back, so it cannot be changed from this page.
      const envelope = await updateProfile({ name: name.trim() });
      const updated = envelope?.data ?? {};
      setName(updated.name ?? name.trim());
      setEmail((prev) => updated.email ?? prev);
      setSuccessMessage('Profile updated successfully.');
      // Keep AuthContext in sync; a refresh failure must not wipe the
      // confirmation, so sync errors are intentionally ignored.
      try {
        await loadUser();
      } catch {
        // Intentionally ignored — the save itself already succeeded.
      }
    } catch (error) {
      // Surface normalized server messages (VALIDATION_ERROR, …).
      setSaveError(error?.message ?? 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className={styles.page}>
        <h1>Profile</h1>
        <p role="status">Loading profile…</p>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className={styles.page}>
        <h1>Profile</h1>
        <p className={styles.serverError} role="alert">
          {loadError}
        </p>
        <button className={styles.submit} type="button" onClick={fetchProfile}>
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <h1>Profile</h1>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="profile-name">
            Name
          </label>
          <input
            id="profile-name"
            name="name"
            type="text"
            autoComplete="name"
            className={`${styles.input} ${fieldError ? styles.inputError : ''}`}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setFieldError(null);
            }}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? 'profile-name-error' : undefined}
          />
          {fieldError && (
            <p id="profile-name-error" className={styles.error} role="alert">
              {fieldError}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="profile-email">
            Email
          </label>
          {/* Read-only in Phase 1 (PRD US-004): disabled + readOnly with no
              change handler, so the value cannot be edited or submitted. */}
          <input
            id="profile-email"
            name="email"
            type="email"
            autoComplete="email"
            className={`${styles.input} ${styles.inputReadOnly}`}
            value={email}
            disabled
            readOnly
          />
        </div>

        {saveError && (
          <p className={styles.serverError} role="alert">
            {saveError}
          </p>
        )}
        {successMessage && (
          <p className={styles.success} role="status">
            {successMessage}
          </p>
        )}

        <button className={styles.submit} type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </main>
  );
}

export default ProfilePage;
