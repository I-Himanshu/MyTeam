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
   - All dependencies must be `MERGED` or have no dependencies.
   - If prerequisites are not met, explain why and stop.
5. **Determine the team** from the task's `team` field.
6. **Invoke the correct developer agent**:
   - If `team: backend` → delegate to `@backend`
   - If `team: frontend` → delegate to `@frontend`
7. **Pass the task context** to the developer agent, including:
   - The full task file content
   - Any relevant architecture or API contract information
   - The expected branch name (`feature/TASK-XXX`)
8. **Update task status** to `IN_PROGRESS` and set `assigned_agent`.

## If No Task ID Is Provided

List all tasks with status `READY` and ask which one to execute.

## Rules

- Do NOT start a task whose dependencies are not satisfied.
- Do NOT assign a backend task to the frontend agent or vice versa.
- Do NOT skip reading the task file.
- The developer agent must follow its full workflow as defined in its agent file.
