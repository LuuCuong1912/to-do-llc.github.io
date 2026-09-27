# Orchestration Protocol

## Delegation Context (MANDATORY)

When spawning a subagent, **ALWAYS** include in its prompt:
1. **Work Context Path** — the project root being worked on
2. **Reports Path** — `{work_context}/plans/reports/`
3. **Plans Path** — `{work_context}/plans/`

**Example:**
```
Task prompt: "Fix parser bug.
Work context: /path/to/project
Reports: /path/to/project/plans/reports/
Plans: /path/to/project/plans/"
```

## Sequential Chaining
Use when tasks have dependencies:
- **Planning → Implementation → Testing → Security/Code Review** — standard feature flow
- **Debugging → Fix → Testing → Review** — bug-fix flow
- **Implementation → Testing → Review → Deployment** — ship flow (ends with `devops-engineer`)

## Parallel Execution
Use for independent tasks:
- Multiple `researcher` agents investigating different technical options during planning
- `fullstack-developer` instances on separate phases with non-overlapping file ownership (from `/ck:cook --parallel`)
- `code-reviewer` and `security-engineer` reviewing the same change simultaneously

## Subagent Status Protocol

Subagents report one of these statuses on completion:

| Status | Meaning | Controller Action |
|---|---|---|
| **DONE** | Completed successfully | Proceed to next step |
| **DONE_WITH_CONCERNS** | Completed but flagged doubts | Address if correctness/scope issue, else proceed |
| **BLOCKED** | Cannot complete | Provide context, break down task, or escalate to user |
| **NEEDS_CONTEXT** | Missing information | Provide missing context, re-dispatch |
