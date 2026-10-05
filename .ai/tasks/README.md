# Task System

## Overview

This directory contains all tasks for the AI Software Engineering Organization. Tasks are the atomic unit of work assigned to developer agents.

## Directory Structure

```
tasks/
├── README.md        ← You are here
├── active/          ← Tasks currently being worked on or ready for work
├── completed/       ← Successfully merged tasks
└── blocked/         ← Tasks that cannot proceed
```

## Task File Format

Every task file uses YAML frontmatter followed by Markdown content.

### Filename Convention

```
TASK-XXX.md
```

Where `XXX` is a zero-padded sequential number (e.g., `TASK-001`, `TASK-012`).

### Template

```yaml
---
id: TASK-XXX
title: <Clear, concise title>
team: <backend|frontend>
priority: <CRITICAL|HIGH|MEDIUM|LOW>
status: <see lifecycle below>
assigned_agent: <null|backend|frontend>
dependencies: [<TASK-IDs this depends on>]
branch: <null|feature/TASK-XXX|bugfix/TASK-XXX>
pr: <null|PR number or URL>
review_cycles: 0
---

## Description

What needs to be done and why.

## Requirements

- Specific technical requirement 1
- Specific technical requirement 2

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Testing Requirements

- Unit tests for ...
- Integration tests for ...
```

## Task Lifecycle

```
BACKLOG → READY → IN_PROGRESS → SELF_TEST → PR_CREATED → MANAGER_REVIEW
                                                              ↓
                                              CHANGES_REQUESTED (max 3×)
                                                              ↓
                                                    APPROVED → MERGED
                                                       or
                                                    BLOCKED
```

### Status Definitions

| Status | Who Sets It | Meaning |
|--------|-------------|---------|
| `BACKLOG` | Manager | Task identified but not yet fully specified |
| `READY` | Manager | Task is fully specified, ready to be assigned |
| `IN_PROGRESS` | Developer | Developer agent is actively implementing |
| `SELF_TEST` | Developer | Implementation complete, running tests |
| `PR_CREATED` | Developer | Pull Request created, awaiting review |
| `MANAGER_REVIEW` | Manager | Manager is actively reviewing the PR |
| `CHANGES_REQUESTED` | Manager | Review found issues, changes needed |
| `APPROVED` | Manager | PR approved, ready to merge |
| `MERGED` | Manager | PR merged into `develop` |
| `BLOCKED` | Manager | Task cannot proceed |

### Status Transitions

| From | To | By | Condition |
|------|----|----|-----------|
| `BACKLOG` | `READY` | Manager | Task fully specified |
| `READY` | `IN_PROGRESS` | Developer | Dependencies satisfied, work started |
| `IN_PROGRESS` | `SELF_TEST` | Developer | Implementation complete |
| `SELF_TEST` | `PR_CREATED` | Developer | Tests pass, PR created |
| `PR_CREATED` | `MANAGER_REVIEW` | Manager | Review started |
| `MANAGER_REVIEW` | `APPROVED` | Manager | All checks pass |
| `MANAGER_REVIEW` | `CHANGES_REQUESTED` | Manager | Issues found |
| `CHANGES_REQUESTED` | `PR_CREATED` | Developer | Changes made, re-submitted |
| `APPROVED` | `MERGED` | Manager | PR merged into develop |
| Any | `BLOCKED` | Manager | Cannot proceed (3 failed reviews, dependency issues) |

### Review Cycle Limit

- Maximum **3 review cycles** per task.
- After 3 failed reviews, the task is moved to `BLOCKED`.
- A review note is created in `.ai/reviews/` explaining why.

## Priority Levels

| Priority | Meaning |
|----------|---------|
| `CRITICAL` | Blocks other work, must be done immediately |
| `HIGH` | Important for current milestone |
| `MEDIUM` | Should be done soon |
| `LOW` | Nice to have, can wait |

## Teams

| Team | Agent | Scope |
|------|-------|-------|
| `backend` | Backend Developer | APIs, database, server logic, auth |
| `frontend` | Frontend Developer | UI, components, state, API integration |

## Managing Tasks

- **Creating tasks:** Run `/plan` — the Manager reads the PRD and creates tasks.
- **Executing a task:** Run `/task TASK-XXX` — loads and runs the developer workflow.
- **Reviewing work:** Run `/review` — the Manager reviews pending PRs.
- **Checking status:** Run `/status` — shows all tasks and their current state.
