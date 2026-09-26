# CLAUDE.md — TodoPro (Fullstack Developer Kit)

## Dự án này

**TodoPro** — website bán gói ứng dụng Todo (Basic / Gold / Pro): landing page, đăng ký/đăng nhập, giỏ hàng, thanh toán (giả lập → VNPay sandbox), Todo App phân quyền theo gói. Dự án cá nhân để đưa vào CV.

**Stack thực tế (ưu tiên hơn stack mặc định của kit bên dưới):**
- **Frontend:** HTML/CSS/JavaScript thuần (ES Modules), KHÔNG dùng React/framework/Tailwind. Mỗi trang 1 file HTML, gọi API qua `fetch` tập trung tại `frontend/js/api/http.js`
- **Backend:** Node.js + Express, kiến trúc nhiều lớp: route → middleware → controller → service → model
- **Database:** MySQL 8 qua `mysql2/promise`, SQL viết tay trong lớp model (không ORM), luôn dùng câu lệnh có tham số `?`
- **Auth:** JWT trong cookie httpOnly + bcrypt · Validate: joi

**Quy tắc riêng:**
- Người dùng đang học: giải thích ngắn gọn bằng tiếng Việt khi làm, làm từng giai đoạn một
- Không commit khi chưa hỏi ý kiến người dùng
- Hiển thị dữ liệu người dùng bằng `textContent`, không nhét vào `innerHTML` (chống XSS)
- Giá tiền luôn tính ở Backend từ bảng `packages`, không tin giá từ Frontend

**Kế hoạch đang thực hiện:** `plans/260926-todo-ecommerce-mvc/plan.md`

```
frontend/   # index.html (landing), pages/, css/, js/{api,components,utils,pages}/, assets/images/
            # legacy/ = app Todo cũ, sẽ chuyển vào pages/app.html ở giai đoạn 8 rồi xóa
backend/    # src/{config,routes,middlewares,validators,controllers,services,models,utils}/, database/
```

---

**Stack mặc định của kit:** React/Next.js · Node.js/NestJS/FastAPI · PostgreSQL/MongoDB · Docker — chỉ tham khảo, dự án này dùng stack ở trên.

---

## Quick Commands

```bash
/ck:plan "mô tả feature"        # Lập kế hoạch trước khi code (bắt buộc trước /ck:cook)
/ck:cook "mô tả feature"        # Build feature end-to-end (backend + frontend + db)
/ck:cook "mô tả" --parallel     # Nhiều phase/feature cùng lúc, có file-ownership riêng
/ck:fix "mô tả lỗi"             # Debug → fix → regression test
/ck:test "phạm vi"              # Chạy test suite, báo coverage
/ck:code-review "phạm vi"       # Review chất lượng + bảo mật trước khi merge
/ck:deploy "cái gì đang deploy" # Deploy zero-downtime + monitoring
```

---

## Workflow

- Primary: `./.claude/rules/primary-workflow.md`
- Rules: `./.claude/rules/development-rules.md`
- Orchestration: `./.claude/rules/orchestration-protocol.md`

**QUY TẮC BẮT BUỘC:** Không viết code trước khi có plan từ `planner` (trừ sửa lỗi 1 dòng rõ ràng).

---

## 12 Agent

| Agent | Vai trò |
|---|---|
| `planner` | Lập kế hoạch, chia phase, điều phối `researcher` |
| `researcher` | Nghiên cứu kỹ thuật song song cho `planner` |
| `fullstack-developer` | Code backend + frontend + tích hợp |
| `database-admin` | Schema, migration, tối ưu query |
| `ui-ux-designer` | Thiết kế UI/UX, design system |
| `devops-engineer` | CI/CD, Infrastructure as Code, deploy, monitoring |
| `security-engineer` | Threat modeling, review bảo mật, xử lý lỗ hổng |
| `code-reviewer` | Review chất lượng code trước merge |
| `tester` | Viết & chạy test, coverage |
| `debugger` | Điều tra root cause khi có lỗi/sự cố |
| `git-manager` | Commit theo chuẩn conventional commits |
| `docs-manager` | Đồng bộ tài liệu trong `./docs` |

Danh mục skill đầy đủ (~34 skill): xem `guide/SKILLS.md`.

---

## Cấu trúc thư mục

```
.claude/
├── agents/        # 12 agent ở trên
├── skills/         # ~34 skill (backend, frontend, devops, databases, testing, ...)
├── commands/ck/    # /ck:plan /ck:cook /ck:fix /ck:test /ck:code-review /ck:deploy
└── rules/          # primary-workflow, development-rules, orchestration-protocol
docs/                # code-standards, system-architecture (điền khi gắn vào project thật)
plans/               # plan + report của từng task, theo {date}-{slug}
guide/               # catalog agent + skill
```

---

## Nguồn gốc

Kit này được tuyển chọn (curated) từ `claudekit-engineer-main` (agent + skill lõi), `claudekit-marketing-main` (agent `database-admin`), `_app-template` (skill `security-scan`), và `agency-agents-main` (persona `devops-automator`, `security-engineer` — được viết lại theo khuôn agent chuẩn của kit này). Xem `guide/AGENTS.md` và `guide/SKILLS.md` để biết nguồn chi tiết từng file.
