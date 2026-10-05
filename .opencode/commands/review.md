---
description: Review current PR/task — Manager reviews the current work against project standards
agent: manager
---
You are the Manager Agent executing the `/review` command.

## Your Goal

Review the current PR or task according to all project rules and standards.

## Steps

1. **Identify what to review**:
   - Check for tasks with status `PR_CREATED` or `MANAGER_REVIEW` in `.ai/tasks/active/`.
   - If multiple exist, list them and ask which to review.
   - If none exist, report that there are no PRs pending review.

2. **Read the task file** for the PR being reviewed.

3. **Read the project standards**:
   - `AGENTS.md` — project rules
   - `.ai/ENGINEERING_RULES.md` — engineering standards
   - `.ai/CODING_STANDARDS.md` — code style
   - `.ai/ARCHITECTURE.md` — architecture requirements

4. **Inspect the code changes**:
   ```bash
   git log develop..feature/TASK-XXX --oneline
   git diff develop..feature/TASK-XXX
   ```

5. **Run the full review checklist** (from Manager Agent definition):
   - Requirements compliance
   - Code quality
   - Architecture alignment
   - Security
   - Testing
   - Git hygiene
   - Dependencies
   - Unnecessary changes

6. **Make a decision**:

   ### If APPROVED:
   - Update task status to `APPROVED`
   - Merge the PR: `git checkout develop && git merge --no-ff feature/TASK-XXX`
   - Update task status to `MERGED`
   - Move task file to `.ai/tasks/completed/`
   - Push develop: `git push origin develop`

   ### If CHANGES REQUESTED:
   - Update task status to `CHANGES_REQUESTED`
   - Increment `review_cycles` in the task file
   - Provide specific, actionable feedback
   - List exactly what needs to change

   ### If BLOCKED (3rd review cycle failure):
   - Update task status to `BLOCKED`
   - Move task file to `.ai/tasks/blocked/`
   - Create a review note in `.ai/reviews/`
   - Explain why the task is blocked

7. **Document the review** with a summary of findings and decision.

## Rules

- NEVER approve code merely because the developer says it works.
- ALWAYS inspect the actual git diff.
- NEVER skip any checklist item.
- Maximum 3 review cycles before blocking.
