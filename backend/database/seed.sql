-- =====================================================================
-- TodoPro — dữ liệu mẫu: 3 gói Basic / Gold / Pro
-- Chạy lại nhiều lần vẫn an toàn: gói đã có thì CẬP NHẬT, không tạo trùng
-- Muốn đổi giá / tính năng: sửa ở đây rồi chạy lại  npm run db:setup
-- =====================================================================

INSERT INTO packages (code, name, description, price_per_month, max_tasks, tier, features) VALUES
  ('basic', 'Basic', 'Khởi đầu gọn nhẹ cho việc cá nhân hằng ngày',
    29000, 20, 1,
    JSON_ARRAY('Tối đa 20 công việc', 'Thanh theo dõi tiến độ', 'Lưu trữ đám mây, dùng trên mọi thiết bị')),

  ('gold', 'Gold', 'Cho người bận rộn cần quản lý nhiều việc hơn',
    59000, 100, 2,
    JSON_ARRAY('Tối đa 100 công việc', 'Mọi tính năng của Basic', 'Chỉnh sửa công việc', 'Hiệu ứng pháo giấy khi hoàn thành')),

  ('pro', 'Pro', 'Không giới hạn — dành cho người làm việc chuyên nghiệp',
    99000, NULL, 3,
    JSON_ARRAY('Không giới hạn công việc', 'Mọi tính năng của Gold', 'Ưu tiên tính năng mới'))
AS new_pkg
ON DUPLICATE KEY UPDATE
  name            = new_pkg.name,
  description     = new_pkg.description,
  price_per_month = new_pkg.price_per_month,
  max_tasks       = new_pkg.max_tasks,
  features        = new_pkg.features;
