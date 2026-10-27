import path from 'node:path';
import { loadContent, validate } from './lib/content';
import { todayVN } from './today';

const root = path.resolve(import.meta.dirname, '..');
const loaded = loadContent(root);
const { errors, warnings } = validate(loaded, todayVN());
for (const w of warnings) console.warn('  cảnh báo  ' + w);
for (const e of errors) console.error('  LỖI      ' + e);
const counts = loaded.topics.reduce<Record<string, number>>((acc, t) => {
  acc[t.fm.contentStatus] = (acc[t.fm.contentStatus] ?? 0) + 1; return acc;
}, {});
console.log(`\n${loaded.topics.length} chủ đề (${Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', ')}) · ${errors.length} lỗi · ${warnings.length} cảnh báo`);
if (errors.length) process.exit(1);
