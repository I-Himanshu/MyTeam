# MyTeam — AI Software Engineering Organization

> **Phase 1** — Foundation for an AI-driven development workflow using OpenCode, Git, and GitHub.

---

## 1. What Is This Project?

This repository implements an **AI Software Engineering Organization** where a Manager Agent coordinates specialist Developer Agents to build software through structured tasks, code review, and Git/GitHub workflows.

The actual application being built is a simple MERN-stack demo app (user registration, login, dashboard, profile). But the real product here is the **workflow itself** — a reusable system for AI-driven software development.

## 2. What Is Phase 1?

Phase 1 establishes the **foundation**:

- ✅ 3 AI agents (Manager, Backend Developer, Frontend Developer)
- ✅ Task planning and lifecycle system
- ✅ Git branching workflow with PR-based review
- ✅ Engineering documentation templates
- ✅ GitHub CI/CD pipeline
- ✅ OpenCode commands for common workflows

**Phase 1 does NOT include:**

- ❌ QA, DevOps, or additional specialist agents
- ❌ Autonomous orchestration (no auto-chaining between agents)
- ❌ MCP servers, Redis, message queues, or dashboards
- ❌ Docker infrastructure
- ❌ Production deployment

## 3. Agent Architecture

```
Human (You)
    ↓
Manager Agent (@manager)
    ├── Plans tasks from PRD
    ├── Assigns tasks to parallel worker pools
    ├── Reviews Pull Requests
    └── Merges approved work
        ↓
    ┌───────────────────────────────────┬───────────────────────────────────┐
    │                                   │                                   │
Backend Worker Pool                 Frontend Worker Pool
  ├── @backend-1 (Worker #1)          ├── @frontend-1 (Worker #1)
  ├── @backend-2 (Worker #2)          └── @frontend-2 (Worker #2)
  ├── @backend-3 (Worker #3)
  └── @backend-4 (Worker #4)
```

## 4. Directory Structure

```
MyTeam/
├── .opencode/
│   ├── agents/
│   │   ├── manager.md          # Manager Agent definition
│   │   ├── backend.md          # Backend Developer Agent definition
│   │   └── frontend.md         # Frontend Developer Agent definition
│   └── commands/
│       ├── plan.md             # /plan — Create tasks from PRD
│       ├── task.md             # /task TASK-XXX — Execute a task
│       ├── review.md           # /review — Review current PR
│       └── status.md           # /status — Show project status
│
├── .ai/
│   ├── PRD.md                  # Product Requirements Document
│   ├── ARCHITECTURE.md         # System architecture
│   ├── ENGINEERING_RULES.md    # Engineering standards
│   ├── CODING_STANDARDS.md     # Code style conventions
│   ├── API_CONTRACTS.md        # API endpoint specifications
│   ├── DATABASE_SCHEMA.md      # Data model documentation
│   ├── tasks/
│   │   ├── README.md           # Task system documentation
│   │   ├── active/             # Tasks in progress
│   │   ├── completed/          # Merged tasks
│   │   └── blocked/            # Blocked tasks
│   ├── reviews/                # Review records
│   │   └── README.md
│   └── decisions/              # Architecture Decision Records
│       └── README.md
│
├── .github/
│   ├── pull_request_template.md
│   ├── ISSUE_TEMPLATE/
│   │   └── task.md
│   └── workflows/
│       └── ci.yml              # CI pipeline
│
├── AGENTS.md                   # Global agent contract (source of truth)
├── CONTRIBUTING.md             # Development workflow guide
├── README.md                   # This file
└── .gitignore
```

## 5. Task Lifecycle

Every piece of work follows this lifecycle:

```
BACKLOG → READY → IN_PROGRESS → SELF_TEST → PR_CREATED → MANAGER_REVIEW
                                                              ↓
                                              CHANGES_REQUESTED (max 3×)
                                                              ↓
                                                    APPROVED → MERGED
                                                       or
                                                    BLOCKED
```

See [.ai/tasks/README.md](.ai/tasks/README.md) for full documentation.

## 6. Git Workflow

```
main (production)
└── develop (integration)
    ├── feature/TASK-001
    ├── feature/TASK-002
    └── bugfix/TASK-003
```

**Key rules:**
- Never commit directly to `main` or `develop`
- Developer agents work on `feature/TASK-XXX` or `bugfix/TASK-XXX`
- All merges happen via Pull Request
- Only the Manager Agent can merge PRs
- See [AGENTS.md](AGENTS.md) for complete rules

## 7. Developer Workflow

For a developer agent working on a task:

1. Read `AGENTS.md` and the assigned task file
2. `git checkout develop && git pull`
3. `git checkout -b feature/TASK-XXX`
4. Implement the task requirements
5. Write/update tests
6. Run tests, lint, and build
7. Inspect `git diff`
8. Commit with Conventional Commits format
9. Push the feature branch
10. Create a Pull Request targeting `develop`
11. Update task status to `PR_CREATED`
12. Wait for Manager review

## 8. Manager Workflow

The Manager Agent:

1. **Plans** — Reads the PRD, creates tasks → `/plan`
2. **Assigns** — Delegates tasks to the right agent → `/task TASK-XXX`
3. **Reviews** — Checks code quality, tests, security → `/review`
4. **Merges** — Merges approved PRs into `develop`
5. **Tracks** — Monitors project progress → `/status`

## 9. How to Use OpenCode

### Start OpenCode in this directory

```bash
opencode
```

### Available Commands

| Command | Purpose |
|---------|---------|
| `/plan` | Manager reads PRD and creates tasks |
| `/task TASK-XXX` | Load and execute a specific task |
| `/review` | Manager reviews pending PRs |
| `/status` | Show project status and all tasks |

### Invoke Agents Directly

| Agent | Invocation | Role |
|-------|-----------|------|
| Manager | `@manager` | Planning, review, coordination |
| Backend | `@backend` | Server-side implementation |
| Frontend | `@frontend` | Client-side implementation |

## 10. How to Test the Workflow

### Step 1: Plan tasks

```
/plan
```

The Manager Agent will read `.ai/PRD.md` and create task files in `.ai/tasks/active/`.

### Step 2: Execute a task

```
/task TASK-001
```

This loads the task and delegates to the appropriate developer agent.

### Step 3: Review the work

```
/review
```

The Manager reviews the PR against project standards.

### Step 4: Check status

```
/status
```

See all tasks, their statuses, and pending work.

## 11. What Is NOT Implemented Yet

| Feature | Phase | Notes |
|---------|-------|-------|
| QA Agent | 2 | Automated testing and quality verification |
| DevOps Agent | 2 | CI/CD, deployment, infrastructure |
| Database Agent | 2+ | Schema migrations, optimization |
| Security Agent | 2+ | Security audits, vulnerability scanning |
| Autonomous orchestration | 2+ | Auto-chaining agents without human input |
| Real application code | 1 (via agents) | Created by running the workflow |
| Production deployment | 2+ | Docker, cloud infrastructure |

## 12. Running the Demo App Locally

The demo MERN app lives in `server/` (Express API, port 5000) and `client/`
(React + Vite, port 3000). See [.ai/ARCHITECTURE.md](.ai/ARCHITECTURE.md) §1
for the system diagram.

### Prerequisites

- Node.js >= 18 and npm
- MongoDB: a local `mongod` on `mongodb://localhost:27017/myteam`, or any
  reachable instance via `MONGO_URI`. (Tests use `mongodb-memory-server`
  automatically — no local MongoDB needed for `npm test` in `server/`.)

### Setup

```bash
# Install dependencies (root orchestrator + both apps)
npm install
npm install --prefix server
npm install --prefix client

# Configure environment (templates are versioned; `.env` files are gitignored)
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit server/.env: set MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN.
# CLIENT_URL must match the client dev origin (http://localhost:3000) or
# browsers will block API calls via CORS.
```

### Run (single command)

```bash
npm run dev
```

Starts the API on http://localhost:5000 and the client on
http://localhost:3000 concurrently (`concurrently` output is prefixed
`[server]` / `[client]`).

### Test, lint, build

```bash
npm test    # server (136 tests) + client (74 tests)
npm run lint   # eslint in both packages
npm run build  # production build of client/ (outputs client/dist/)
```

### Ports summary

| Service | URL | Source |
|---------|-----|--------|
| Client (Vite dev) | http://localhost:3000 | `client/vite.config.js` |
| API (Express) | http://localhost:5000/api | `server/.env` `PORT` |
| API base for client | `VITE_API_BASE_URL` (default `http://localhost:5000/api`) | `client/.env` |
| CORS allow-list | `CLIENT_URL` (must be `http://localhost:3000`) | `server/.env` |

## 13. Future Phase 2 Ideas

- **QA Agent** — Automated test verification, coverage analysis, regression detection
- **DevOps Agent** — CI/CD pipeline management, deployment automation
- **Autonomous Mode** — Manager auto-assigns and chains tasks without human intervention
- **Code Review AI** — Automated first-pass review before Manager review
- **Progress Dashboard** — Visual project status (generated as static HTML)
- **Multi-project support** — Manage multiple applications with the same agent organization
- **Learning system** — Agents improve based on review history and past decisions
