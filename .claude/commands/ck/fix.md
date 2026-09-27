---
description: 💡💡 Diagnose and fix a bug
argument-hint: [bug description or error]
---

## Mission
<task>
$ARGUMENTS
</task>

## Workflow
1. Use `debugger` agent to reproduce and root-cause the issue (logs, stack traces, failing test).
2. Use `fullstack-developer` agent to implement the minimal fix — no unrelated refactors.
3. Use `tester` agent to add a regression test that would have caught this bug.
4. Use `code-reviewer` agent to sanity-check the fix before closing.

## Agents Used
- `debugger`, `fullstack-developer`, `tester`, `code-reviewer`

## Skills Used
- `fix`, `ck-debug`, `problem-solving`

## Output
- Fix committed to the affected files
- Regression test added
- Fix report → `plans/reports/{date}-fix-{slug}.md`

## Examples
```
/ck:fix "checkout API returns 500 on empty cart"
```
