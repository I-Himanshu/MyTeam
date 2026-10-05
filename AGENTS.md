# AGENTS.md — Global Project Contract

> **This file is the authoritative source of truth for all AI agents operating in this repository.**
> Every agent MUST read this file before performing any work.

---

## 1. Project Overview

This repository uses an AI Software Engineering Organization where a **Manager Agent** coordinates specialist **Developer Agents** to build software through structured tasks, Git workflows, and GitHub Pull Requests.

**Phase 1 Agents:**

| Agent | Role | File |
|-------|------|------|
| Manager | Task planning, review, coordination | `.opencode/agents/manager.md` |
| Backend Developer | Backend implementation | `.opencode/agents/backend.md` |
| Frontend Developer | Frontend implementation | `.opencode/agents/frontend.md` |

---

## 2. How Agents Must Work

### 2.1 Read Before Acting

Before starting any work, agents MUST read:

1. **This file** (`AGENTS.md`) — project rules and contracts
2. **`.ai/PRD.md`** — product requirements
3. **`.ai/ARCHITECTURE.md`** — system architecture
4. **`.ai/ENGINEERING_RULES.md`** — engineering standards
5. **`.ai/CODING_STANDARDS.md`** — code style and conventions
6. **The assigned task file** — specific requirements and acceptance criteria

### 2.2 Repository Is the Source of Truth

- Agents must NOT depend on conversation history for project decisions.
- All important information MUST exist in versioned files: PRD, architecture docs, task files, Git commits, GitHub issues, PRs, review documents, and ADRs.
- If a conflict exists between conversation context and repository documents, the repository documents take precedence.

### 2.3 Single Responsibility

- Each agent works on exactly **one task** at a time.
- Each task results in exactly **one branch** and **one PR**.
- Agents must not modify files unrelated to their assigned task.

---

## 3. Git Rules

### 3.1 Branch Model

```
main
└── develop
    ├── feature/TASK-XXX
    └── bugfix/TASK-XXX
```

- `main` — production-ready code. **Never commit or merge directly.**
- `develop` — integration branch. All feature branches merge here via PR.
- `feature/TASK-XXX` — new feature work.
- `bugfix/TASK-XXX` — bug fix work.

### 3.2 Branch Rules

| Rule | Detail |
|------|--------|
| Never commit directly to `main` | All changes go through PRs |
| Never commit directly to `develop` | All changes go through PRs from feature/bugfix branches |
| Never merge directly to `main` | Only `develop` → `main` via release process |
| Developers branch from `develop` | `git checkout -b feature/TASK-XXX develop` |
| One branch per task | Never mix multiple tasks in one branch |

### 3.3 Commit Rules

- Use **Conventional Commits** format:
  ```
  type(scope): description

  [optional body]

  Task: TASK-XXX
  ```
- Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`
- Always include the Task ID in the commit body.
- Always run `git diff --staged` before committing.
- Review the diff to ensure only intended changes are included.
- Never commit:
  - `.env` or any environment files
  - Credentials, private keys, or API keys
  - `node_modules/` or other dependency directories
  - Build artifacts
  - Log files
  - Temporary files

### 3.4 Push Rules

- Push only your feature/bugfix branch.
- Never force push to `develop` or `main`.
- Verify the remote branch name matches your local branch.

---

## 4. Task Lifecycle

```
BACKLOG → READY → IN_PROGRESS → SELF_TEST → PR_CREATED → MANAGER_REVIEW
                                                              ↓
                                              CHANGES_REQUESTED → (loop max 3×)
                                                              ↓
                                                          APPROVED → MERGED
                                                              or
                                                          BLOCKED
```

### Status Definitions

| Status | Meaning |
|--------|---------|
| `BACKLOG` | Task identified but not yet ready for work |
| `READY` | Task is fully specified and ready to be assigned |
| `IN_PROGRESS` | Developer agent is actively working on the task |
| `SELF_TEST` | Developer has completed implementation and is running tests |
| `PR_CREATED` | Pull Request has been created, awaiting review |
| `MANAGER_REVIEW` | Manager is reviewing the PR |
| `CHANGES_REQUESTED` | Manager has requested specific changes |
| `APPROVED` | Manager has approved the PR |
| `MERGED` | PR has been merged into `develop` |
| `BLOCKED` | Task cannot proceed (dependency issues, repeated failures, etc.) |

### Review Cycle Limit

- Maximum **3 review cycles** per task.
- If a task fails review 3 times, it is marked `BLOCKED`.
- A review note explaining the blocking reason is created.
- The Manager does NOT keep retrying endlessly.

---

## 5. Testing Requirements

### What Must Be Tested

- All new functions and methods must have corresponding tests.
- All API endpoints must have integration tests.
- All bug fixes must include a regression test.
- Tests must actually verify behavior, not just exist.

### Test Execution

Before creating a PR, the developer agent MUST:

1. Run the full test suite: `npm test` (or equivalent)
2. Run the linter if available: `npm run lint` (or equivalent)
3. Run the build if available: `npm run build` (or equivalent)
4. Verify all tests pass.
5. If any test fails, fix the issue before creating the PR.

### What Is Forbidden

- Never disable tests to make CI pass.
- Never mark tests as skipped without documented justification.
- Never write tests that always pass regardless of implementation.
- Never mock the thing being tested.

---

## 6. Pull Request Requirements

Every PR MUST include:

| Field | Required |
|-------|----------|
| Task ID | ✅ |
| Description of changes | ✅ |
| Acceptance criteria checklist | ✅ |
| Testing performed | ✅ |
| Security considerations | ✅ |
| Files changed summary | ✅ |
| Potential breaking changes | ✅ |

### PR Rules

- PRs target `develop`, never `main`.
- One PR per task.
- The PR description must use the template at `.github/pull_request_template.md`.
- Developer agents CANNOT merge their own PR.
- Only the Manager agent can approve and merge PRs.

---

## 7. Security Rules

| Rule | Detail |
|------|--------|
| Never commit secrets | No API keys, passwords, tokens, or credentials |
| Never hardcode credentials | Use environment variables |
| Never disable security features | Authentication, authorization, CORS, etc. |
| Never expose internal errors | Use proper error handling in APIs |
| Validate all input | Server-side validation is mandatory |
| Use parameterized queries | Never concatenate user input into queries |
| Check dependencies | Review new dependencies for security issues |

---

## 8. Forbidden Actions

Agents MUST NOT:

- ❌ Commit directly to `main` or `develop`
- ❌ Merge their own Pull Requests
- ❌ Modify files unrelated to their assigned task
- ❌ Commit secrets, credentials, or environment files
- ❌ Disable or skip tests to make CI pass
- ❌ Introduce unnecessary dependencies
- ❌ Rewrite architecture without Manager approval
- ❌ Delete or overwrite other agents' work without justification
- ❌ Ignore the assigned task's acceptance criteria
- ❌ Claim work is complete without actually running tests
- ❌ Make assumptions about requirements — ask for clarification
- ❌ Force push to any shared branch
- ❌ Modify CI/CD configuration without Manager approval

---

## 9. Documentation Maintenance

- When architectural decisions change, update `.ai/ARCHITECTURE.md`.
- When new engineering patterns are adopted, update `.ai/ENGINEERING_RULES.md`.
- When API contracts change, update `.ai/API_CONTRACTS.md`.
- When database schema changes, update `.ai/DATABASE_SCHEMA.md`.
- Record significant decisions in `.ai/decisions/` as ADRs.
- The Manager agent is responsible for keeping documentation current.

---

## 10. Future Phases

This is **Phase 1**. The following will be added in future phases:

- QA Agent
- DevOps Agent
- Database Agent
- Security Agent
- Documentation Agent
- Additional specialist agents
- Autonomous orchestration
- Advanced review workflows

The current structure is designed to accommodate these additions without restructuring.
