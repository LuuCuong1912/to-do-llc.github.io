---
description: 💡💡💡 Ship a change with a zero-downtime deployment
argument-hint: [what's being deployed]
---

## Mission
<task>
$ARGUMENTS
</task>

## Workflow
1. Confirm `/ck:test` and `/ck:code-review` have passed for this change.
2. Use `devops-engineer` agent to design/execute the deployment (blue-green/canary/rolling) with health checks.
3. `devops-engineer` sets up or confirms monitoring/alerting for the shipped change.
4. `git-manager` agent creates the release commit/tag with a conventional message.

## Agents Used
- `devops-engineer`, `git-manager`

## Skills Used
- `devops`, `git`

## Output
- Deployment report → `plans/reports/{date}-deploy-{slug}.md` (strategy, rollback trigger, monitoring links)

## Examples
```
/ck:deploy "checkout flow v2"
```
