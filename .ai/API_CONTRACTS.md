# API Contracts

> **Status:** Draft
> **Version:** 1.0
> **Last Updated:** 2026-10-05

---

## 1. General Conventions

<!-- CUSTOMIZE: Adjust these conventions for your API -->

### 1.1 Base URL

```
http://localhost:5000/api
```

### 1.2 Request Format

- Content-Type: `application/json`
- Authentication: `Authorization: Bearer <JWT_TOKEN>`

### 1.3 Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE"
  }
}
```

### 1.4 Standard Error Codes

<!-- CUSTOMIZE: Add your application-specific error codes -->

| HTTP Status | Error Code | Meaning |
|-------------|-----------|---------|
| 400 | `VALIDATION_ERROR` | Request body/params failed validation |
| 400 | `DUPLICATE_EMAIL` | Email already registered |
| 401 | `INVALID_CREDENTIALS` | Login email/password incorrect |
| 401 | `TOKEN_EXPIRED` | JWT token has expired |
| 401 | `TOKEN_INVALID` | JWT token is malformed or invalid |
| 403 | `FORBIDDEN` | User lacks permission for this action |
| 404 | `NOT_FOUND` | Requested resource does not exist |
| 429 | `RATE_LIMITED` | Too many requests — retry after the period stated in the `Retry-After` header |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## 2. Authentication Endpoints

<!-- CUSTOMIZE: Update these to match your actual API design -->

### 2.1 Register User

```
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Validation Rules:**
| Field | Rules |
|-------|-------|
| `name` | Required, string, 2-50 characters |
| `email` | Required, valid email format, unique |
| `password` | Required, minimum 8 characters |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "abc123",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2026-10-05T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "message": "Email already registered",
    "code": "DUPLICATE_EMAIL"
  }
}
```

### 2.2 Login

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Validation Rules:**
| Field | Rules |
|-------|-------|
| `email` | Required, valid email format |
| `password` | Required |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "abc123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "code": "INVALID_CREDENTIALS"
  }
}
```

### 2.3 Get Current User

```
GET /api/auth/me
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-10-05T00:00:00.000Z"
  }
}
```

**Error Responses:**
- Missing, malformed, or expired token → 401 `TOKEN_INVALID` /
  `TOKEN_EXPIRED` (returned by the `requireAuth` middleware).
- Valid token whose user no longer exists (account deleted after the
  token was issued) → 401 `TOKEN_INVALID` with message
  `"Invalid token"`. The token is treated as unusable rather than
  surfacing a 500.

---

## 3. User Endpoints

### 3.1 Get Profile

```
GET /api/users/profile
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-10-05T00:00:00.000Z",
    "updatedAt": "2026-10-05T00:00:00.000Z"
  }
}
```

### 3.2 Update Profile

```
PUT /api/users/profile
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "name": "Jane Doe"
}
```

**Validation Rules:**
| Field | Rules |
|-------|-------|
| `name` | Optional, string, 2-50 characters |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "Jane Doe",
    "email": "john@example.com",
    "updatedAt": "2026-10-05T12:00:00.000Z"
  }
}
```

---

## 4. Adding New Endpoints

<!-- CUSTOMIZE: Use this template when adding new API endpoints -->

When adding new endpoints, follow this template:

```markdown
### X.X Endpoint Name

\`\`\`
METHOD /api/resource/action
\`\`\`

**Headers:** (if auth required)
**Request Body:** (JSON example)
**Validation Rules:** (table)
**Success Response:** (status + JSON)
**Error Responses:** (status + JSON for each error case)
```

Document every endpoint in this file BEFORE implementing it.
