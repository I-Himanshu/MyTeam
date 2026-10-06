---
id: TASK-002
title: MongoDB connection and User model
team: backend
priority: CRITICAL
status: MERGED
assigned_agent: backend
dependencies: [TASK-001]
branch: feature/TASK-002
pr: https://github.com/I-Himanshu/MyTeam/pull/4
review_cycles: 0
---

## Description

Add MongoDB connectivity and the `User` model exactly as specified in
`.ai/DATABASE_SCHEMA.md` §2.1. This is the data foundation for registration, login,
`/api/auth/me`, and profile endpoints. Password hashing lives in the model so every
code path that creates or updates a password is guaranteed to hash it.

## Requirements

- `src/config/db.js` — `connectDB()` using `MONGO_URI`; logs success, and on failure logs
  context and exits non-zero (fail fast).
- Wire `connectDB()` into `src/server.js`: connect BEFORE listening; do not accept
  traffic without a database connection.
- `src/models/User.js` per DATABASE_SCHEMA §2.1:
  - `name`: String, required, trim, minlength 2, maxlength 50
  - `email`: String, required, unique index, lowercase, format validated
  - `password`: String, required, minlength 8, `select: false`
  - `timestamps: true` (auto `createdAt` / `updatedAt`)
- Pre-save hook: bcrypt hash (salt rounds ≥ 10) only when the password is new or modified;
  never re-hash an existing hash.
- Instance method `matchPassword(plainPassword)` using `bcrypt.compare`.
- `toJSON` transform that strips `password` and `__v` so serialization can never leak them.
- Add dependencies: `mongoose`, `bcrypt` (runtime) and `mongodb-memory-server` (dev).
- Tests must run without external services: use `mongodb-memory-server`, falling back to
  `MONGO_TEST_URI` when provided.

## Expected Areas / Files

| File | Action |
|------|--------|
| `server/src/config/db.js` | Added |
| `server/src/models/User.js` | Added |
| `server/src/server.js` | Modified (connect before listen) |
| `server/package.json` | Modified (deps) |
| `server/tests/unit/user.model.test.js` | Added |
| `server/tests/fixtures/users.js` | Added |
| `.ai/DATABASE_SCHEMA.md` | Modified ONLY if implementation reveals a schema gap |

## Acceptance Criteria

- [ ] Server exits with a clear error when `MONGO_URI` is unreachable (fail fast)
- [ ] Saving a user stores a bcrypt hash — stored value is never plaintext and matches
      the bcrypt prefix pattern
- [ ] A second registration with the same email is rejected by the unique index (E11000)
- [ ] `password` is excluded from query results unless explicitly selected
- [ ] `user.toJSON()` contains no `password` and no `__v`
- [ ] `matchPassword()` returns true for the correct password and false otherwise
- [ ] `createdAt` / `updatedAt` are maintained automatically
- [ ] Email is persisted lowercase
- [ ] Schema matches `.ai/DATABASE_SCHEMA.md` exactly — no undocumented schema drift

## Testing Requirements

- Unit/model tests (against `mongodb-memory-server`):
  - password is hashed on save and `matchPassword` verifies it
  - duplicate email insert is rejected (unique index)
  - `select: false` excludes the password by default
  - `toJSON()` output excludes `password` and `__v`
  - timestamps update on modification
  - validation rejects name < 2 / > 50 chars, missing fields, malformed email,
    password < 8 chars
- Use `server/tests/fixtures/users.js` for reusable user payloads.
