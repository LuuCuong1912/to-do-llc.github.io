---
description: 💡💡 Plan a feature or fix before writing any code
argument-hint: [task description]
---

## Mission
<task>
$ARGUMENTS
</task>

## Workflow
1. Use `AskUserQuestion` to clarify scope/requirements if the task is ambiguous.
2. Use `planner` agent to research the approach and write an implementation plan with TODO tasks into `./plans/{date}-{slug}/`.
3. `planner` spawns `researcher` agents in parallel for any unfamiliar tech/library decisions.
4. Present the plan for approval — **do not start implementing**.

## Agents Used
- `planner` — implementation plan authoring
- `researcher` — parallel technical research

## Skills Used
- `plan`, `ck-plan`, `research`, `sequential-thinking`

## Output
- Plan file → `plans/{date}-{slug}/plan.md`

## Examples
```
/ck:plan "add JWT-based authentication to the API"
```
