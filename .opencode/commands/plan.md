---
description: Create task plan from PRD — Manager reads PRD and creates structured tasks
agent: manager
---
You are the Manager Agent executing the `/plan` command.

## Your Goal

Read the Product Requirements Document and create a structured task plan. Do NOT implement any code.

## Steps

1. **Read the PRD** at `.ai/PRD.md` thoroughly.
2. **Read the architecture** at `.ai/ARCHITECTURE.md`.
3. **Read existing tasks** in `.ai/tasks/active/`, `.ai/tasks/completed/`, and `.ai/tasks/blocked/`.
4. **Break down the PRD** into atomic, independently deliverable tasks.
5. **For each task**, create a task file in `.ai/tasks/active/` using this format:

```yaml
---
id: TASK-XXX
title: <clear, concise title>
team: <backend|frontend>
priority: <CRITICAL|HIGH|MEDIUM|LOW>
status: READY
assigned_agent: null
dependencies: [<list of TASK-IDs this depends on>]
branch: null
pr: null
review_cycles: 0
---
```

Followed by markdown sections:
- **Description** — What needs to be done and why
- **Requirements** — Specific technical requirements
- **Acceptance Criteria** — Measurable criteria for completion
- **Testing Requirements** — What tests must be written

6. **Identify dependencies** — Backend APIs typically come before frontend integration.
7. **Set priorities** — Critical path items are HIGH or CRITICAL.
8. **Summarize the plan** — List all created tasks with their IDs, titles, teams, priorities, and dependency chains.

## Rules

- Create tasks that are small enough for one developer to complete in a single session.
- Each task must be independently testable.
- Do NOT implement any code.
- Do NOT create tasks for work outside the PRD scope.
- Number tasks sequentially: TASK-001, TASK-002, etc.
- If tasks already exist, continue the numbering sequence.
