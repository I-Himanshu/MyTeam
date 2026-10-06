import { Link } from 'react-router-dom';

import styles from './Navigation.module.css';

// Minimal app shell (TASK-009). Active-link styling and auth-aware
// links arrive with the auth UI in TASK-010/TASK-011.
function Navigation() {
  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <span className={styles.brand}>MyTeam</span>
      <ul className={styles.links}>
        <li>
          <Link to="/login">Login</Link>
        </li>
        <li>
          <Link to="/register">Register</Link>
        </li>
        <li>
          <Link to="/dashboard">Dashboard</Link>
        </li>
        <li>
          <Link to="/profile">Profile</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navigation;
