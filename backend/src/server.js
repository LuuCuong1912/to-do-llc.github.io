import app from './app.js';
import env from './config/env.js';
import { checkConnection } from './config/db.js';

const start = async () => {
  try {
    await checkConnection();
    console.log(`✅ Database connected (${env.db.name}@${env.db.host}:${env.db.port})`);
  } catch (err) {
    console.error(`❌ Không kết nối được MySQL: ${err.message}`);
    console.error('   Kiểm tra: MySQL đã chạy chưa? DB_USER/DB_PASSWORD trong .env đúng chưa? Đã chạy "npm run db:setup" chưa?');
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`🚀 Server chạy tại http://localhost:${env.port} (${env.nodeEnv})`);
  });
};

start();
