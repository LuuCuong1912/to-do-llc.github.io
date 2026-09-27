# Cơ sở dữ liệu — TodoPro

MySQL 8, bảng mã `utf8mb4`. Định nghĩa đầy đủ: [`backend/database/schema.sql`](../backend/database/schema.sql). Dữ liệu mẫu: [`seed.sql`](../backend/database/seed.sql).

```mermaid
erDiagram
    users ||--o{ cart_items : "có"
    users ||--o{ orders : "đặt"
    users ||--o{ subscriptions : "sở hữu"
    users ||--o{ todos : "tạo"
    packages ||--o{ cart_items : "nằm trong"
    packages ||--o{ order_items : "được mua"
    packages ||--o{ subscriptions : "kích hoạt"
    orders ||--|{ order_items : "gồm"
    orders ||--o{ payments : "thanh toán"
    orders ||--o{ subscriptions : "tạo ra"

    users {
        int id PK
        varchar full_name
        varchar email UK
        varchar password_hash
    }
    packages {
        int id PK
        varchar code UK "basic | gold | pro"
        int price_per_month "VND"
        int max_tasks "NULL = không giới hạn"
        tinyint tier UK "1 | 2 | 3"
        json features
    }
    cart_items {
        int id PK
        int user_id FK
        int package_id FK
        tinyint months "1 | 3 | 6 | 12"
    }
    orders {
        int id PK
        varchar order_code UK
        int user_id FK
        int total_amount
        enum status "pending | paid | failed | cancelled"
        enum payment_method "mock | vnpay"
        datetime paid_at
    }
    order_items {
        int id PK
        int order_id FK
        int package_id FK
        varchar package_name "chụp lại lúc mua"
        int unit_price "chụp lại lúc mua"
        tinyint months
        int subtotal
    }
    payments {
        int id PK
        int order_id FK
        enum provider
        varchar transaction_ref
        int amount
        enum status
        json raw_response
    }
    subscriptions {
        int id PK
        int user_id FK
        int package_id FK
        int order_id FK
        datetime start_at
        datetime end_at
    }
    todos {
        int id PK
        int user_id FK
        varchar text
        tinyint completed
    }
```

## Quyết định thiết kế

| Quyết định | Lý do |
|---|---|
| Tiền lưu `INT UNSIGNED` (đồng) | VND không có số lẻ, `FLOAT` gây sai số khi cộng tiền |
| `order_items` lưu `package_name` và `unit_price` | Sau này đổi giá gói thì đơn cũ vẫn đúng số tiền đã trả |
| `UNIQUE(user_id, package_id)` trong `cart_items` | Mỗi gói chỉ 1 dòng trong giỏ, thêm lại thì cập nhật số tháng |
| `packages.tier` UNIQUE | So sánh gói cao/thấp để xác định gói đang dùng |
| `orders.user_id` là `ON DELETE RESTRICT` | Không để mất lịch sử đơn hàng / thanh toán khi xóa user |
| `cart_items`, `todos` là `ON DELETE CASCADE` | Xóa user thì dữ liệu tạm của họ không còn ý nghĩa |
| `UNIQUE(provider, transaction_ref)` trong `payments` | Cổng thanh toán gửi lại cùng một giao dịch nhiều lần thì cũng không bị ghi trùng |
| Index `(user_id, end_at)` trong `subscriptions` | Truy vấn "gói còn hạn của user" chạy rất thường xuyên |
