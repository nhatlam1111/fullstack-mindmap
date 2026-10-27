/**
 * Đổi dist/index.html (một file tự chứa do vite-plugin-singlefile tạo) thành trang artifact:
 * claude.ai tự bọc trang trong <!doctype><html><head><body>, nên file chỉ chứa
 * <title>, meta, font, <style>, nội dung và <script>.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const src = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');

const pick = (re: RegExp, label: string) => {
  const all = [...src.matchAll(re)].map((m) => m[0]);
  if (!all.length) throw new Error('không tìm thấy ' + label + ' trong dist/index.html');
  return all;
};
const title = pick(/<title>[\s\S]*?<\/title>/g, '<title>')[0];
const metaSides = pick(/<meta name="claude:viewport-fit-sides"[^>]*>/g, 'meta viewport-fit-sides')[0];
const links = pick(/<link [^>]*fonts\.(googleapis|gstatic)\.com[^>]*>/g, 'link font');
const styles = pick(/<style[^>]*>[\s\S]*?<\/style>/g, '<style>').map((s) => s.replace(/<style[^>]*>/, '<style>'));
const scripts = pick(/<script type="module"[^>]*>[\s\S]*?<\/script>/g, '<script type="module">').map((s) => s.replace(/<script type="module"[^>]*>/, '<script type="module">'));
const body = /<body>([\s\S]*?)<\/body>/.exec(src)?.[1]?.replace(/<script[\s\S]*?<\/script>/g, '').trim() ?? '<div id="root"></div>';

const out = [title, metaSides, ...links, ...styles, body, ...scripts].join('\n');
const file = path.join(root, 'dist', 'artifact.html');
fs.writeFileSync(file, out);
console.log(`dist/artifact.html: ${(Buffer.byteLength(out) / 1024).toFixed(0)} KB`);
