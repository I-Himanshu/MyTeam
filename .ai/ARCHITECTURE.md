# Architecture Document

> **Status:** Draft
> **Version:** 1.0
> **Last Updated:** 2026-10-05

---

## 1. System Overview

<!-- CUSTOMIZE: Replace this section with your actual system architecture -->

This document describes the high-level architecture of the MyTeam Demo Application — a MERN-stack web application with a separate backend API and frontend client.

```
┌─────────────────┐     HTTP/JSON     ┌─────────────────┐     Mongoose     ┌──────────┐
│   React Client  │ ◄──────────────► │  Express API     │ ◄─────────────► │ MongoDB  │
│   (Frontend)    │                   │  (Backend)       │                  │          │
└─────────────────┘                   └─────────────────┘                  └──────────┘
     Port 3000                             Port 5000
```

---

## 2. Directory Structure

<!-- CUSTOMIZE: Update this to match your actual project structure -->

```
/
├── server/                  # Backend (Express + Node.js)
│   ├── src/
│   │   ├── config/          # Database, environment configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/       # Auth, validation, error handling
│   │   ├── models/           # Mongoose models
│   │   ├── routes/           # Route definitions
│   │   ├── utils/            # Utility functions
│   │   └── app.js            # Express app setup
│   ├── tests/               # Backend tests
│   ├── package.json
│   └── .env.example
│
├── client/                  # Frontend (React)
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page-level components
│   │   ├── context/         # React Context providers
│   │   ├── services/        # API client functions
│   │   ├── utils/           # Utility functions
│   │   └── App.jsx          # Root component
│   ├── public/
│   ├── tests/               # Frontend tests
│   └── package.json
│
├── .ai/                     # AI engineering documentation
├── .opencode/               # OpenCode agent configuration
├── .github/                 # GitHub templates and CI
├── AGENTS.md                # Global agent contract
└── README.md
```

---

## 3. Backend Architecture

### 3.1 Layer Pattern

<!-- CUSTOMIZE: Adapt layers to your actual framework and patterns -->

```
Routes → Controllers → Services (optional) → Models → Database
```

| Layer | Responsibility |
|-------|----------------|
| **Routes** | Define endpoints and attach middleware |
| **Controllers** | Handle request/response logic |
| **Middleware** | Authentication, validation, error handling |
| **Models** | Define data schemas and database interactions |
| **Config** | Environment variables, database connection |

### 3.2 Authentication Flow

```
Client → POST /api/auth/login → Validate Credentials → Generate JWT → Return Token
Client → GET /api/protected → Send JWT in Header → Verify Token → Return Data
```

### 3.3 Error Handling

<!-- CUSTOMIZE: Define your error handling strategy -->

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE"
  }
}
```

---

## 4. Frontend Architecture

### 4.1 Component Hierarchy

<!-- CUSTOMIZE: Define your component tree -->

```
App
├── AuthProvider (Context)
│   ├── PublicRoute
│   │   ├── LoginPage
│   │   └── RegisterPage
│   └── ProtectedRoute
│       ├── DashboardPage
│       └── ProfilePage
└── Navigation
```

### 4.2 State Management

<!-- CUSTOMIZE: Define your state management approach -->

- **Authentication State:** React Context API (`AuthContext`)
- **Component State:** React `useState` / `useReducer`
- **Server State:** Fetched on demand, no client-side cache in Phase 1

### 4.3 API Integration

<!-- CUSTOMIZE: Define your API client approach -->

- Centralized API service module (`services/api.js`)
- JWT token attached to requests via interceptor or utility function
- Consistent error handling and response parsing

---

## 5. Security Architecture

| Concern | Approach |
|---------|----------|
| Password Storage | bcrypt hashing with salt rounds ≥ 10 |
| Authentication | JWT with expiration |
| Authorization | Middleware-based token verification |
| Input Validation | Server-side validation on all endpoints |
| CORS | Configured to allow only the frontend origin |
| Secrets | Environment variables, never committed |

---

## 6. Technology Decisions

<!-- CUSTOMIZE: Document your technology choices and rationale -->

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend Runtime | Node.js | JavaScript full-stack consistency |
| Backend Framework | Express.js | Minimal, well-documented, flexible |
| Database | MongoDB | Document-based, flexible schema for rapid development |
| ODM | Mongoose | Schema validation, middleware support |
| Frontend Framework | React | Component-based, large ecosystem |
| Auth Tokens | JWT | Stateless authentication, easy to implement |

---

## 7. Future Considerations

<!-- Items that will affect architecture in later phases -->

- WebSocket support for real-time features
- Redis for session/cache management
- API gateway if microservices are introduced
- CDN for static assets in production
- Database replication and indexing strategy
