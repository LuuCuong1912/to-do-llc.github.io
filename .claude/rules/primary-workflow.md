# Primary Workflow

**IMPORTANT:** Analyze the skills catalog in `.claude/skills/` and activate the skills needed for the task.
**IMPORTANT:** Ensure token efficiency while maintaining high quality.

#### 1. Plan Before Code
- Before starting, delegate to `planner` agent to write an implementation plan with TODO tasks into `./plans/{date}-{slug}/`.
- During planning, `planner` spawns `researcher` agents in parallel for any unfamiliar tech/library decisions.
- **DO NOT** write code before a plan exists for anything beyond a trivial one-line fix (see `/ck:plan`).

#### 2. Implementation
- Delegate to `fullstack-developer` agent for backend, frontend, and integration work.
- Delegate to `database-admin` agent for schema design, migrations, and query optimization.
- Delegate to `ui-ux-designer` agent for UI/UX and design-system work.
- Delegate to `devops-engineer` agent for CI/CD, infrastructure, and deployment work.
- **DO NOT** create new "-enhanced"/"-v2" files — update existing files directly.
- After any code change, run the project's compile/typecheck command to catch errors immediately.

#### 3. Testing
- Delegate to `tester` agent to run tests on the **final, simplified code** — not a prototype version.
- **DO NOT** use fake data, mocks, or temporary tricks just to pass a build.
- **IMPORTANT:** Fix failing tests and re-run via `tester` agent until all tests pass before finishing.

#### 4. Security & Code Quality
- Delegate to `code-reviewer` agent after tests pass — correctness, maintainability, standards.
- If the change touches auth, payments, user data, or file uploads, also delegate to `security-engineer` agent.
- Both must clear Critical/High findings before the change is considered done.

#### 5. Integration & Docs
- Always follow the plan produced by `planner` agent; document any deviation.
- Delegate to `docs-manager` agent to keep `./docs` in sync with what actually shipped.
- Delegate to `git-manager` agent for commits — conventional commit format, no confidential data.

#### 6. Debugging
- When a bug is reported, delegate to `debugger` agent to reproduce and root-cause it first.
- Implement the fix via `fullstack-developer`, then repeat Step 3 (Testing) and Step 4 (Review).

#### 7. Shipping
- Once tests pass and review clears, delegate to `devops-engineer` agent for deployment (see `/ck:deploy`).
