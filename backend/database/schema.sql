-- =====================================================================
-- TodoPro — cấu trúc CSDL (MySQL 8)
-- Cách chạy:  npm run db:setup   (script tự tạo database theo DB_NAME trong .env)
-- Hoặc trong MySQL Workbench: CREATE DATABASE todopro; USE todopro; rồi chạy file này
-- Tiền lưu kiểu INT UNSIGNED, đơn vị: đồng (không dùng FLOAT để tránh sai số)
-- =====================================================================

-- Người dùng
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  full_name     VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Các gói bán: Basic / Gold / Pro
CREATE TABLE IF NOT EXISTS packages (
  id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  code            VARCHAR(20)      NOT NULL,              -- 'basic' | 'gold' | 'pro'
  name            VARCHAR(50)      NOT NULL,
  description     VARCHAR(255)     NOT NULL DEFAULT '',
  price_per_month INT UNSIGNED     NOT NULL,
  max_tasks       INT UNSIGNED     NULL,                  -- NULL = không giới hạn
  tier            TINYINT UNSIGNED NOT NULL,              -- 1 < 2 < 3, dùng để so gói cao/thấp
  features        JSON             NOT NULL,              -- ["Tính năng 1", "Tính năng 2"]
  is_active       TINYINT(1)       NOT NULL DEFAULT 1,
  created_at      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_packages_code (code),
  UNIQUE KEY uq_packages_tier (tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Giỏ hàng: mỗi user có tối đa 1 dòng cho mỗi gói
CREATE TABLE IF NOT EXISTS cart_items (
  id         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED     NOT NULL,
  package_id INT UNSIGNED     NOT NULL,
  months     TINYINT UNSIGNED NOT NULL,
  created_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_user_package (user_id, package_id),
  CONSTRAINT chk_cart_months CHECK (months IN (1, 3, 6, 12)),
  CONSTRAINT fk_cart_user    FOREIGN KEY (user_id)    REFERENCES users (id)    ON DELETE CASCADE,
  CONSTRAINT fk_cart_package FOREIGN KEY (package_id) REFERENCES packages (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Đơn hàng (giữ lại lịch sử → không cho xóa user còn đơn hàng)
CREATE TABLE IF NOT EXISTS orders (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_code     VARCHAR(30)  NOT NULL,                   -- VD: TD20260926-000123
  user_id        INT UNSIGNED NOT NULL,
  total_amount   INT UNSIGNED NOT NULL,
  status         ENUM('pending', 'paid', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_method ENUM('mock', 'vnpay') NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  paid_at        DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_code (order_code),
  KEY idx_orders_user_created (user_id, created_at),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chi tiết đơn: LƯU LẠI tên + giá lúc mua, để đổi giá gói sau này không làm sai đơn cũ
CREATE TABLE IF NOT EXISTS order_items (
  id           INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  order_id     INT UNSIGNED     NOT NULL,
  package_id   INT UNSIGNED     NOT NULL,
  package_name VARCHAR(50)      NOT NULL,
  unit_price   INT UNSIGNED     NOT NULL,                 -- giá/tháng tại thời điểm mua
  months       TINYINT UNSIGNED NOT NULL,
  subtotal     INT UNSIGNED     NOT NULL,                 -- unit_price * months
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  CONSTRAINT fk_order_items_order   FOREIGN KEY (order_id)   REFERENCES orders (id)   ON DELETE CASCADE,
  CONSTRAINT fk_order_items_package FOREIGN KEY (package_id) REFERENCES packages (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lịch sử thanh toán (mỗi lần thử thanh toán 1 dòng) — dùng để đối soát với VNPay
CREATE TABLE IF NOT EXISTS payments (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id        INT UNSIGNED NOT NULL,
  provider        ENUM('mock', 'vnpay') NOT NULL,
  transaction_ref VARCHAR(100) NULL,                      -- mã giao dịch phía VNPay
  amount          INT UNSIGNED NOT NULL,
  status          ENUM('pending', 'success', 'failed') NOT NULL,
  raw_response    JSON         NULL,                      -- dữ liệu gốc cổng thanh toán trả về
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payments_order (order_id),
  UNIQUE KEY uq_payments_provider_ref (provider, transaction_ref),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thời hạn sử dụng gói (tạo ra khi đơn hàng thanh toán thành công)
CREATE TABLE IF NOT EXISTS subscriptions (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  package_id INT UNSIGNED NOT NULL,
  order_id   INT UNSIGNED NOT NULL,
  start_at   DATETIME     NOT NULL,
  end_at     DATETIME     NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_subscriptions_user_end (user_id, end_at),       -- tìm "gói còn hạn" của user
  CONSTRAINT fk_subscriptions_user    FOREIGN KEY (user_id)    REFERENCES users (id)    ON DELETE CASCADE,
  CONSTRAINT fk_subscriptions_package FOREIGN KEY (package_id) REFERENCES packages (id) ON DELETE RESTRICT,
  CONSTRAINT fk_subscriptions_order   FOREIGN KEY (order_id)   REFERENCES orders (id)   ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Công việc trong Todo App (thay cho localStorage)
CREATE TABLE IF NOT EXISTS todos (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  text       VARCHAR(200) NOT NULL,
  completed  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_todos_user_created (user_id, created_at, id),     -- khớp truy vấn "việc của user, sắp theo thời gian"
  CONSTRAINT fk_todos_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
