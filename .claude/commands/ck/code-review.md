---
description: 💡💡 Production-readiness code review before merge/ship
argument-hint: [PR / files / feature to review]
---

## Mission
<task>
$ARGUMENTS
</task>

## Workflow
1. Use `code-reviewer` agent for correctness, maintainability, and standards review.
2. If the change touches auth, payments, user data, or file uploads, also run `security-engineer` agent.
3. Findings are ranked worst-first; block on Critical/High.

## Agents Used
- `code-reviewer`, `security-engineer` (conditional)

## Skills Used
- `code-review`, `security-scan`

## Output
- Review report → `plans/reports/{date}-review-{slug}.md`

## Examples
```
/ck:code-review "auth module changes"
```
