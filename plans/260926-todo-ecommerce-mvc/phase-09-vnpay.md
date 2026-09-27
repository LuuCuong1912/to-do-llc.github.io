# Giai đoạn 9 — Tích hợp VNPay sandbox

**Mục tiêu:** Thêm phương thức thanh toán VNPay thật (ở môi trường thử) bên cạnh thanh toán giả lập.

## Chuẩn bị

- [ ] Đăng ký tài khoản merchant sandbox tại trang VNPay dành cho nhà phát triển. Bạn sẽ nhận `vnp_TmnCode`, `vnp_HashSecret`, URL sandbox và thẻ ngân hàng test
- [ ] Đọc tài liệu chính thức: "Thanh toán PAY", "Return URL", "IPN URL", "Mã lỗi"
- [x] Thêm vào `.env.example` (người dùng tự điền `.env`): `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `VNP_URL`, `VNP_RETURN_URL`

## Luồng VNPay

```
checkout.html chọn "VNPay"
 → POST /api/orders                        (tạo đơn pending)
 → POST /api/payments/vnpay/:orderId       → BE tạo URL có chữ ký → trả { paymentUrl }
 → FE: window.location = paymentUrl        (người dùng nhập thẻ test trên trang VNPay)
 ├─→ VNPay gọi GET /api/payments/vnpay/ipn  (server-to-server) ← NGUỒN TIN CẬY
 │     kiểm tra chữ ký + số tiền + đơn đang pending → cập nhật paid + kích hoạt gói
 │     trả { RspCode: '00', Message: 'Confirm Success' } theo quy định VNPay
 └─→ Trình duyệt quay về GET /api/payments/vnpay/return
       kiểm tra chữ ký → redirect về FE payment-result.html?orderId=..
```

## Backend

- [x] `services/payment/vnpay.service.js`:
  - `createPaymentUrl(order, ipAddr)`: sắp xếp tham số theo alphabet, ký HMAC-SHA512 bằng `crypto` có sẵn của Node
  - `verifySignature(query)`
  - `handleIpn(query)`: **dùng lại** logic "đánh dấu đã trả tiền + kích hoạt gói" của giai đoạn 7. Tách logic đó thành `orderService.markPaid(orderId, paymentInfo)` để mock và VNPay dùng chung
- [x] Số tiền gửi VNPay = `total_amount * 100` (theo quy định của VNPay)
- [x] Ghi `raw_response` vào bảng `payments` để đối soát
- [x] Xử lý các trường hợp: đơn không tồn tại, sai số tiền, đã xử lý rồi, chữ ký sai (trả `RspCode` đúng cho từng trường hợp)

## Chạy thử IPN trên máy cá nhân

- VNPay không gọi được `localhost`. Dùng **ngrok** hoặc **Cloudflare Tunnel** để có URL công khai, rồi khai báo URL IPN trong trang quản lý sandbox
- Nếu chưa làm được IPN: có thể tạm cập nhật đơn ở `return` **cho môi trường dev**, nhưng phải ghi rõ trong README rằng production phải dùng IPN

## Kết quả khi xong

- Thanh toán bằng thẻ test thành công → đơn `paid`, gói được kích hoạt
- Hủy thanh toán trên trang VNPay → đơn `failed`, giỏ hàng vẫn còn để thử lại
- Sửa tay tham số `vnp_Amount` trên URL return → bị từ chối vì sai chữ ký

## Ghi chú khi thực hiện (2026-09-26)

- Mỗi lần bấm thanh toán VNPay = 1 dòng `payments` (pending) với `transaction_ref` = mã đơn + 4 ký tự → IPN tìm đơn qua dòng này; thử lại nhiều lần không trùng mã
- `verifySignature`: chỉ lấy tham số `vnp_*`, bỏ `vnp_SecureHash(Type)`, so sánh bằng `crypto.timingSafeEqual`
- `VNP_CONFIRM_ON_RETURN=true` (chỉ dev): xác nhận đơn ở Return URL khi VNPay không gọi được IPN vào localhost
- Trang kết quả: vừa từ VNPay về mà đơn còn pending → hỏi lại tối đa 5 lần (mỗi 2 giây) chờ IPN
- VNPay tự ẩn khi chưa cấu hình `VNP_TMN_CODE` / `VNP_HASH_SECRET` / `VNP_RETURN_URL`
- **Đã kiểm tra bằng khóa giả** (chữ ký đối chiếu với cách ký độc lập theo code mẫu VNPay): IPN 00 / 01 / 02 / 04 / 97, hủy thanh toán → đơn failed + giỏ còn nguyên, Return URL chữ ký giả → `gateway=invalid`
- ⏳ **Còn lại (cần người dùng):** đăng ký sandbox thật, điền `.env`, thử bằng thẻ test NCB
