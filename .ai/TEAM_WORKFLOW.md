# Autonomous Multi-Agent Engineering Organization — Team Workflow & Operating Manual

> **This document defines the team architecture, operational lifecycle, GitHub Project #3 integration, concurrency rules, and recovery procedures for the AI engineering team.**

---

## 1. Team Composition & Roles

The team operates as an autonomous AI software engineering organization using OpenCode agents, Git, GitHub Issues, and GitHub Project #3.

| Agent Name | Role | Worker Pool | File Location | Responsibilities |
|------------|------|-------------|---------------|------------------|
| `manager` | Engineering Manager & Orchestrator | Manager | `.opencode/agents/manager.md` | Task planning, GitHub issue creation, Project #3 board management, worker assignment via `AI Agent` field, PR code reviews, merge authority into `develop`, documentation maintenance. |
| `backend` | Backend Developer (Alias / Primary) | Backend Pool | `.opencode/agents/backend.md` | Server-side APIs, database schemas/models, authentication, validation, backend unit/integration tests. |
| `backend-1` | Backend Developer 1 | Backend Worker Pool #1 | `.opencode/agents/backend-1.md` | Independent parallel worker for backend tasks, APIs, models, backend tests. |
| `backend-2` | Backend Developer 2 | Backend Worker Pool #2 | `.opencode/agents/backend-2.md` | Independent parallel worker for backend tasks, APIs, models, backend tests. |
| `backend-3` | Backend Developer 3 | Backend Worker Pool #3 | `.opencode/agents/backend-3.md` | Independent parallel worker for backend tasks, APIs, models, backend tests. |
| `backend-4` | Backend Developer 4 | Backend Worker Pool #4 | `.opencode/agents/backend-4.md` | Independent parallel worker for backend tasks, APIs, models, backend tests. |
| `frontend` | Frontend Developer (Alias / Primary) | Frontend Pool | `.opencode/agents/frontend.md` | UI components, pages, state management, API integration, routing, client-side tests. |
| `frontend-1` | Frontend Developer 1 | Frontend Worker Pool #1 | `.opencode/agents/frontend-1.md` | Independent parallel worker for frontend UI, state, integration, client tests. |
| `frontend-2` | Frontend Developer 2 | Frontend Worker Pool #2 | `.opencode/agents/frontend-2.md` | Independent parallel worker for frontend UI, state, integration, client tests. |

---

## 2. GitHub Project #3 & Task Architecture

The team's central Kanban board is:
- **Project Number**: `3`
- **Owner**: `I-Himanshu`
- **Board URL**: `https://github.com/users/I-Himanshu/projects/3`

### 2.1 Project Fields

1. **`Status`** (Single Select):
   - `Backlog` — Identified task, not yet ready for execution.
   - `Ready` — Fully specified task, dependencies satisfied, available for claiming.
   - `In progress` — Worker agent is actively implementing on an isolated branch.
   - `In review` — Pull Request created, awaiting Manager code review.
   - `Changes requested` — Manager requested specific fixes; worker revising.
   - `QA` — PR merged into `develop`; final integration and smoke testing phase.
   - `Done` — Feature verified in integration, task completed.

2. **`AI Agent`** (Single Select):
   - `backend`
   - `backend-1`
   - `backend-2`
   - `backend-3`
   - `backend-4`
   - `frontend`
   - `frontend-1`
   - `frontend-2`

### 2.2 GitHub Assignees vs AI Agent Field

- **GitHub Assignees (`Assignees`)**: Reserved for human GitHub users (e.g. `@I-Himanshu`).
- **`AI Agent` Project Field**: Represents local OpenCode worker agent assignment. Manager sets this field to designate task ownership.

### 2.3 Task Entity Mapping

Each work unit has a 1:1 mapping across system boundaries:

```text
GitHub Project Item (Project #3)
       │
       ▼
GitHub Issue (e.g. #25 "TASK-025: Title")
       │
       ▼
Local Task File (.ai/tasks/active/TASK-025.md)
       │
       ▼
Git Branch (feature/TASK-025 or bugfix/TASK-025)
       │
       ▼
Pull Request (PR title containing TASK-025, targeting develop)
       │
       ▼
Code Review (.ai/reviews/TASK-025-review-X.md)
       │
       ▼
QA Verification Gate
       │
       ▼
Completed Task (.ai/tasks/completed/TASK-025.md)
```

---

## 3. End-to-End Workflow Lifecycle

```text
               ┌──────────────────────┐
               │    PRD & System      │
               │    Architecture      │
               └──────────┬───────────┘
                          │
                          ▼
               ┌──────────────────────┐
               │    Manager Agent     │
               └──────────┬───────────┘
                          │
                creates issue & task file
                          │
                          ▼
            ┌────────────────────────────┐
            │   GitHub Project #3        │
            │ Status: Ready              │
            │ AI Agent: assigned worker  │
            └─────────────┬──────────────┘
                          │
              Worker claims & verifies
                          │
                          ▼
            ┌────────────────────────────┐
            │   Worker Agent             │
            │ Status: In progress        │
            └─────────────┬──────────────┘
                          │
         checkout develop -> checkout -b feature/TASK-XXX
                          │
                    code & test
                          │
            commit & push to feature/TASK-XXX
                          │
                   create PR -> develop
                          │
                          ▼
            ┌────────────────────────────┐
            │   GitHub Project #3        │
            │ Status: In review          │
            └─────────────┬──────────────┘
                          │
                          ▼
            ┌────────────────────────────┐
            │    Manager Code Review     │
            └─────────────┬──────────────┘
                   │              │
           issues  │              │ approved
                   ▼              ▼
     ┌──────────────────┐    ┌──────────────────┐
     │Changes requested │    │  Merge to develop│
     └─────────┬────────┘    └────────┬─────────┘
               │                      │
         worker fixes                 ▼
               │             ┌──────────────────┐
               └────────────►│  QA Verification │
                             └────────┬─────────┘
                                      │
                                      ▼
                             ┌──────────────────┐
                             │ Status: Done     │
                             └──────────────────┘
```

---

## 4. Multi-Agent & Multi-Session Concurrency Rules

The system supports running multiple OpenCode sessions concurrently (either on the same machine across multiple terminals or across separate devices):

### 4.1 Mode A — Orchestrated Subagent Mode
Manager agent delegates work directly via OpenCode subagent tools/invocation to specific pool workers (e.g. `@backend-1`, `@frontend-1`).

### 4.2 Mode B — Independent Concurrent Sessions
User opens separate OpenCode sessions:
- Terminal 1: `manager`
- Terminal 2: `backend-1`
- Terminal 3: `backend-2`
- Terminal 4: `frontend-1`

### 4.3 Task Locking & Ownership Protocol

1. **Ownership Signal**: A task is available for a worker ONLY if:
   - `Status` on Project #3 is `Ready` (or task file status is `READY`).
   - `AI Agent` on Project #3 is either set to that worker's specific name (e.g., `backend-2`) or `unassigned`.
2. **Claiming Protocol**:
   - Before taking any action, the worker queries Project #3 and `.ai/tasks/active/` to verify ownership.
   - If claimed by another agent, the worker **MUST STOP** and select another unclaimed task assigned to its pool.
   - Upon claiming, worker updates Project #3 status to `In progress` and sets `AI Agent` to its identifier.
3. **Strict Git Branch Isolation**:
   - **NEVER** work directly on `main` or `develop`.
   - Each task operates on its own dedicated branch: `feature/TASK-XXX` or `bugfix/TASK-XXX`.
   - **NEVER** checkout, modify, rebase, or force push another agent's branch.
4. **File Scope Hygiene**:
   - Worker agents MUST ONLY modify files specified in or directly required by their assigned task.
   - Shared configuration files (`package.json`, `.env.example`) must only be touched within task specifications.

---

## 5. Developer & Manager Life-Cycles

### 5.1 Worker Agent Lifecycle

1. **Find & Claim Task**:
   - Inspect `.ai/tasks/active/` and GitHub Project #3 for tasks matching agent pool and `AI Agent` assignment.
   - Check dependencies: All prerequisite tasks in `dependencies` list MUST have status `MERGED` / `Done`.
   - Atomically set Project #3 status to `In progress` and `AI Agent: <agent-id>`. Update task file `status: IN_PROGRESS` and `assigned_agent: <agent-id>`.

2. **Branch Creation**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/TASK-XXX
   ```

3. **Implementation & Testing**:
   - Implement only scoped requirements.
   - Write tests for new functionality and bug fixes.
   - Run quality checks (`npm test`, `npm run lint`, `npm run build`). All tests MUST pass.

4. **Commit & Push**:
   - Review diff (`git diff --staged`) for hygiene and secret leaks.
   - Commit using Conventional Commits:
     ```text
     feat(scope): description

     Task: TASK-XXX
     ```
   - Push to isolated remote branch: `git push origin feature/TASK-XXX`.

5. **PR Creation & Board Sync**:
   - Create PR targeting `develop` using `.github/pull_request_template.md`.
   - Update Project #3 status to `In review`.
   - Update task file `status: PR_CREATED`, set `branch` and `pr` fields.

6. **Await Review**:
   - Stop and yield to Manager review. Do NOT merge own PR.

### 5.2 Manager Agent Lifecycle

1. **Reconcile & Planning**:
   - Inspect PRD (`.ai/PRD.md`), architecture (`.ai/ARCHITECTURE.md`), open PRs, active tasks, git branches, and Project #3 items.
   - Identify next atomic, unblocked work items.

2. **Task & Issue Creation**:
   - Create GitHub Issue:
     ```bash
     gh issue create --title "TASK-XXX: Title" --body "..."
     ```
   - Create task file at `.ai/tasks/active/TASK-XXX.md`.
   - Add item to GitHub Project #3, set `Status = Ready` and `AI Agent = <assigned-worker>`.

3. **Parallel Task Dispatch**:
   - Ensure tasks dispatched concurrently touch disjoint modules to prevent merge conflicts.
   - If tasks overlap heavily on files, serialize their execution.

4. **Code Review**:
   - Inspect PRs in `In review` status against the full Review Checklist (`AGENTS.md` §6 & `.opencode/agents/manager.md`).
   - If issues found: Set status to `Changes requested`, increment `review_cycles`, write feedback in PR/task file.
   - If approved:
     1. Merge PR into `develop`: `gh pr merge <pr-number> --squash` or `git checkout develop && git merge --no-ff feature/TASK-XXX`.
     2. Update Project #3 status to `QA`.
     3. Perform QA smoke verification.
     4. Upon QA pass: Update Project #3 status to `Done`, task file `status: MERGED`, move task file to `.ai/tasks/completed/TASK-XXX.md`.

---

## 6. Recovery & Conflict Procedures

| Event / Failure | Recovery Procedure |
|-----------------|--------------------|
| **Task already claimed by another agent** | STOP immediately. Do not overwrite `AI Agent` or branch. Find another task marked `Ready` and `unassigned`. |
| **Branch already exists remotely/locally** | Verify if previous run created it. If created by another agent for a different task, pick a unique task ID. |
| **PR already exists for task** | Check PR state. If open, resume work on existing branch; push updates to update the existing PR. |
| **Merge conflict on `develop`** | Rebase/merge `develop` into feature branch (`git checkout feature/TASK-XXX && git merge develop`), resolve conflicts locally, run test suite, and push. |
| **Tests fail in worker pipeline** | Do NOT create PR. Debug failure, fix implementation, verify `npm test` passes completely before pushing. |
| **Review cycle limit reached (3x failures)** | Mark task status `BLOCKED`. Move task file to `.ai/tasks/blocked/TASK-XXX.md`. Record detailed review note in `.ai/reviews/`. Manager evaluates scope/architecture before re-issuing. |
| **Manager agent offline** | Worker completes task up to `PR_CREATED` / `In review` status on Project #3 board, pushes branch, opens PR, and waits safely. |

---

## 7. Security & Safety Principles

1. **No Destructive Commands**: Never execute `git reset --hard`, `git clean -fd`, or `git push --force` on shared branches (`main`, `develop`).
2. **No Secrets**: Never commit `.env`, private keys, or API tokens.
3. **No Direct Merges by Workers**: Developers must never merge their own PRs.
4. **No Direct Commits to `main` / `develop`**: All code enters `develop` through reviewed PRs.
