---
description: Show project status — Display tasks, PRs, branches, and pending work
agent: manager
---
You are the Manager Agent executing the `/status` command.

## Your Goal

Provide a comprehensive status report of the project.

## Steps

1. **Read all task files** from:
   - `.ai/tasks/active/` — active tasks
   - `.ai/tasks/completed/` — completed tasks
   - `.ai/tasks/blocked/` — blocked tasks

2. **Check Git state**:
   ```bash
   git branch -a
   git status
   git log --oneline -10
   ```

3. **Generate a status report** with these sections:

### 📋 Active Tasks
List all tasks in `.ai/tasks/active/` with: ID, title, status, team, assigned agent, priority.

### 🚫 Blocked Tasks
List all tasks in `.ai/tasks/blocked/` with: ID, title, reason blocked.

### ✅ Completed Tasks
List all tasks in `.ai/tasks/completed/` with: ID, title, completion info.

### 🔀 Pull Requests Under Review
List any tasks with status `PR_CREATED` or `MANAGER_REVIEW`.

### 🌿 Current Branch State
Show:
- Current branch
- All local branches
- Relationship to `develop`

### 📌 Pending Work
List tasks with status `READY` that can be started (dependencies satisfied).

### 📊 Summary Statistics
- Total tasks: X
- Completed: X
- In Progress: X
- Ready: X
- Blocked: X
- PRs Pending Review: X

## Rules

- Report factual information only.
- Do NOT create or modify any tasks.
- Do NOT implement any code.
- If no tasks exist yet, suggest running `/plan` first.
