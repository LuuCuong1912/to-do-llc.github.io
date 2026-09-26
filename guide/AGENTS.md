# Agents Catalog — Fullstack Developer Kit

**Tổng số agent**: 12 — 9 copy nguyên trạng từ `claudekit-engineer-main`, 1 copy từ `claudekit-marketing-main`, 2 viết mới (chuyển thể từ `agency-agents-main`).

| Agent | Model | Nguồn | Ghi chú |
|---|---|---|---|
| `planner` | — | claudekit-engineer-main/claude/agents/planner.md | copy nguyên trạng |
| `researcher` | — | claudekit-engineer-main/claude/agents/researcher.md | copy nguyên trạng |
| `fullstack-developer` | sonnet | claudekit-engineer-main/claude/agents/fullstack-developer.md | copy nguyên trạng |
| `database-admin` | — | claudekit-marketing-main/.claude/agents/database-admin.md | copy nguyên trạng (kit engineer không có agent DB riêng) |
| `ui-ux-designer` | — | claudekit-engineer-main/claude/agents/ui-ux-designer.md | copy nguyên trạng |
| `devops-engineer` | sonnet | agency-agents-main/engineering/engineering-devops-automator.md | **viết mới** — chuyển thể sang khuôn agent ClaudeKit |
| `security-engineer` | sonnet | agency-agents-main/engineering/engineering-security-engineer.md | **viết mới** — chuyển thể sang khuôn agent ClaudeKit |
| `code-reviewer` | — | claudekit-engineer-main/claude/agents/code-reviewer.md | copy nguyên trạng |
| `tester` | haiku | claudekit-engineer-main/claude/agents/tester.md | copy nguyên trạng |
| `debugger` | sonnet | claudekit-engineer-main/claude/agents/debugger.md | copy nguyên trạng |
| `git-manager` | haiku | claudekit-engineer-main/claude/agents/git-manager.md | copy nguyên trạng |
| `docs-manager` | — | claudekit-engineer-main/claude/agents/docs-manager.md | copy nguyên trạng |

## Vì sao chọn 2 agent viết mới

- `devops-engineer`: `claudekit-engineer-main` có skill `devops` nhưng không có agent chuyên trách CI/CD & hạ tầng — persona `engineering-devops-automator` trong `agency-agents-main` lấp đúng khoảng trống này.
- `security-engineer`: kit gốc không có agent bảo mật chuyên sâu (chỉ có `security-scan` skill dạng công cụ quét) — persona `engineering-security-engineer` bổ sung năng lực threat modeling & review bảo mật đầy đủ hơn.

Cả 2 được viết lại theo đúng khuôn frontmatter (`name`/`description` có `<example>` blocks/`model`/`tools`) và cấu trúc section (Behavioral Checklist → Core Responsibilities → Execution Process → Output Format → Team Mode) mà các agent gốc của `claudekit-engineer-main` đang dùng, để nhất quán trong cùng 1 kit.
