/**
 * Lệnh release: chạy lần lượt mọi bước kiểm tra; một bước lỗi thì dừng và không có bản để publish.
 * Thành công: dist/artifact.html sẵn sàng publish, và release.json ghi lại kết quả.
 * Publish lên claude.ai do Claude thực hiện bằng công cụ Artifact (không chạy được từ script).
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const steps: [string, string][] = [
  ['Biên dịch nội dung', 'npx tsx scripts/build-content.ts'],
  ['Typecheck', 'npx tsc --noEmit -p tsconfig.json'],
  ['Lint', 'npx eslint .'],
  ['Kiểm tra nội dung', 'npx tsx scripts/validate-content.ts'],
  ['Unit test', 'npx vitest run'],
  ['Build', 'npm run build'],
  ['Test end-to-end', 'npx playwright test'],
];

const results: { step: string; ok: boolean; ms: number }[] = [];
for (const [name, cmd] of steps) {
  const t = Date.now();
  process.stdout.write(`▶ ${name}… `);
  try {
    execSync(cmd, { cwd: root, stdio: 'pipe' });
    results.push({ step: name, ok: true, ms: Date.now() - t });
    console.log(`xong (${((Date.now() - t) / 1000).toFixed(1)}s)`);
  } catch (e) {
    const err = e as { stdout?: Buffer; stderr?: Buffer };
    console.log('LỖI\n');
    console.log(String(err.stdout ?? '').slice(-4000));
    console.log(String(err.stderr ?? '').slice(-4000));
    console.log(`\nDừng release ở bước "${name}". Không publish.`);
    process.exit(1);
  }
}

const content = JSON.parse(fs.readFileSync(path.join(root, 'src/generated/content.json'), 'utf8'));
const counts: Record<string, number> = {};
for (const t of Object.values(content.topics) as { contentStatus: string }[]) counts[t.contentStatus] = (counts[t.contentStatus] ?? 0) + 1;
const size = fs.statSync(path.join(root, 'dist/artifact.html')).size;
const summary = { builtAt: content.builtAt, topics: counts, artifactBytes: size, steps: results };
fs.writeFileSync(path.join(root, 'dist/release.json'), JSON.stringify(summary, null, 2));
console.log(`\nSẵn sàng publish: dist/artifact.html (${(size / 1024).toFixed(0)} KB) · chủ đề ${JSON.stringify(counts)}`);
