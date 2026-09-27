// Chép phần <head> DÙNG CHUNG (frontend/partials/head.html) vào mọi trang HTML, giữa 2 dấu đánh dấu:
//   <!-- @shared-head:start ... -->  ...  <!-- @shared-head:end -->
// Phần riêng của từng trang (title, description, CSS của trang) nằm NGOÀI 2 dấu này → giữ nguyên.
//
//   npm run sync:head    → cập nhật các trang
//   npm run check:head   → chỉ kiểm tra (CI dùng): có trang lệch với file mẫu thì báo lỗi, exit 1
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const frontend = path.join(root, 'frontend');
const checkOnly = process.argv.includes('--check');

const START = '<!-- @shared-head:start — tự sinh từ frontend/partials/head.html (npm run sync:head), đừng sửa tay -->';
const END = '<!-- @shared-head:end -->';
const INDENT = '    ';

const partial = fs
  .readFileSync(path.join(frontend, 'partials', 'head.html'), 'utf8')
  .replace(/\r\n/g, '\n')
  .trim();
const block = [START, ...partial.split('\n'), END].map((line) => (line ? INDENT + line : '')).join('\n');

const pages = [
  path.join(frontend, 'index.html'),
  ...fs
    .readdirSync(path.join(frontend, 'pages'))
    .filter((f) => f.endsWith('.html'))
    .map((f) => path.join(frontend, 'pages', f)),
];

const outdated = [];
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const start = html.indexOf(`${INDENT}<!-- @shared-head:start`);
  const end = html.indexOf(END);
  if (start === -1 || end === -1) {
    throw new Error(`${path.relative(root, file)}: thiếu dấu ${START.slice(0, 26)} / ${END}`);
  }
  const updated = html.slice(0, start) + block + html.slice(end + END.length);
  if (updated !== html) {
    outdated.push(path.relative(root, file));
    if (!checkOnly) fs.writeFileSync(file, updated);
  }
}

if (checkOnly && outdated.length > 0) {
  console.error(`❌ Phần <head> chung bị lệch ở: ${outdated.join(', ')}. Chạy "npm run sync:head".`);
  process.exit(1);
}
console.log(
  checkOnly
    ? `✅ ${pages.length} trang khớp với frontend/partials/head.html`
    : `✅ Đã cập nhật ${outdated.length}/${pages.length} trang`,
);
