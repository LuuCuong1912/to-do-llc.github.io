# Skills Catalog — Fullstack Developer Kit

Danh mục skill đã tuyển chọn cho kit này. Nguồn: đa số copy nguyên trạng từ `claudekit-engineer-main/claude/skills/` (đường dẫn gốc giữ nguyên tên folder); ngoại lệ ghi rõ bên dưới.

**Tổng số skill**: 34

## Utilities & Workflow
- `cook` — Kích hoạt trước khi implement bất kỳ feature/plan/fix nào
- `fix` — Kích hoạt trước khi sửa bug/lỗi/test fail
- `ck-plan` — Lập kế hoạch, thiết kế kiến trúc, roadmap kỹ thuật theo phase
- `ck-debug` — Debug có hệ thống, root cause analysis trước khi fix
- `code-review` — Review code với "adversarial rigor" (red-team mindset)
- `test` — Chạy unit/integration/e2e/UI test, phân tích coverage
- `docs` — Phân tích codebase, quản lý tài liệu dự án
- `research` — Nghiên cứu giải pháp kỹ thuật, đánh giá công nghệ
- `bootstrap` — Bootstrap dự án mới (research → stack → design → plan → implement)
- `coding-level` — Đặt mức độ kinh nghiệm để giải thích/output phù hợp
- `problem-solving` — Kỹ thuật giải quyết vấn đề khi bế tắc
- `sequential-thinking` — Phân tích từng bước cho vấn đề phức tạp, có khả năng revise
- `project-management` — Theo dõi tiến độ, quản lý task, báo cáo

## Backend & Database
- `backend-development` — Node.js/Python/Go, REST/GraphQL/gRPC, auth, microservices
- `better-auth` — Xác thực (email/password, OAuth, 2FA/MFA, passkeys)
- `payment-integration` — SePay (VietQR), Polar, Stripe, Paddle, Creem.io
- `databases` — Thiết kế schema, query MongoDB/PostgreSQL, migration

## Frontend & Design
- `frontend-development` — React/TypeScript hiện đại (Suspense, TanStack, MUI)
- `frontend-design` — Giao diện từ design/screenshot/video
- `ui-styling` — shadcn/ui (Radix UI + Tailwind)
- `web-design-guidelines` — Audit UI theo Web Interface Guidelines, accessibility
- `web-frameworks` — Next.js (App Router, RSC, SSR/ISR), Turborepo

## Infra, DevOps & Security
- `devops` — Deploy Cloudflare/Docker/GCP/Kubernetes, CI/CD
- `security-scan` *(nguồn: `_app-template/.claude/skills/security-scan`)* — Quét lỗ hổng, secret hardcode, dependency, pattern OWASP
- `mobile-development` — React Native, Flutter, Swift/SwiftUI, Kotlin

## Dev Tools
- `git` — Conventional commits, PR, merge, security scan trước push
- `scout` — Scout codebase song song, tìm file/context nhanh
- `repomix` — Đóng gói repo thành file AI-friendly
- `docs-seeker` — Tra cứu docs thư viện/framework mới nhất (context7)
- `use-mcp` — Sử dụng MCP server tools
- `mcp-management` — Khám phá/quản lý MCP server

## Multimedia
- `chrome-devtools` — Automation browser (Puppeteer), screenshot, performance
- `media-processing` — FFmpeg/ImageMagick/RMBG
- `document-skills` — Đọc/ghi docx, pdf, pptx, xlsx (4 sub-skill)

---
Xem `_fullstack-developer-kit/CLAUDE.md` để biết cách các skill này được agent kích hoạt trong từng lệnh `/ck:*`.
