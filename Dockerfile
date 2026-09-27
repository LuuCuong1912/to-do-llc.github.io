# Image chạy TodoPro: Express phục vụ cả API lẫn giao diện (SERVE_FRONTEND=true) trên cổng 3000.
# Dùng bản "slim" (Debian) thay vì Alpine: thư viện bcrypt có sẵn bản dựng sẵn cho Debian, không cần công cụ biên dịch.
FROM node:22-slim

ENV NODE_ENV=production \
    SERVE_FRONTEND=true \
    PORT=3000

WORKDIR /app/backend

# Cài thư viện TRƯỚC khi chép code → Docker dùng lại lớp cache khi chỉ sửa code
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY backend/ ./
COPY frontend/ /app/frontend/

# Không chạy bằng root
USER node

EXPOSE 3000

# Khởi động: tạo bảng/gói nếu chưa có → tạo tài khoản demo (đã có thì bỏ qua) → chạy server
CMD ["sh", "-c", "node database/setup.js && node database/seed-demo.js && node src/server.js"]
