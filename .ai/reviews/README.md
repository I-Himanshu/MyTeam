# Reviews

This directory contains review records from Manager Agent code reviews.

## When Reviews Are Created

- When the Manager requests changes on a PR (documenting what was found).
- When a task is blocked after 3 failed review cycles (documenting why).
- When an architectural decision arises during review.

## Review File Format

```markdown
# Review: TASK-XXX — Cycle N

**Date:** YYYY-MM-DD
**Task:** TASK-XXX
**Branch:** feature/TASK-XXX
**Reviewer:** Manager Agent
**Decision:** CHANGES_REQUESTED | APPROVED | BLOCKED

## Findings

### Issues Found
1. Issue description and location
2. Issue description and location

### Positive Observations
- What was done well

## Required Changes (if CHANGES_REQUESTED)
- [ ] Specific change 1
- [ ] Specific change 2

## Blocking Reason (if BLOCKED)
Explanation of why the task is blocked after 3 review cycles.
```

## Naming Convention

```
TASK-XXX-review-N.md
```

Where `N` is the review cycle number.
