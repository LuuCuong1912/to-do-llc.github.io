# Báo cáo phân tích & đề xuất tối ưu — TodoPro

**Ngày:** 2026-09-27 · **Phạm vi:** toàn bộ `frontend/`, `backend/`, `database/`, cấu hình repo · **Phương pháp:** đọc code, đo tải trang bằng Chrome (DevTools Protocol, tắt cache), truy vấn DB thực tế

> Báo cáo **chỉ đề xuất**, chưa sửa dòng code nào. Mỗi mục có: vấn đề → bằng chứng → ảnh hưởng → đề xuất → công sức ước tính.

---

## 1. Tổng quan

| Hạng mục | Đánh giá | Nhận xét ngắn |
|---|---|---|
| Kiến trúc Backend | ⭐⭐⭐⭐⭐ | Phân lớp route → middleware → controller → service → model rõ ràng, nhất quán |
| Tính đúng đắn nghiệp vụ | ⭐⭐⭐⭐ | Transaction + khóa dòng đúng chỗ. Còn thiếu: đơn `pending` không bao giờ hết hạn |
| Bảo mật | ⭐⭐⭐⭐ | Tốt ở chế độ mặc định. Có lỗ hổng tiềm ẩn khi bật `COOKIE_SAMESITE=none` |
| Hiệu năng Frontend | ⭐⭐⭐ | JS nhỏ (24 KB), nhưng **~330 KB là font icon + ảnh nền**, CSS bên ngoài chặn render |
| Khả năng bảo trì | ⭐⭐⭐⭐ | Code sạch, có test. Còn lặp: `<head>` ở 8 trang, hằng số FE/BE, hàm parse id |
| Kiểm thử / CI | ⭐⭐⭐ | 37 unit test tốt. Chưa có CI, test e2e chưa nằm trong repo |

**Kết luận:** dự án đã ở mức tốt cho CV. Có **3 việc nên làm trước**:
1. Chặn CSRF khi dùng `SameSite=None` (bảo mật).
2. Tự hủy đơn hàng `pending` quá hạn (tính đúng đắn).
3. Thay Font Awesome bằng SVG và nén ảnh nền (giảm khoảng 60% dung lượng tải trang).

---

## 2. Số liệu đo thực tế

Đo trên Chrome headless, tắt cache, server local (`127.0.0.1`):

| Trang | Request | Dung lượng | FCP | Trong đó |
|---|---|---|---|---|
| `/` (khách) | 29 | **385 KB** | 648 ms | Font + icon CDN **172 KB** · ảnh **155 KB** · JS 24 KB (13 file) · 7 file CSS |
| `/pages/app.html` (khách) | 27 | 381 KB | 468 ms | tương tự |
| `/pages/app.html` (đã đăng nhập, kết nối đã "ấm") | 28 | 382 KB | 136 ms | |

**Nhận xét:**
- **Code của bạn chỉ chiếm ~15% dung lượng tải** (JS 24 KB + CSS ~20 KB). Phần nặng là **Font Awesome** (toàn bộ ~2.000 icon, trong khi chỉ dùng ~15) và **ảnh nền JPG 153 KB**.
- **Lệnh gọi `/api/auth/me` bắt đầu ở mốc 620 ms** dù JS đã tải xong từ mốc 40 ms. Nguyên nhân: file CSS ngoài trong `<head>` (Font Awesome, Google Fonts) **chặn thực thi module script**. Toàn bộ trang phải chờ CDN bên thứ ba.
- Ở trang chủ, `/api/packages` chỉ chạy **sau khi** `/api/auth/me` trả về (tuần tự). Ở máy local chênh vài ms, nhưng khi deploy (độ trễ 100–300 ms mỗi lượt) bảng giá sẽ hiện chậm gấp đôi.

---

## 3. Phát hiện & đề xuất

Mức ưu tiên: 🔴 nên làm ngay · 🟠 nên làm · 🟢 có thì tốt · Công sức: S (< 1 giờ) · M (vài giờ) · L (≥ 1 ngày)

### 3.1 Bảo mật & tính đúng đắn

#### 🔴 B1. Thiếu chống CSRF khi bật `COOKIE_SAMESITE=none`
- **Bằng chứng:** `backend/src/config/env.js:35` cho phép `none`, và `docs/deploy.md` hướng dẫn bật khi tách Frontend/Backend ra 2 tên miền. Không có middleware kiểm tra `Origin`.
- **Ảnh hưởng:** với `SameSite=None`, một trang web lạ có thể gửi **"request đơn giản"** (POST không body, `text/plain`) kèm cookie của nạn nhân. Ví dụ `POST /api/payments/mock/:id` (thanh toán giả lập đơn đang chờ) hoặc `POST /api/auth/logout`. CORS chỉ chặn *đọc* phản hồi, **không chặn request được gửi đi**. Ở cấu hình mặc định (`lax`, cùng tên miền) thì **an toàn**.
- **Đề xuất:** thêm `middlewares/origin-check.middleware.js`. Với POST/PATCH/DELETE, header `Origin` phải nằm trong `env.clientUrls`; bỏ qua route IPN của VNPay. Khoảng 15 dòng, không cần thư viện.
- **Công sức:** S

#### 🔴 B2. Đơn hàng `pending` không bao giờ hết hạn
- **Bằng chứng:** trạng thái `cancelled` có trong schema nhưng không chỗ nào dùng (`order.service.js:14`). Mỗi lần bấm "Thanh toán" tạo 1 đơn mới, còn giỏ hàng vẫn giữ nguyên, nên người dùng bấm 5 lần sẽ có 5 đơn `pending` treo mãi trong "Đơn hàng của tôi".
- **Ảnh hưởng:** lịch sử đơn rối. Người dùng có thể thanh toán nhầm một đơn cũ có giá cũ.
- **Đề xuất:**
  1. Khi tạo đơn mới: nếu user đã có đơn `pending` **cùng nội dung giỏ** thì dùng lại đơn đó.
  2. Tự chuyển `pending` quá 30 phút sang `cancelled` (link VNPay tự hết hạn sau 15 phút). Có thể làm mà không cần cron: chạy câu `UPDATE ... WHERE status='pending' AND created_at < NOW() - INTERVAL 30 MINUTE` trước khi liệt kê hoặc thanh toán đơn.
  3. Thêm nút "Hủy đơn" cho đơn `pending` (`PATCH /orders/:id/cancel`).
- **Công sức:** M

#### 🟠 B3. `authenticate` không kiểm tra user còn tồn tại
- **Bằng chứng:** `auth.middleware.js:14` chỉ giải mã token. Nếu user đã bị xóa mà token còn hạn (1 ngày), các API như giỏ hàng sẽ chạm lỗi khóa ngoại và trả **500** thay vì 401.
- **Đề xuất:** trong service, đổi lỗi `ER_NO_REFERENCED_ROW_2` thành 401. Hoặc thêm `tokenVersion` vào bảng users (tăng lên khi đổi mật khẩu hoặc xóa) và kiểm tra trong middleware. Cách sau cũng giải quyết được **B4**.
- **Công sức:** S–M

#### 🟢 B4. Đăng xuất không vô hiệu hóa token
- JWT vẫn dùng được tới khi hết hạn nếu bị đánh cắp. Rủi ro thấp vì cookie là httpOnly. Nếu cần thì dùng `tokenVersion` (như B3) hoặc giảm hạn token còn 2 giờ kèm refresh token.

#### 🟢 B5. Giới hạn đăng nhập sai chỉ tính theo IP
- Kẻ tấn công dùng nhiều IP vẫn dò được mật khẩu một tài khoản. Có thể đếm thêm theo email (`keyGenerator` = IP + email). Khi chạy nhiều instance cần store Redis.

#### 🟠 B6. Todo gói Pro không giới hạn số lượng và không phân trang
- **Bằng chứng:** `todo.model.js:6` lấy **toàn bộ** việc. Frontend vẽ lại cả danh sách sau mỗi thao tác.
- **Đề xuất:** đặt trần hợp lý (ví dụ 1.000 việc, ghi trong seed là "Không giới hạn*"), thêm index `(user_id, created_at, id)` khớp với `ORDER BY`. Phân trang khi thật sự cần.
- **Công sức:** S

### 3.2 Hiệu năng

#### 🔴 P1. Font Awesome đầy đủ chỉ để dùng ~15 icon
- **Bằng chứng:** 172 KB tải từ CDN mỗi trang, gồm file CSS ~100 KB và file font. Đây là CSS **chặn render** nằm trong `<head>` của cả 8 trang.
- **Đề xuất:** thay bằng **SVG sprite** tự chứa: `assets/icons.svg` khoảng 3 KB, dùng qua `<svg><use href="/assets/icons.svg#cart"/></svg>` và helper `icon('cart')` trong `dom.js`. Nếu muốn giữ Font Awesome thì tự host bản subset.
- **Lợi ích:** giảm khoảng 150 KB và 2–3 request, bỏ được phụ thuộc CDN bên thứ ba, trang bắt đầu gọi API sớm hơn khoảng 0,5 giây khi tải lần đầu.
- **Công sức:** M

#### 🔴 P2. Ảnh nền JPG 153 KB và `background-attachment: fixed`
- **Bằng chứng:** `base.css:79`. Chế độ `fixed` buộc trình duyệt vẽ lại nền mỗi lần cuộn (giật trên máy yếu). iOS Safari còn bỏ qua thuộc tính này.
- **Đề xuất:**
  1. Chuyển sang **AVIF/WebP** khoảng 40–60 KB, thêm bản 800px cho điện thoại (`image-set()`).
  2. Thay `background-attachment: fixed` bằng `body::before { position: fixed; inset: 0; background: ...; z-index: -1 }`, vì cách này được tăng tốc bằng GPU.
- **Lợi ích:** giảm khoảng 100 KB, cuộn mượt hơn trên điện thoại.
- **Công sức:** S

#### 🟠 P3. Trang chủ gọi API tuần tự
- **Bằng chứng:** `landing.js:9` chờ `initPage()` (gọi `/auth/me`) xong, tới dòng `landing.js:66` mới tải bảng giá.
- **Đề xuất:** chạy song song. Bắt đầu `getPackages()` trước rồi `await Promise.all([initPage(), packagesPromise])`. Bảng giá không phụ thuộc vào đăng nhập, chỉ nhãn "Gói hiện tại" cần session.
- **Lợi ích:** bớt một lượt gọi mạng (100–300 ms khi deploy).
- **Công sức:** S

#### 🟠 P4. Express chưa nén dữ liệu và chưa đặt cache cho file tĩnh (chế độ `SERVE_FRONTEND`)
- **Bằng chứng:** `app.js:39` dùng `express.static` với cấu hình mặc định, không có `compression`.
- **Đề xuất:**
  1. Thêm `compression()`, vì JS/CSS/JSON nén gzip giảm khoảng 70%. Nếu nền tảng deploy đã nén ở tầng proxy thì kiểm tra header `content-encoding` trước khi thêm.
  2. Đặt `Cache-Control: max-age` dài cho `/assets`. Với CSS/JS thì hoặc dùng tên file có mã phiên bản (cần bước build), hoặc giữ `no-cache` + ETag như hiện tại.
- **Công sức:** S

#### 🟢 P5. 13 module JS tải theo từng tầng import
- Trình duyệt phải tải `landing.js`, đọc thấy import, rồi mới tải tiếp `auth-guard.js`, `navbar.js`... (3–4 tầng). Với HTTP/2 thì chấp nhận được.
- **Đề xuất nhẹ:** thêm `<link rel="modulepreload">` cho 4–5 module dùng chung (`http.js`, `auth-guard.js`, `navbar.js`, `dom.js`, `toast.js`).
- **Đề xuất mạnh (tùy chọn):** thêm bước build bằng **esbuild** (1 lệnh, không đổi cách viết code), gom mỗi trang thành 1 file JS và 1 file CSS đã nén. Cách này cũng giải quyết **M1** và **P4.2**.

#### 🟢 P6. `backdrop-filter` ở 7 chỗ
- Hiệu ứng kính mờ tốn GPU trên điện thoại yếu, nhất là khi nhiều thẻ cùng hiện trên màn hình (bảng giá có 3 thẻ + navbar).
- **Đề xuất:** giữ cho navbar và card chính. Thêm `@media (prefers-reduced-transparency: reduce)` để dùng nền đặc.

#### 🟢 P7. Todo App chờ server rồi mới cập nhật giao diện
- **Bằng chứng:** `todo-app.js:79`, mỗi lần tích checkbox phải chờ một lượt gọi mạng.
- **Đề xuất:** **cập nhật lạc quan** (optimistic update): đổi giao diện ngay, lỗi thì hoàn tác và báo toast. Người dùng cảm thấy app phản hồi tức thì.
- **Công sức:** S

### 3.3 Khả năng bảo trì

#### 🟠 M1. `<head>` lặp lại ở 8 file HTML
- Mỗi trang lặp khoảng 20 dòng (font, Font Awesome kèm mã integrity, 4 file CSS). Đổi một thư viện phải sửa 8 chỗ, rất dễ sót.
- **Đề xuất:** script build nhỏ (`scripts/build-pages.js`, khoảng 40 dòng) ghép `partials/head.html` vào từng trang. Hoặc dùng esbuild ở P5. Làm P1 xong thì phần lặp cũng ngắn đi nhiều.

#### 🟠 M2. Hằng số nghiệp vụ bị định nghĩa 2 nơi
- **Bằng chứng:** `[1, 3, 6, 12]` có ở `frontend/js/utils/format.js:12` và `backend/src/services/cart.service.js:6`. Quy tắc "sửa từ gói Gold" có ở `todo.service.js` và `todo-item.js`. Quy tắc bản dùng thử nằm trong `trial-todo.store.js`.
- **Đề xuất:** API `GET /api/packages` trả thêm `meta: { monthOptions, trialMaxTasks }`, Frontend đọc từ đó. Nguồn sự thật duy nhất nằm ở Backend.

#### 🟢 M3. Hàm kiểm tra id bị lặp 3 lần
- `cart.service.js:39`, `order.service.js:31`, `todo.service.js:18` có cùng một logic. Nên tách thành `utils/parse-id.js` → `parseId(value, notFoundError)`.

#### 🟢 M4. Dọn repo
- 3 ảnh không dùng: `empty.svg`, `empty1.svg`, `star.png` (41 KB).
- Hai file CSS vượt quy tắc 200 dòng: `todo.css` (221 dòng), `layout.css` (214 dòng).
- **Bộ kit `.claude/` (12 MB, 636 file) đang nằm trong repo.** Nếu repo để **công khai cho nhà tuyển dụng xem**, nên cân nhắc đưa bộ kit ra khỏi repo (giữ trên máy, thêm vào `.gitignore`). Như vậy repo chỉ còn code của bạn, gọn và dễ đọc. Đây là quyết định của bạn.

### 3.4 Kiểm thử, CI và giá trị trên CV

#### 🟠 T1. Chưa có CI
- **Đề xuất:** GitHub Actions `.github/workflows/ci.yml` chạy `npm run lint`, `npm run format:check`, `npm test` mỗi lần push. Huy hiệu "CI passing" trên README gây ấn tượng tốt với nhà tuyển dụng.
- **Công sức:** S

#### 🟠 T2. Test e2e và test tích hợp DB chưa có trong repo
- Các kịch bản Chrome (hơn 110 kiểm tra) hiện chỉ nằm ở thư mục tạm.
- **Đề xuất:** chuyển sang **Playwright** trong `e2e/`. Cho CI chạy cùng MySQL bằng `services: mysql:8` trong GitHub Actions, việc này cũng giải quyết luôn chuyện thiếu integration test.
- **Công sức:** M–L

#### 🟢 T3. Docker Compose
- `docker compose up` là chạy được MySQL + backend + dữ liệu mẫu. Nhà tuyển dụng thử dự án trong 1 lệnh, và đây cũng là kỹ năng DevOps để ghi lên CV.

#### 🟢 T4. Hoàn thiện sản phẩm
- Chuyển việc từ bản dùng thử lên tài khoản sau khi mua gói.
- Quên mật khẩu.
- Thẻ Open Graph (hiện ảnh xem trước khi dán link vào CV hoặc LinkedIn).
- Trang quản trị gói (admin).

---

## 4. Không nên làm lúc này

| Ý tưởng | Lý do không nên |
|---|---|
| Chuyển sang React/Next.js | Viết lại toàn bộ Frontend, mất điểm mạnh "hiểu JS thuần" khi phỏng vấn. Để dành cho dự án thứ 2 |
| Thêm ORM (Sequelize/Prisma) | SQL viết tay đang rõ ràng, là điểm cộng. ORM không giải quyết vấn đề nào đang có |
| Redis, microservices | Quy mô hiện tại không cần. Chỉ thêm Redis khi chạy nhiều instance (rate limit) |
| Tối ưu truy vấn DB | Mọi truy vấn đã có index phù hợp, `/auth/me` chạy 3 truy vấn song song. Chưa có điểm nghẽn |

---

## 5. Lộ trình đề xuất

| Đợt | Việc | Công sức | Kết quả |
|---|---|---|---|
| **1 — Sửa ngay** | B1 CSRF · B2 đơn hết hạn + hủy đơn · B6 trần + index todo · P3 gọi API song song | ~1 ngày | Đóng các rủi ro bảo mật và dữ liệu |
| **2 — Nhanh hơn** | P1 SVG icon · P2 ảnh nền AVIF · P4 compression · P7 optimistic UI · M4 dọn repo | ~1 ngày | Dung lượng tải trang từ ~385 KB xuống ~130 KB, không còn phụ thuộc CDN chặn render |
| **3 — Chuyên nghiệp** | T1 CI · T2 Playwright + DB test · M1/M2 · T3 Docker | 2–3 ngày | Huy hiệu CI, chạy bằng 1 lệnh, test có trong repo |

Con số "~130 KB" là **ước tính**: bỏ ~150 KB icon và ~100 KB ảnh, còn lại font Jost + code. Cần đo lại sau khi làm.

---

## 6. Tiến độ thực hiện

### ✅ Đợt 1 — hoàn thành (2026-09-27)

| Mục | Đã làm | Kiểm chứng |
|---|---|---|
| **B1** CSRF | `middlewares/origin-check.middleware.js` gắn trước mọi route `/api`: POST/PUT/PATCH/DELETE có `Origin` lạ → 403 `FORBIDDEN_ORIGIN`; không có `Origin` (Postman, VNPay) hoặc cùng tên miền server → cho qua | 5 test supertest + thử server thật |
| **B2** Đơn hết hạn | `config/order.js` (VNPay 15 phút < đơn 30 phút, kiểm tra lúc khởi động). `is_expired` / `expires_at` tính bằng giờ MySQL. Tự hủy đơn quá hạn khi liệt kê / tạo đơn. Dùng lại đơn pending cùng giỏ + phương thức. `PATCH /orders/:id/cancel` (chặn khi link VNPay còn hiệu lực). Frontend: nút "Hủy đơn", "Thanh toán trước HH:mm", màn hình "Đơn hàng đã hủy" | 8 unit test + 12 kiểm tra server thật + 5 kiểm tra trình duyệt |
| **B6** Todo | Trần 1.000 việc cho gói không giới hạn. Index `(user_id, created_at, id)` thay `(user_id)`; `db:setup` tự đồng bộ index cho DB cũ | `EXPLAIN` dùng index mới, hết filesort. `GET /todos` 1.000 việc: 8 ms |
| **P3** Song song | `landing.js` gọi `/packages` ngay, song song với `/auth/me` | Trình duyệt: 2 request bắt đầu cùng lúc |

Tổng: unit test 37 → **51**, hồi quy API **58/58**, tính năng mới **18/18** (server thật) + **7/7** (trình duyệt).

### ✅ Đợt 2 — hoàn thành (2026-09-27)

| Mục | Đã làm |
|---|---|
| **P1** Icon | Bỏ Font Awesome (CDN). Tự host sprite `assets/icons.svg` gồm 22 icon **Lucide** (ISC, mã gốc tải từ npm `lucide-static` 1.48.0), **4,6 KB**. Thêm `icon()` / `setIcon()` trong `utils/dom.js`, class `.icon` trong `base.css`. CSP bỏ `cdnjs` |
| **P2** Ảnh nền | `background.avif` 38 KB, `background.webp` 47 KB, bản điện thoại 720px 16 KB (gốc JPG 153 KB, giữ làm dự phòng), chọn qua `image-set()`. Thay `background-attachment: fixed` bằng `body::before { position: fixed }` |
| **P4** Nén + cache | Middleware `compression` (tự chọn **Brotli**/gzip; `base.css` 4,4 → 1,9 KB). File tĩnh: `/assets` cache 7 ngày; HTML/CSS/JS `no-cache` + ETag (không đổi → 304) |
| **P7** Todo | Cập nhật lạc quan cho đánh dấu / sửa / xóa; lỗi thì hoàn tác đúng việc đó + toast |
| **M4** Dọn repo | Xóa `empty.svg`, `empty1.svg`. **Giữ `star.png`** (người dùng tự thêm, trước đây chọn giữ). Tách CSS: footer → `pages/landing.css`, danh sách → `pages/todo-list.css` → không còn file nào > 200 dòng. **Bộ kit `.claude/` vẫn trong repo** (quyết định của người dùng) |

**Đo lại (Chrome, tắt cache, cùng cách đo ở mục 2):**

| Trang | Trước | Sau (Live Server) | Sau (chế độ deploy, có nén) |
|---|---|---|---|
| `/` desktop | 385 KB | **150 KB** (−61%) | **132 KB** (−66%) |
| `/pages/app.html` | 381 KB | 146 KB | 130 KB |
| `/` điện thoại 390px | ~385 KB | 126 KB | **109 KB** (−72%) |
| Tải từ CDN bên thứ ba | 172 KB | 44 KB (chỉ còn Google Fonts) | 43 KB |

Kiểm chứng: 51/51 unit test · trình duyệt: đăng nhập 23/23, mua hàng + VNPay 37/37 (chế độ deploy), dùng thử 20/20, hủy đơn 7/7.

**Còn lại (đề xuất tiếp):** Google Fonts (Jost) vẫn là CSS ngoài chặn render. Lần tải đầu, `/auth/me` bắt đầu ở ~445 ms (trước là 620 ms). Tự host font Jost (`woff2`, chỉ bộ ký tự Latin + tiếng Việt) sẽ bỏ nốt phụ thuộc CDN này.

### ⏳ Đợt 3 — chưa làm
