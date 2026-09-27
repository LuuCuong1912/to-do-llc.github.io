import { execSync } from 'node:child_process';

// Chạy trong thư mục backend/ để script đọc đúng backend/.env
export default function globalTeardown() {
  execSync('node database/cleanup-test-users.js @e2e.test', { cwd: 'backend', stdio: 'inherit' });
}
