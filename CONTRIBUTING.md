# Contributing Guide

> This guide explains how to contribute to this project using the AI Software Engineering Organization workflow.

---

## Development Workflow Overview

All development in this repository follows a structured workflow:

```
PRD → Tasks → Branch → Implement → Test → PR → Review → Merge
```

No code is committed directly to `main` or `develop`. All changes go through Pull Requests.

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd MyTeam
```

### 2. Switch to the Development Branch

```bash
git checkout develop
git pull origin develop
```

### 3. Start OpenCode

```bash
opencode
```

---

## Working on a Task

### 1. Find an Available Task

Check for tasks with status `READY` in `.ai/tasks/active/`, or run:

```
/status
```

### 2. Create a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/TASK-XXX
```

Use `bugfix/TASK-XXX` for bug fixes.

### 3. Implement the Task

- Read the task file completely before starting.
- Implement ONLY what the task requires.
- Follow the coding standards in `.ai/CODING_STANDARDS.md`.
- Follow the engineering rules in `.ai/ENGINEERING_RULES.md`.

### 4. Write Tests

- All new functionality must have tests.
- Bug fixes must include regression tests.
- Tests must verify behavior, not just exist.

### 5. Run Quality Checks

```bash
npm test          # Run tests
npm run lint      # Run linter (if available)
npm run build     # Run build (if available)
```

### 6. Review Your Changes

```bash
git diff
git diff --staged
```

Verify:
- Only intended files are changed.
- No secrets or credentials.
- No debug statements.
- No unrelated changes.

### 7. Commit

Use Conventional Commits format:

```bash
git add <specific files>
git commit -m "feat(auth): implement user registration endpoint

Add POST /api/auth/register with validation and password hashing.

Task: TASK-001"
```

### 8. Push

```bash
git push origin feature/TASK-XXX
```

### 9. Create a Pull Request

- Target branch: `develop`
- Use the PR template
- Fill in ALL required fields

### 10. Wait for Review

The Manager Agent will review your PR. You may need to make changes based on review feedback (up to 3 cycles).

---

## Commit Message Format

```
type(scope): description

[optional body explaining what and why]

Task: TASK-XXX
```

### Allowed Types

| Type | Purpose |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code formatting (no logic change) |
| `refactor` | Code restructuring (no behavior change) |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |
| `build` | Build system changes |
| `ci` | CI configuration changes |

---

## Branch Naming

| Pattern | Use Case |
|---------|----------|
| `feature/TASK-XXX` | New feature work |
| `bugfix/TASK-XXX` | Bug fixes |

---

## What NOT to Do

- ❌ Commit directly to `main` or `develop`
- ❌ Merge your own Pull Request
- ❌ Commit secrets or credentials
- ❌ Skip or disable tests
- ❌ Modify unrelated files
- ❌ Force push to shared branches
- ❌ Add unnecessary dependencies

---

## Project Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| Agent Rules | `AGENTS.md` | Global rules for all agents |
| PRD | `.ai/PRD.md` | Product requirements |
| Architecture | `.ai/ARCHITECTURE.md` | System design |
| Engineering Rules | `.ai/ENGINEERING_RULES.md` | Engineering standards |
| Coding Standards | `.ai/CODING_STANDARDS.md` | Code style guide |
| API Contracts | `.ai/API_CONTRACTS.md` | API specifications |
| Database Schema | `.ai/DATABASE_SCHEMA.md` | Data model |
| Task System | `.ai/tasks/README.md` | Task lifecycle docs |
