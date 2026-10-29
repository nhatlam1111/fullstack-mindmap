import { describe, it, expect } from 'vitest';
import {
  applyReview, markUnderstood, mergeProgress, reconcileIds, migrateBackup, progressOf, emptyProgress,
  stageFromLegacyWeek, currentStage, MetaSchema, SCHEMA_VERSION, type TopicProgress,
} from '../../src/store/model';

const p = (over: Partial<TopicProgress> = {}): TopicProgress => ({ ...emptyProgress('2026-10-01T00:00:00.000Z'), ...over });

describe('ôn tập định kỳ', () => {
  it('Đã hiểu → hạn ôn đầu tiên sau 7 ngày', () => {
    const r = markUnderstood(p(), '2026-10-14', 'now');
    expect(r.learnStatus).toBe('understood');
    expect(r.review).toEqual({ intervalDays: 7, dueAt: '2026-10-21' });
  });
  it('Nhớ rõ tăng theo thang 7 → 21 → 60 → 150 rồi giữ 150', () => {
    let x = markUnderstood(p(), '2026-10-14', 'now');
    const seen: number[] = [];
    for (let i = 0; i < 5; i++) { x = applyReview(x, 'clear', '2026-10-14', 'now'); seen.push(x.review!.intervalDays); }
    expect(seen).toEqual([21, 60, 150, 150, 150]);
  });
  it('Mơ hồ giữ khoảng hiện tại', () => {
    const x = applyReview(p({ learnStatus: 'understood', review: { intervalDays: 21, dueAt: '2026-10-14' } }), 'fuzzy', '2026-10-14', 'now');
    expect(x.review).toEqual({ intervalDays: 21, dueAt: '2026-11-04' });
  });
  it('Quên → về Đang học, bỏ tick tự kiểm tra, ôn lại sau 7 ngày', () => {
    const x = applyReview(p({ learnStatus: 'understood', checklist: { selfTest: true, experiment: true, ownWords: true }, review: { intervalDays: 60, dueAt: '2026-10-14' } }), 'forgot', '2026-10-14', 'now');
    expect(x.learnStatus).toBe('learning');
    expect(x.checklist.selfTest).toBe(false);
    expect(x.review).toEqual({ intervalDays: 7, dueAt: '2026-10-21' });
  });
});

describe('gộp dữ liệu khi nhập', () => {
  const cur = { a: p({ note: 'cũ', updatedAt: '2026-10-10' }), b: p({ note: 'b', updatedAt: '2026-10-12' }) };
  const inc = { a: p({ note: 'mới', updatedAt: '2026-10-11' }), b: p({ note: 'b cũ hơn', updatedAt: '2026-10-01' }), c: p({ note: 'c', updatedAt: '2026-10-01' }) };
  it('Gộp: giữ bản sửa gần nhất', () => {
    const { next, overwritten } = mergeProgress(cur, inc, 'merge');
    expect(next.a.note).toBe('mới');
    expect(next.b.note).toBe('b');
    expect(next.c.note).toBe('c');
    expect(overwritten).toEqual(['a']);
  });
  it('Thay thế: lấy toàn bộ file, ghi nhận mọi chủ đề bị thay hoặc bỏ', () => {
    const { next, overwritten } = mergeProgress(cur, { c: inc.c }, 'replace');
    expect(Object.keys(next)).toEqual(['c']);
    expect(overwritten.sort()).toEqual(['a', 'b']);
  });
});

describe('đổi id và xóa chủ đề', () => {
  it('id cũ trong previousIds chuyển sang id mới; id mất hẳn vào mồ côi', () => {
    const r = reconcileIds({ old: p({ note: 'x' }), gone: p({ note: 'y' }), keep: p() }, {}, new Set(['new', 'keep']), new Map([['old', 'new']]));
    expect(r.progress.new.note).toBe('x');
    expect(r.progress.old).toBeUndefined();
    expect(r.orphans.gone.note).toBe('y');
    expect(r.moved).toEqual([{ from: 'old', to: 'new' }]);
    expect(r.orphaned).toEqual(['gone']);
  });
  it('id mới đã có dữ liệu mới hơn: giữ bản mới, bản kia vào bản lưu tạm', () => {
    const r = reconcileIds({ old: p({ note: 'cũ', updatedAt: '2026-01-01' }), new: p({ note: 'mới', updatedAt: '2026-02-01' }) }, {}, new Set(['new']), new Map([['old', 'new']]));
    expect(r.progress.new.note).toBe('mới');
    expect(r.displaced.new.note).toBe('cũ');
  });
});

describe('file sao lưu', () => {
  const ok = { app: 'fullstack-mindmap', schemaVersion: 1, exportedAt: '2026-10-14T00:00:00Z', meta: { schemaVersion: 1, updatedAt: '2026-10-14T00:00:00Z' }, topics: { 'db-mvcc': p({ note: 'n' }) } };
  it('file hợp lệ được nhận', () => { expect(migrateBackup(ok).topics['db-mvcc'].note).toBe('n'); });
  it('file thiếu trường bị từ chối với thông báo cụ thể', () => {
    expect(() => migrateBackup({ ...ok, topics: { x: { note: 1 } } })).toThrow(/không hợp lệ/);
  });
  it('file của phiên bản mới hơn bị từ chối', () => {
    expect(() => migrateBackup({ ...ok, schemaVersion: SCHEMA_VERSION + 1 })).toThrow(/phiên bản mới hơn/);
  });
  it('không phải object thì báo lỗi', () => { expect(() => migrateBackup('abc')).toThrow(); });
  it('file sao lưu có currentStage được nhận', () => {
    const okWithStage = { ...ok, meta: { ...ok.meta, currentStage: 7 } };
    expect(migrateBackup(okWithStage).meta.currentStage).toBe(7);
  });
});

describe('chặng hiện tại', () => {
  it('đổi tuần cũ sang chặng mới', () => {
    const m: [number, number][] = [[0, 1], [1, 1], [15, 15], [16, 18], [17, 21], [18, 23], [19, 25], [20, 26], [21, 27], [22, 28], [23, 29], [24, 30], [25, 30]];
    for (const [w, s] of m) expect(stageFromLegacyWeek(w)).toBe(s);
  });
  it('ưu tiên currentStage, kẹp về tổng số chặng', () => {
    expect(currentStage({ currentStage: 5, startDate: '2020-01-01' }, '2026-10-29', 30)).toBe(5);
    expect(currentStage({ currentStage: 40 }, '2026-10-29', 30)).toBe(30);
  });
  it('chỉ có startDate: suy từ tuần cũ', () => {
    expect(currentStage({ startDate: '2026-10-15' }, '2026-10-29', 30)).toBe(3);
    expect(currentStage({ startDate: '2026-11-05' }, '2026-10-29', 30)).toBe(1);
    expect(currentStage({ startDate: '2026-01-01' }, '2026-10-29', 20)).toBe(20);
  });
  it('chưa có gì thì null', () => { expect(currentStage({}, '2026-10-29', 30)).toBeNull(); });
  it('meta giữ trường do bản app mới hơn thêm vào', () => {
    const r = MetaSchema.parse({ schemaVersion: 1, updatedAt: '2026-10-29T00:00:00Z', futureField: 'x' });
    expect((r as Record<string, unknown>).futureField).toBe('x');
  });
  it('currentStage hỏng chỉ bỏ trường đó', () => {
    for (const bad of [0, -2, 1.5, 'x']) {
      const r = MetaSchema.parse({ schemaVersion: 1, updatedAt: '2026-10-29T00:00:00Z', lastTopicId: 'db-mvcc', currentStage: bad });
      expect(r.currentStage).toBeUndefined();
      expect(r.lastTopicId).toBe('db-mvcc');
    }
  });
});

describe('tiến độ', () => {
  it('chủ đề Khung chỉ tính khi tuần học đã bắt đầu', () => {
    const info = (id: string) => ({ hasArticle: id === 'a', firstWeek: id === 'b' ? 3 : 10 });
    const prog = { a: p({ learnStatus: 'understood' }), b: p({ learnStatus: 'understood' }) };
    expect(progressOf(['a', 'b', 'c'], info, prog, 1)).toEqual({ total: 1, understood: 1 });
    expect(progressOf(['a', 'b', 'c'], info, prog, 3)).toEqual({ total: 2, understood: 2 });
    expect(progressOf(['a', 'b', 'c'], info, prog, 10)).toEqual({ total: 3, understood: 2 });
  });
});
