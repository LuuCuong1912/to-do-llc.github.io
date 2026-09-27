---
description: 💡💡💡 Plan (if needed) and implement a feature end-to-end
argument-hint: [task description] [--fast|--parallel]
---

## Mission
<task>
$ARGUMENTS
</task>

## Workflow
1. If no active plan exists for this task, run `/ck:plan` first (skip with `--fast` for trivial changes).
2. Use `fullstack-developer` agent to implement the plan — backend, frontend, and infra as scoped.
3. For `--parallel`, `planner` splits work into phases with explicit file-ownership boundaries and spawns multiple `fullstack-developer` instances.
4. After implementation, activate `code-review` skill and run `/ck:code-review`.
5. Run `/ck:test` before reporting done.

## Agents Used
- `planner`, `fullstack-developer`, `ui-ux-designer` (when UI work is involved), `database-admin` (when schema changes are involved)

## Skills Used
- `cook`, `backend-development`, `frontend-development`, `databases`, `better-auth`, `payment-integration`, `devops`

## Output
- Code changes in the target files (never new "-enhanced" files — edit in place)
- Implementation report → `plans/{date}-{slug}/reports/`

## Examples
```
/ck:cook "add password reset flow"
/ck:cook "implement dashboard" --parallel
```
