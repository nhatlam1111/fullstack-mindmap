import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadContent, validate } from '../../scripts/lib/content';

let root: string;
const write = (rel: string, text: string) => { const f = path.join(root, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); };
const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
const roadmap = (nums: number[], topics: string[], phaseWeeks = nums) =>
  `phases:\n  - id: p1\n    title: P\n    weeks: [${phaseWeeks.join(', ')}]\nweeks:\n`
  + nums.map((n) => `  - week: ${n}\n    title: T\n    goal: G\n    practice: P\n    checkpoint: C\n    topics: [${topics.join(', ')}]\n`).join('');
const topic = (id: string, extra = '', body = '') => `---\nid: ${id}\ntitle: ${id}\nparent: g1\nsummary: s\ncontentStatus: ${body ? 'draft' : 'skeleton'}\nvolatility: slow\n${extra}---\n${body}`;
const BODY = (ex = 'Chưa có ví dụ thực tế') => ['Vấn đề cần giải quyết', 'Cơ chế và luồng hoạt động', 'Điều kiện áp dụng, lợi ích và đánh đổi', 'Lỗi thường gặp và dấu hiệu nhận biết', 'Ví dụ thực tế', 'Câu hỏi tự kiểm tra', 'Chủ đề liên quan và nguồn kiểm chứng']
  .map((h) => `## ${h}\n\n${h === 'Ví dụ thực tế' ? ex : 'nội dung'}\n`).join('\n');

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-'));
  write('content/branches.yaml', 'root: { id: root, title: R }\nbranches:\n  - id: b1\n    title: B\n    volatility: slow\n    groups:\n      - id: g1\n        title: G\n');
  write('content/roadmap.yaml', roadmap(range(24), ['t1']));
  write('content/topics/b1/t1.md', topic('t1'));
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
const run = () => validate(loadContent(root), '2026-10-14');

describe('validate-content', () => {
  it('nội dung hợp lệ không có lỗi', () => { expect(run().errors).toEqual([]); });
  it('bắt id trùng', () => {
    write('content/topics/b1/g1.md', topic('g1'));
    expect(run().errors.join('\n')).toMatch(/id trùng: "g1"/);
  });
  it('bắt vòng lặp cần học trước', () => {
    write('content/topics/b1/t1.md', topic('t1', 'prerequisites: [t2]\n'));
    write('content/topics/b1/t2.md', topic('t2', 'prerequisites: [t1]\n'));
    expect(run().errors.join('\n')).toMatch(/vòng lặp/);
  });
  it('bắt liên kết tới chủ đề không tồn tại', () => {
    write('content/topics/b1/t1.md', topic('t1', 'related: [khong-co]\n'));
    expect(run().errors.join('\n')).toMatch(/related trỏ tới "khong-co"/);
  });
  it('lộ trình 30 chặng hợp lệ', () => {
    write('content/roadmap.yaml', roadmap(range(30), ['t1']));
    expect(run().errors).toEqual([]);
  });
  it('bắt chặng nhảy số', () => {
    write('content/roadmap.yaml', roadmap([1, 2, 4], ['t1']));
    expect(run().errors.join('\n')).toMatch(/chặng 3 xuất hiện 0 lần/);
  });
  it('bắt chặng trùng số', () => {
    write('content/roadmap.yaml', roadmap([1, 2, 2], ['t1'], [1, 2]));
    expect(run().errors.join('\n')).toMatch(/chặng 2 xuất hiện 2 lần/);
  });
  it('bắt giai đoạn không phủ đủ chặng', () => {
    write('content/roadmap.yaml', roadmap([1, 2], ['t1'], [1]));
    expect(run().errors.join('\n')).toMatch(/phủ đúng chặng 1–2/);
  });
  it('bắt id từng có rồi biến mất', () => {
    write('content/ids.lock', 't1\nt-cu\n');
    expect(run().errors.join('\n')).toMatch(/"t-cu" từng có/);
    write('content/deleted-ids.yaml', 'deleted: [t-cu]\n');
    expect(run().errors).toEqual([]);
  });
  it('bài nháp thiếu tiêu đề bị báo lỗi', () => {
    write('content/topics/b1/t1.md', topic('t1', '', '## Vấn đề cần giải quyết\n\nabc\n'));
    expect(run().errors.join('\n')).toMatch(/cần đúng 7 tiêu đề/);
  });
  it('mục Ví dụ thực tế phải tham chiếu ví dụ đã khai báo hoặc ghi rõ chưa có', () => {
    write('content/topics/b1/t1.md', topic('t1', '', BODY('Một ví dụ tự nghĩ ra.')));
    expect(run().errors.join('\n')).toMatch(/phải tham chiếu ví dụ/);
    write('content/topics/b1/t1.md', topic('t1', '', BODY()));
    expect(run().errors).toEqual([]);
  });
  it('ví dụ lab-run phải trỏ tới thư mục có README', () => {
    const ex = 'examples:\n  - id: e1\n    kind: lab-run\n    title: E\n    path: lab/experiments/t1\n    checkedAt: 2026-10-14\n';
    write('content/topics/b1/t1.md', topic('t1', ex, BODY('[ex:e1]')));
    expect(run().errors.join('\n')).toMatch(/không có lab\/experiments\/t1\/README.md/);
    write('lab/experiments/t1/README.md', '# ok');
    expect(run().errors).toEqual([]);
  });
  it('ví dụ case công khai phải có url', () => {
    const ex = 'examples:\n  - id: e1\n    kind: public-case\n    title: E\n    checkedAt: 2026-10-14\n';
    write('content/topics/b1/t1.md', topic('t1', ex, BODY('[ex:e1]')));
    expect(run().errors.join('\n')).toMatch(/cần url/);
  });
  it('chú thích phải khớp nguồn', () => {
    write('content/topics/b1/t1.md', topic('t1', '', BODY().replace('## Vấn đề cần giải quyết\n\nnội dung', '## Vấn đề cần giải quyết\n\nnội dung[^khong-co]')));
    expect(run().errors.join('\n')).toMatch(/\[\^khong-co\] không khớp/);
  });
  it('bài Đã kiểm chứng cần ngày đối chiếu và nguồn', () => {
    write('content/topics/b1/t1.md', topic('t1', '', BODY()).replace('contentStatus: draft', 'contentStatus: verified'));
    const e = run().errors.join('\n');
    expect(e).toMatch(/cần verifiedAt/);
    expect(e).toMatch(/cần ít nhất một nguồn/);
  });
});
