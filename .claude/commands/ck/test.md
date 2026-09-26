---
description: 💡💡 Run and validate the test suite / add coverage
argument-hint: [scope, e.g. "auth module" or leave blank for full suite]
---

## Mission
<task>
$ARGUMENTS
</task>

## Workflow
1. Use `tester` agent to run the relevant test suite (unit/integration/e2e) and report coverage.
2. If failures are found, hand off to `debugger` then `fullstack-developer` for a fix (do not fake/mock data just to pass).
3. Re-run until green; report final coverage and any gaps.

## Agents Used
- `tester`, `debugger` (on failure), `fullstack-developer` (on failure)

## Skills Used
- `test`, `code-review`

## Output
- Test run report → `plans/reports/{date}-test-{slug}.md`

## Examples
```
/ck:test "payment module"
```
