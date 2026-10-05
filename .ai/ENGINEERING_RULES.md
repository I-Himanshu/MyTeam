# Engineering Rules

> **Status:** Active
> **Version:** 1.0
> **Last Updated:** 2026-10-05

---

## 1. General Principles

<!-- CUSTOMIZE: Adjust these to match your team's values -->

1. **Simplicity over cleverness.** Write code that is easy to read and maintain.
2. **Explicit over implicit.** Make intentions clear in code and documentation.
3. **Fail fast and loudly.** Detect errors early and surface them clearly.
4. **Single responsibility.** Each function, class, and module does one thing.
5. **Don't repeat yourself.** Extract common logic into shared utilities.
6. **YAGNI.** Don't build features that aren't required yet.

---

## 2. Backend Rules

### 2.1 API Design

<!-- CUSTOMIZE: Adapt to your API style (REST, GraphQL, etc.) -->

- Use RESTful conventions for endpoint naming.
- Use plural nouns for resource collections: `/api/users`, `/api/posts`.
- Use HTTP methods correctly: GET (read), POST (create), PUT (update), DELETE (remove).
- Return appropriate HTTP status codes:
  - `200` — Success
  - `201` — Created
  - `400` — Bad Request (validation error)
  - `401` — Unauthorized
  - `403` — Forbidden
  - `404` — Not Found
  - `500` — Internal Server Error
- All responses must be JSON.
- Error responses must include a `message` field.

### 2.2 Database

<!-- CUSTOMIZE: Add your database-specific rules -->

- Always define schemas with validation.
- Index fields that are frequently queried.
- Never expose database IDs in URLs without consideration.
- Use database transactions for operations that modify multiple documents/rows.
- Never store passwords in plaintext.

### 2.3 Security

- Validate all input on the server side, regardless of client validation.
- Use parameterized queries or ORM methods — never concatenate user input.
- Sanitize output to prevent XSS.
- Implement rate limiting on authentication endpoints.
- Set appropriate CORS configuration.
- Never log sensitive data (passwords, tokens, personal information).

### 2.4 Error Handling

- Use centralized error handling middleware.
- Never expose stack traces in production responses.
- Log errors with sufficient context for debugging.
- Use custom error classes for different error types.

---

## 3. Frontend Rules

### 3.1 Components

<!-- CUSTOMIZE: Adapt to your component framework -->

- One component per file.
- Use functional components with hooks.
- Keep components focused — extract complex logic into custom hooks.
- Separate presentational components from container components.
- Co-locate component styles and tests.

### 3.2 State Management

- Use the simplest state management that works.
- Local state (`useState`) for component-specific data.
- Context API for cross-component state (auth, theme).
- Avoid prop drilling — use context or composition.

### 3.3 API Integration

- Centralize API calls in a service layer.
- Handle loading, success, and error states for every API call.
- Never store JWT tokens in `localStorage` without understanding the trade-offs.
- Handle token expiration gracefully.

### 3.4 Forms

- Validate on the client for user experience.
- Always validate on the server for security.
- Show clear error messages next to the relevant fields.
- Disable submit buttons during form submission.

---

## 4. Testing Rules

<!-- CUSTOMIZE: Adapt to your testing frameworks -->

### 4.1 What to Test

| Component Type | Test Type | Required |
|---------------|-----------|----------|
| API Endpoints | Integration test | ✅ |
| Business Logic | Unit test | ✅ |
| Database Models | Unit test | ✅ |
| React Components | Component test | ✅ |
| Form Validation | Unit test | ✅ |
| Error Handling | Unit test | ✅ |
| Authentication Flows | Integration test | ✅ |

### 4.2 Testing Standards

- Tests must verify behavior, not implementation details.
- Each test should test ONE thing.
- Use descriptive test names that explain the expected behavior.
- Test both success and failure paths.
- Mock external dependencies (databases, APIs) in unit tests.
- Use test fixtures or factories for test data.

### 4.3 Test Organization

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── fixtures/       # Shared test data
```

---

## 5. Git Rules

- See `AGENTS.md` for comprehensive Git workflow rules.
- Use Conventional Commits.
- Keep commits atomic — one logical change per commit.
- Write meaningful commit messages.
- Review `git diff` before every commit.

---

## 6. Dependency Rules

- Only add dependencies that are actively needed.
- Prefer well-maintained packages with active communities.
- Check the package's last publish date, open issues, and license.
- Document why a new dependency was added in the commit message.
- Regularly audit dependencies for security vulnerabilities.
- Pin major versions to avoid unexpected breaking changes.

---

## 7. Environment Rules

- Use `.env` files for environment-specific configuration.
- Provide a `.env.example` file with all required variables (no real values).
- Never commit `.env` files.
- Access environment variables through a centralized config module.
