# Database Schema

> **Status:** Draft
> **Version:** 1.0
> **Last Updated:** 2026-10-05

---

## 1. Database Configuration

<!-- CUSTOMIZE: Update these settings for your environment -->

| Setting | Value |
|---------|-------|
| Database | MongoDB |
| ODM | Mongoose |
| Connection String | `MONGO_URI` environment variable |
| Database Name | Defined in connection string |

---

## 2. Collections

### 2.1 Users

<!-- CUSTOMIZE: Modify fields to match your data model -->

**Collection Name:** `users`

**Schema:**

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| `_id` | ObjectId | Auto | Yes | Auto | MongoDB document ID |
| `name` | String | Yes | No | — | User's display name (2-50 chars) |
| `email` | String | Yes | Yes | — | User's email address (lowercase) |
| `password` | String | Yes | No | — | Bcrypt-hashed password |
| `createdAt` | Date | Auto | No | `Date.now` | Document creation timestamp |
| `updatedAt` | Date | Auto | No | `Date.now` | Last modification timestamp |

**Indexes:**

| Index | Fields | Type | Purpose |
|-------|--------|------|---------|
| Primary | `_id` | Unique | Default MongoDB index |
| Email | `email` | Unique | Fast lookup by email, enforce uniqueness |

**Mongoose Schema Example:**

```javascript
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false  // Never include password in query results by default
  }
}, {
  timestamps: true  // Automatically manage createdAt and updatedAt
});
```

**Important Rules:**
- Password field uses `select: false` — it is never returned in queries unless explicitly requested.
- Email is stored in lowercase.
- The `timestamps` option automatically manages `createdAt` and `updatedAt`.

---

## 3. Adding New Collections

<!-- CUSTOMIZE: Use this template when adding new collections -->

When adding a new collection, document it here using this template:

```markdown
### X.X Collection Name

**Collection Name:** `collection_name`

**Schema:**

| Field | Type | Required | Unique | Default | Description |
|-------|------|----------|--------|---------|-------------|
| ... | ... | ... | ... | ... | ... |

**Indexes:**

| Index | Fields | Type | Purpose |
|-------|--------|------|---------|
| ... | ... | ... | ... |

**Relationships:**

| Relation | Target | Type | Description |
|----------|--------|------|-------------|
| ... | ... | ... | ... |
```

---

## 4. Migration Strategy

<!-- CUSTOMIZE: Define your migration approach -->

**Phase 1 Approach:** Since MongoDB has a flexible schema, changes are managed through:

1. Mongoose schema updates (backward compatible).
2. Data migration scripts when needed (stored in `server/scripts/migrations/`).
3. Document changes in this file before implementing.

**Rules:**
- Never modify existing field types without a migration plan.
- Always add new fields as optional (with defaults) to maintain backward compatibility.
- Test migrations on sample data before running on the main database.
