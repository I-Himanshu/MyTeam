# ADR: Isolated working copies for parallel agent execution

**Date:** 2026-10-05
**Status:** Accepted
**Context:** TASK-002 (backend) and TASK-009 (frontend) subagents sharing one
working directory; TASK-002's first commit landed on `feature/TASK-009`.

## Decision

When delegating two or more tasks that will execute concurrently, the Manager
will give each specialist an isolated working copy via `git worktree`
(one directory per agent, e.g. `/tmp/opencode/<task-id>`), and each delegation
prompt will require the agent to verify `git branch --show-current` (and
`git status --short`) immediately before every commit. Single-task delegation
may continue to use the main working directory.

## Consequences

- Eliminates cross-branch commit contamination without serializing work.
- Worktrees share the repo object store, so setup cost is one checkout each.
- Manager must remember to remove worktrees (`git worktree remove`) after
  the task merges.
