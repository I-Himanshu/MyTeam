# Product Requirements Document (PRD)

> **Status:** Draft
> **Version:** 1.0
> **Last Updated:** 2026-10-05

---

## 1. Overview

### 1.1 Product Name

**MyTeam Demo Application**

### 1.2 Purpose

A small MERN-stack (MongoDB, Express, React, Node.js) web application designed to test the AI Software Engineering Organization workflow. This application is intentionally minimal to keep the focus on validating the agent-driven development process.

### 1.3 Goals

- Demonstrate a functioning AI development workflow with Manager and Developer agents.
- Validate the task planning → implementation → review → merge cycle.
- Produce a real, working application as proof of the workflow.

---

## 2. User Stories

### US-001: User Registration
**As a** new user,
**I want to** create an account with my name, email, and password,
**So that** I can access the application.

**Acceptance Criteria:**
- User can submit a registration form with name, email, and password.
- Email must be unique — duplicate registration returns a clear error.
- Password must be at least 8 characters.
- Successful registration returns a confirmation and redirects to login.
- Passwords are stored as hashed values, never as plaintext.

### US-002: User Login
**As a** registered user,
**I want to** log in with my email and password,
**So that** I can access protected features.

**Acceptance Criteria:**
- User can submit a login form with email and password.
- Valid credentials return a JWT token.
- Invalid credentials return a clear error message (without leaking which field is wrong).
- Token is stored securely on the client side.
- Login redirects to the dashboard.

### US-003: Protected Dashboard
**As a** logged-in user,
**I want to** see a dashboard that is only accessible when authenticated,
**So that** I know my session is active.

**Acceptance Criteria:**
- Dashboard is only accessible with a valid JWT token.
- Unauthenticated requests redirect to the login page.
- Dashboard displays a welcome message with the user's name.
- Dashboard has a logout button.

### US-004: User Profile
**As a** logged-in user,
**I want to** view and edit my basic profile information,
**So that** I can keep my account details current.

**Acceptance Criteria:**
- Profile page displays the user's name and email.
- User can update their name.
- Email is displayed but not editable (for simplicity in Phase 1).
- Changes are saved and confirmed to the user.

---

## 3. Technical Requirements

### 3.1 Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt
- **Validation:** express-validator or similar
- **Environment:** Configuration via `.env` file

### 3.2 Frontend
- **Framework:** React (Create React App or Vite)
- **State Management:** React Context API or lightweight solution
- **HTTP Client:** Axios or Fetch API
- **Routing:** React Router
- **Styling:** CSS Modules, styled-components, or plain CSS

### 3.3 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login and receive JWT | No |
| GET | `/api/auth/me` | Get current user info | Yes |
| GET | `/api/users/profile` | Get user profile | Yes |
| PUT | `/api/users/profile` | Update user profile | Yes |

### 3.4 Data Model

**User:**
```
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 4. Non-Functional Requirements

- Passwords must never be returned in API responses.
- All API errors must return consistent JSON error responses.
- The application must run locally with `npm run dev` or equivalent.
- Environment variables must be documented in a `.env.example` file.

---

## 5. Out of Scope (Phase 1)

The following are explicitly NOT included in this phase:

- Email verification
- Password reset
- OAuth/social login
- Role-based access control
- File uploads
- Real-time features (WebSockets)
- Deployment infrastructure
- Production database hosting
- Advanced UI design
