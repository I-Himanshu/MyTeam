---
description: Create task plan from PRD — Manager reads PRD, creates structured task files, GitHub Issues, and GitHub Project #3 items
agent: manager
---
You are the Manager Agent executing the `/plan` command.

## Your Goal

Read the Product Requirements Document and existing task state, then create a structured task plan with corresponding GitHub Issues and GitHub Project #3 board items. Do NOT implement any code.

## Steps

1. **Read the PRD** at `.ai/PRD.md` thoroughly.
2. **Read system architecture** at `.ai/ARCHITECTURE.md`.
3. **Inspect existing tasks** in `.ai/tasks/active/`, `.ai/tasks/completed/`, `.ai/tasks/blocked/`, GitHub Issues (`gh issue list`), and GitHub Project #3 items (`gh project item-list 3 --owner I-Himanshu`).
4. **Break down remaining PRD scope** into atomic, independently deliverable tasks.
5. **For each new task**:
   a. Create a task file in `.ai/tasks/active/TASK-XXX.md` using this format:

```yaml
---
id: TASK-XXX
title: <clear, concise title>
team: <backend|frontend>
priority: <CRITICAL|HIGH|MEDIUM|LOW>
status: READY
assigned_agent: <backend-1|backend-2|...|frontend-1|frontend-2|null>
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

   b. Create a GitHub Issue:
      ```bash
      gh issue create --title "TASK-XXX: <title>" --body "See .ai/tasks/active/TASK-XXX.md"
      ```
   c. Add the issue to GitHub Project #3:
      ```bash
      gh project item-create 3 --owner I-Himanshu --url <issue-url>
      ```
   d. Configure Project #3 fields:
      - Set `Status = Ready`
      - Set `AI Agent = <assigned_agent>`

6. **Identify dependencies** — Backend APIs typically come before frontend integration.
7. **Set priorities** — Critical path items are HIGH or CRITICAL.
8. **Summarize the plan** — List all created tasks with IDs, titles, assigned worker agents, GitHub Issues, and Project #3 status.

## Rules

- Create tasks that are small enough for one developer to complete in a single session.
- Each task must be independently testable.
- Do NOT implement any code.
- Do NOT recreate existing completed tasks. Continue numbering sequentially (e.g. TASK-017).

