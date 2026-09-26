import app from './app.js';
import env from './config/env.js';

// Giai đoạn 2 sẽ thêm bước kiểm tra kết nối MySQL trước khi listen
app.listen(env.port, () => {
  console.log(`🚀 Server chạy tại http://localhost:${env.port} (${env.nodeEnv})`);
});
