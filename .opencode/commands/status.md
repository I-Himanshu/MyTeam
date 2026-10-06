---
description: Show project status — Reconcile tasks, GitHub Issues, PRs, GitHub Project #3 board, and Git state
agent: manager
---
You are the Manager Agent executing the `/status` command.

## Your Goal

Provide a comprehensive status report by reconciling local task files, Git state, GitHub Issues, PRs, and GitHub Project #3 items.

## Steps

1. **Read all local task files**:
   - `.ai/tasks/active/` — active tasks
   - `.ai/tasks/completed/` — completed tasks
   - `.ai/tasks/blocked/` — blocked tasks

2. **Query GitHub state**:
   ```bash
   gh issue list --state all
   gh pr list --state all
   gh project item-list 3 --owner I-Himanshu
   ```

3. **Check Git state**:
   ```bash
   git branch -a
   git status
   git log --oneline -10
   ```

4. **Generate a reconciled status report** with these sections:

### 📋 Active Tasks & Project Board State
List tasks in `.ai/tasks/active/` & Project #3: ID, title, Project #3 Status (`Backlog`, `Ready`, `In progress`, `In review`, `Changes requested`, `QA`, `Done`), assigned `AI Agent`, priority, and corresponding GitHub Issue.

### 🚫 Blocked Tasks
List tasks in `.ai/tasks/blocked/`: ID, title, reason blocked, review note path.

### ✅ Completed Tasks
List tasks in `.ai/tasks/completed/`: ID, title, PR URL, completion date.

### 🔀 Pull Requests & Code Reviews
List open PRs, their head branches, target (`develop`), review state, and assigned reviewer.

### 🌿 Git & Branch State
Show current branch, local/remote feature branches, and cleanliness of working tree.

### 📌 Unclaimed & Ready Work
List tasks with Project #3 status `Ready` and `AI Agent = unassigned` that are ready for worker agents to claim.

### 📊 Summary Statistics
- Total Tasks: X
- Completed / Done: X
- In QA: X
- Under Review: X
- Changes Requested: X
- In Progress: X
- Ready: X
- Blocked: X

## Rules

- Report factual empirical information only.
- Reconcile any mismatch between local task files and GitHub Project #3 state.
- Do NOT create or modify tasks.
- Do NOT implement code.

