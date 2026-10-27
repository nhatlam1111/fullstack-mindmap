import fs from 'node:fs';
import path from 'node:path';
import { loadContent, validate, updateIdsLock } from './lib/content';
import { compile } from './lib/compile';
import { todayVN } from './today';

const root = path.resolve(import.meta.dirname, '..');
const loaded = loadContent(root);
const { errors } = validate(loaded, todayVN());
if (errors.length) {
  for (const e of errors) console.error('  LỖI  ' + e);
  console.error(`\nNội dung có ${errors.length} lỗi; chạy npm run validate để xem chi tiết.`);
  process.exit(1);
}
const added = updateIdsLock(loaded);
const json = compile(loaded, new Date().toISOString());
const out = path.join(root, 'src', 'generated', 'content.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(json));
console.log(`Đã biên dịch ${Object.keys(json.topics).length} chủ đề → src/generated/content.json (${(fs.statSync(out).size / 1024).toFixed(0)} KB)${added ? `; ghi thêm ${added} id vào ids.lock` : ''}`);
