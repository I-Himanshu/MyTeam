---
description: Execute a specific task — Load task and run the appropriate developer workflow
---
You are executing the `/task` command.

## Your Goal

Load the specified task and execute the appropriate developer workflow.

## Steps

1. **Parse the task ID** from the user's input (e.g., `/task TASK-001`).
2. **Find the task file** in `.ai/tasks/active/TASK-XXX.md`.
3. **Read the task file** completely.
4. **Verify prerequisites**:
   - Task status must be `READY` or `CHANGES_REQUESTED`.
   - Verify `assigned_agent` is `null` (or matches the executing team agent).
   - All dependencies in `dependencies` list must have status `MERGED` (or `dependencies` is empty `[]`).
   - If prerequisites or dependency states are not met, report the blocker and abort execution.
5. **Determine the team** from the task's `team` field (`backend` or `frontend`).
6. **Invoke the correct developer agent from worker pool**:
   - If `team: backend` → delegate to `@backend-1`, `@backend-2`, `@backend-3`, `@backend-4` (or `@backend`)
   - If `team: frontend` → delegate to `@frontend-1` or `@frontend-2` (or `@frontend`)
7. **Pass the task context** to the developer agent, including:
   - The full task file content
   - Any relevant architecture or API contract information
   - The expected branch name (`feature/TASK-XXX` or `bugfix/TASK-XXX`)
8. **Update task status** atomically: set `status: IN_PROGRESS` and `assigned_agent: backend` (or `frontend`).

## If No Task ID Is Provided

List all tasks with status `READY` and ask which one to execute.

## Rules

- Do NOT start a task whose dependencies are not satisfied.
- Do NOT assign a backend task to the frontend agent or vice versa.
- Do NOT skip reading the task file.
- The developer agent must follow its full workflow as defined in its agent file.
