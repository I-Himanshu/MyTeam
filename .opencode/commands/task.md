---
description: Execute a specific task — Load task, verify GitHub Project #3 ownership, and execute the developer workflow
---
You are executing the `/task` command.

## Your Goal

Load the specified task, verify GitHub Project #3 ownership, and execute the appropriate developer workflow.

## Steps

1. **Parse the task ID** from the user's input (e.g., `/task TASK-001`).
2. **Find the task file** in `.ai/tasks/active/TASK-XXX.md` (or inspect Project #3 board).
3. **Read the task file** completely.
4. **Verify prerequisites & task locking**:
   - Task status must be `READY` or `CHANGES_REQUESTED` (Project #3 status `Ready` or `Changes requested`).
   - Check `AI Agent` on GitHub Project #3: MUST match executing worker agent (e.g., `backend-1`) or be `unassigned`.
   - If another worker agent currently owns the task (`In progress` under another `AI Agent`), STOP immediately.
   - All dependencies in `dependencies` list must have status `MERGED` / `Done`.
   - If prerequisites or dependency states are not met, report the blocker and abort execution.
5. **Claim task & sync board**:
   - Set Project #3 status to `In progress` and `AI Agent` to executing agent.
   - Set task file `status: IN_PROGRESS` and `assigned_agent: <worker-id>`.
6. **Execute Developer Workflow**:
   - Checkout branch `feature/TASK-XXX` from `develop`.
   - Implement requirements and tests.
   - Run verification suite (`npm test`, `npm run lint`, `npm run build`).
   - Commit changes (Conventional Commits with `Task: TASK-XXX`).
   - Push branch to remote.
   - Create PR targeting `develop` using `.github/pull_request_template.md`.
7. **Sync Board on PR Creation**:
   - Set Project #3 status to `In review`.
   - Set task file `status: PR_CREATED`, update `branch` and `pr` fields.
   - Request review from Manager Agent.

## If No Task ID Is Provided

Inspect GitHub Project #3 board and `.ai/tasks/active/` for unclaimed tasks with status `Ready` assigned to your worker pool.

## Rules

- Do NOT start a task whose dependencies are not satisfied.
- Do NOT claim a task already owned by another worker agent.
- Do NOT merge your own PR. Yield to Manager review.
- The developer agent must follow its full workflow as defined in its agent file and `.ai/TEAM_WORKFLOW.md`.

