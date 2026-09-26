# Giai đoạn 9 — Tích hợp VNPay sandbox

**Mục tiêu:** Thêm phương thức thanh toán VNPay thật (ở môi trường thử) bên cạnh thanh toán giả lập.

## Chuẩn bị

- [ ] Đăng ký tài khoản merchant sandbox tại trang VNPay dành cho nhà phát triển. Bạn sẽ nhận `vnp_TmnCode`, `vnp_HashSecret`, URL sandbox và thẻ ngân hàng test
- [ ] Đọc tài liệu chính thức: "Thanh toán PAY", "Return URL", "IPN URL", "Mã lỗi"
- [ ] Thêm vào `.env`: `VNP_TMN_CODE`, `VNP_HASH_SECRET`, `VNP_URL`, `VNP_RETURN_URL`

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

- [ ] `services/payment/vnpay.service.js`:
  - `createPaymentUrl(order, ipAddr)`: sắp xếp tham số theo alphabet, ký HMAC-SHA512 bằng `crypto` có sẵn của Node
  - `verifySignature(query)`
  - `handleIpn(query)`: **dùng lại** logic "đánh dấu đã trả tiền + kích hoạt gói" của giai đoạn 7. Tách logic đó thành `orderService.markPaid(orderId, paymentInfo)` để mock và VNPay dùng chung
- [ ] Số tiền gửi VNPay = `total_amount * 100` (theo quy định của VNPay)
- [ ] Ghi `raw_response` vào bảng `payments` để đối soát
- [ ] Xử lý các trường hợp: đơn không tồn tại, sai số tiền, đã xử lý rồi, chữ ký sai (trả `RspCode` đúng cho từng trường hợp)

## Chạy thử IPN trên máy cá nhân

- VNPay không gọi được `localhost`. Dùng **ngrok** hoặc **Cloudflare Tunnel** để có URL công khai, rồi khai báo URL IPN trong trang quản lý sandbox
- Nếu chưa làm được IPN: có thể tạm cập nhật đơn ở `return` **cho môi trường dev**, nhưng phải ghi rõ trong README rằng production phải dùng IPN

## Kết quả khi xong

- Thanh toán bằng thẻ test thành công → đơn `paid`, gói được kích hoạt
- Hủy thanh toán trên trang VNPay → đơn `failed`, giỏ hàng vẫn còn để thử lại
- Sửa tay tham số `vnp_Amount` trên URL return → bị từ chối vì sai chữ ký
