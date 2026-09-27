// Tạo database + bảng + dữ liệu mẫu, đọc thông tin kết nối từ backend/.env
//   npm run db:setup   → tạo nếu chưa có (chạy lại nhiều lần vẫn an toàn)
//   npm run db:reset   → XÓA SẠCH database rồi tạo lại (chỉ dùng khi dev)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import env from '../src/config/env.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const reset = process.argv.includes('--reset');

// Database tạo từ phiên bản cũ: "CREATE TABLE IF NOT EXISTS" không thêm index mới → đồng bộ tại đây.
// Thêm index mới TRƯỚC rồi mới xóa index cũ (khóa ngoại user_id luôn cần 1 index bắt đầu bằng user_id).
const INDEX_CHANGES = [
  {
    table: 'todos',
    add: { name: 'idx_todos_user_created', columns: 'user_id, created_at, id' }, // khớp ORDER BY created_at, id
    drop: 'idx_todos_user',
  },
];

const hasIndex = async (conn, table, name) => {
  const [rows] = await conn.query(
    'SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1',
    [table, name],
  );
  return rows.length > 0;
};

const syncIndexes = async (conn) => {
  for (const { table, add, drop } of INDEX_CHANGES) {
    if (!(await hasIndex(conn, table, add.name))) {
      await conn.query(`ALTER TABLE ${mysql.escapeId(table)} ADD INDEX ${mysql.escapeId(add.name)} (${add.columns})`);
      console.log(`✅ Thêm index ${table}.${add.name}`);
    }
    if (drop && (await hasIndex(conn, table, drop))) {
      await conn.query(`ALTER TABLE ${mysql.escapeId(table)} DROP INDEX ${mysql.escapeId(drop)}`);
      console.log(`✅ Xóa index thừa ${table}.${drop}`);
    }
  }
};

const run = async () => {
  if (reset && env.isProduction) {
    throw new Error('Không được reset database khi NODE_ENV=production');
  }

  // Kết nối chưa chọn database, vì có thể database chưa tồn tại
  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true, // cho phép chạy cả file .sql một lần — CHỈ dùng trong script này
  });

  try {
    const db = mysql.escapeId(env.db.name);
    if (reset) {
      await conn.query(`DROP DATABASE IF EXISTS ${db}`);
      console.log(`🗑️  Đã xóa database ${env.db.name}`);
    }
    await conn.query(`CREATE DATABASE IF NOT EXISTS ${db} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE ${db}`);

    for (const file of ['schema.sql', 'seed.sql']) {
      const sql = await fs.readFile(path.join(dir, file), 'utf8');
      await conn.query(sql);
      console.log(`✅ Đã chạy ${file}`);
    }
    await syncIndexes(conn);

    const [tables] = await conn.query('SHOW TABLES');
    const [packages] = await conn.query('SELECT code, name, price_per_month, max_tasks FROM packages ORDER BY tier');
    console.log(`\n📦 Database "${env.db.name}" có ${tables.length} bảng. Các gói:`);
    console.table(packages);
  } finally {
    await conn.end();
  }
};

run().catch((err) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
