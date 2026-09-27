# Development Rules

**IMPORTANT:** Analyze the skills catalog and activate the skills needed for the task.
**IMPORTANT:** Always follow **YAGNI** (You Aren't Gonna Need It), **KISS** (Keep It Simple), **DRY** (Don't Repeat Yourself).

## General
- **File naming**: kebab-case, descriptive enough that an agent can understand a file's purpose from its name alone (via Grep/Glob), without opening it.
- **File size**: keep files under ~200 lines; split into focused modules/components rather than growing one file.
- Use `docs-seeker` skill for up-to-date library/framework docs (`context7`) instead of relying on training data.
- Use `git` skill / `gh` CLI for GitHub operations.
- Use `databases` skill / `psql` for Postgres debugging.
- Use `ai-multimodal` skill for describing or generating images/video/docs when needed.
- Use `sequential-thinking` and `ck-debug` skills for structured debugging and analysis.
- **[IMPORTANT]** Follow the codebase structure and standards documented in `./docs`.
- **[IMPORTANT]** Never simulate or mock an implementation — always implement the real thing.

## Code Quality
- Read and follow `./docs/code-standards.md` before implementing.
- Prioritize functionality and readability over strict style enforcement.
- Handle errors explicitly; no silent failures. Validate all input at trust boundaries.
- Always run `code-reviewer` agent after implementation; run `security-engineer` agent for anything security-sensitive.

## Pre-commit / Pre-push
- Run linting and typecheck before commit.
- Run the full test suite before push — never skip or ignore failing tests to unblock a merge.
- Never commit secrets, `.env` files, API keys, or credentials.
- Use conventional commit messages (`feat:`, `fix:`, `chore:`, ...), no AI-authorship references unless the team wants them.

## Security Baseline (applies to every feature)
- No hardcoded secrets; pull from environment/secrets manager.
- Validate and sanitize all external input, not just on the client.
- Least-privilege access for every new IAM role, DB user, or API scope.
- Escalate anything touching auth/payments/PII to `security-engineer` before shipping.
