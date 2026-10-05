# Coding Standards

> **Status:** Active
> **Version:** 1.0
> **Last Updated:** 2026-10-05

---

## 1. General Standards

<!-- CUSTOMIZE: Adjust these to match your language and framework choices -->

### 1.1 Formatting

- Use consistent indentation: **2 spaces** for JavaScript/TypeScript, **4 spaces** for Python.
- Maximum line length: **100 characters** (soft limit), **120 characters** (hard limit).
- Use trailing commas in multi-line structures (JavaScript/TypeScript).
- Use semicolons consistently (pick one style and enforce it).
- Use a formatter (Prettier, Black, etc.) to eliminate formatting debates.

### 1.2 Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Variables | camelCase | `userName`, `isLoggedIn` |
| Functions | camelCase | `getUserById`, `validateEmail` |
| Classes | PascalCase | `UserController`, `AuthService` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| Files (JS) | camelCase or kebab-case | `userController.js`, `auth-middleware.js` |
| Files (React) | PascalCase | `LoginPage.jsx`, `UserProfile.jsx` |
| Database fields | camelCase or snake_case | `createdAt` or `created_at` (be consistent) |
| CSS classes | kebab-case | `nav-header`, `btn-primary` |
| Environment vars | UPPER_SNAKE_CASE | `DB_HOST`, `JWT_SECRET` |

### 1.3 Comments

- Write comments that explain **why**, not **what**.
- Do not leave commented-out code in production.
- Use JSDoc or similar for public API documentation.
- Mark temporary solutions with `// TODO:` and include context.
- Mark known issues with `// FIXME:` and include context.

```javascript
// BAD: Explains what (obvious from the code)
// Increment counter by 1
counter++;

// GOOD: Explains why (provides context)
// Rate limit resets every 60 seconds, so we track per-minute counts
counter++;
```

---

## 2. JavaScript / Node.js Standards

<!-- CUSTOMIZE: Adjust for your specific JS/TS version and preferences -->

### 2.1 Modern Syntax

- Use `const` by default, `let` when reassignment is needed, never `var`.
- Use arrow functions for callbacks and short functions.
- Use template literals for string interpolation.
- Use destructuring for objects and arrays.
- Use `async/await` instead of `.then()` chains.
- Use optional chaining (`?.`) and nullish coalescing (`??`).

### 2.2 Functions

- Keep functions small (under 30 lines is a good guideline).
- Functions should do one thing.
- Use descriptive function names that start with a verb.
- Limit function parameters to 3; use an options object for more.
- Always handle errors in async functions.

```javascript
// GOOD
async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError(`User ${id} not found`);
  }
  return user;
}

// BAD
async function get(id, fields, sort, limit, includeDeleted) {
  // Too many parameters, unclear purpose
}
```

### 2.3 Error Handling

```javascript
// GOOD: Specific error handling
try {
  const user = await createUser(data);
  return res.status(201).json({ success: true, data: user });
} catch (error) {
  if (error.code === 11000) {
    return res.status(400).json({ success: false, message: 'Email already exists' });
  }
  next(error);
}

// BAD: Swallowing errors
try {
  await doSomething();
} catch (e) {
  // silently ignored
}
```

---

## 3. React Standards

<!-- CUSTOMIZE: Adjust for your React version and preferences -->

### 3.1 Component Structure

```jsx
// Recommended component file structure:

// 1. Imports
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './ComponentName.module.css';

// 2. Component definition
function ComponentName({ prop1, prop2 }) {
  // 3. Hooks
  const [state, setState] = useState(initialValue);
  const { user } = useAuth();

  // 4. Effects
  useEffect(() => {
    // side effects
  }, [dependencies]);

  // 5. Event handlers
  const handleClick = () => {
    // handler logic
  };

  // 6. Render
  return (
    <div className={styles.container}>
      {/* JSX */}
    </div>
  );
}

// 7. Export
export default ComponentName;
```

### 3.2 Props

- Destructure props in the function signature.
- Use default values where appropriate.
- Document complex prop shapes with comments or PropTypes/TypeScript.

### 3.3 Conditional Rendering

```jsx
// GOOD: Short-circuit for simple conditions
{isLoggedIn && <Dashboard />}

// GOOD: Ternary for either/or
{isLoggedIn ? <Dashboard /> : <LoginPrompt />}

// GOOD: Early return for complex conditions
if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
return <Content data={data} />;
```

---

## 4. CSS Standards

<!-- CUSTOMIZE: Adjust for your CSS approach (modules, styled-components, Tailwind, etc.) -->

- Use CSS Modules or scoped styles to avoid class name collisions.
- Use CSS custom properties (variables) for theme values.
- Follow a mobile-first responsive design approach.
- Use `rem` or `em` for font sizes, not `px`.
- Avoid `!important` unless absolutely necessary.

---

## 5. File Organization Standards

### 5.1 Import Order

```javascript
// 1. Node/built-in modules
import path from 'path';

// 2. Third-party modules
import express from 'express';
import mongoose from 'mongoose';

// 3. Project modules (absolute paths)
import { validateUser } from '../middleware/validation';
import User from '../models/User';

// 4. Relative imports (same feature)
import { formatDate } from './utils';
```

### 5.2 Export Style

- Use named exports for utilities and helpers.
- Use default exports for components and main module entry points.
- Do not mix default and named exports from the same file unnecessarily.

---

## 6. Linting and Formatting

<!-- CUSTOMIZE: Specify your actual linting tools -->

- **ESLint** — code quality and potential bugs.
- **Prettier** — code formatting.
- Configuration files should be committed to the repository.
- All code must pass linting before creating a PR.
- Do not disable lint rules without a documented reason.
