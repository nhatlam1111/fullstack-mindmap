import { describe, it, expect, beforeEach } from 'vitest';
import { useData, actions, viewDocs, selectProgress, __resetForTests, __setBackendForTests, __flushNow } from '../../src/store/data';
import type { Backend, Docs } from '../../src/store/backend';

class FakeBackend implements Backend {
  readonly mode = 'db' as const;
  docs: Docs = {};
  failNext = 0;
  writes: string[] = [];
  private l?: (d: Docs) => void;
  subscribe(next: (d: Docs) => void) { this.l = next; next({ ...this.docs }); return () => {}; }
  emit() { this.l?.({ ...this.docs }); }
  async write(id: string, data: Record<string, unknown>) {
    if (this.failNext > 0) { this.failNext--; throw { code: 'unavailable', message: 'mất mạng' }; }
    this.writes.push(id); this.docs = { ...this.docs, [id]: data }; this.emit();
  }
  async remove(id: string) { const d = { ...this.docs }; delete d[id]; this.docs = d; this.emit(); }
}

const progress = () => selectProgress(viewDocs(useData.getState()));

describe('đồng bộ kho dữ liệu', () => {
  let b: FakeBackend;
  beforeEach(() => { __resetForTests(); b = new FakeBackend(); __setBackendForTests(b); });

  it('thay đổi hiện ngay, rồi được ghi lên kho', async () => {
    actions.setChecklist('db-mvcc', 'selfTest', true);
    expect(progress()['db-mvcc'].checklist.selfTest).toBe(true);
    expect(useData.getState().status).toBe('pending');
    await __flushNow();
    expect(b.docs['t.db-mvcc']).toBeTruthy();
    expect(useData.getState().queue).toEqual({});
    expect(useData.getState().status).toBe('synced');
  });

  it('mất kết nối: thay đổi nằm lại trong hàng chờ, gửi lại sau', async () => {
    b.failNext = 1;
    actions.setChecklist('db-mvcc', 'ownWords', true);
    await __flushNow();
    expect(useData.getState().status).toBe('offline');
    expect(Object.keys(useData.getState().queue)).toEqual(['t.db-mvcc']);
    await __flushNow();
    expect(useData.getState().queue).toEqual({});
    expect((b.docs['t.db-mvcc'] as { checklist: { ownWords: boolean } }).checklist.ownWords).toBe(true);
  });

  it('thiết bị khác đã sửa mới hơn: giữ bản trên kho, bản ở đây vào bản lưu tạm', async () => {
    b.failNext = 1;
    actions.setNote('db-mvcc', 'ghi ở máy này');
    useData.setState((s) => ({ queue: Object.fromEntries(Object.entries(s.queue).map(([k, v]) => [k, { ...v, readyAt: 0 }])) }));
    await __flushNow();
    b.docs = { ...b.docs, 't.db-mvcc': { learnStatus: 'learning', checklist: { selfTest: false, experiment: false, ownWords: false }, note: 'ghi ở điện thoại', updatedAt: '2999-01-01T00:00:00.000Z' } };
    b.emit();
    await __flushNow();
    expect((b.docs['t.db-mvcc'] as { note: string }).note).toBe('ghi ở điện thoại');
    expect((b.docs['undo.db-mvcc'] as { data: { note: string } }).data.note).toBe('ghi ở máy này');
  });

  it('thiết bị khác sửa nhưng bản ở đây mới hơn: ghi bản ở đây, bản kia vào bản lưu tạm', async () => {
    b.failNext = 1;
    b.docs = { 't.db-mvcc': { learnStatus: 'learning', checklist: { selfTest: false, experiment: false, ownWords: false }, note: 'bản gốc', updatedAt: '2000-01-01T00:00:00.000Z' } };
    b.emit();
    actions.setChecklist('db-mvcc', 'experiment', true);
    await __flushNow();
    b.docs = { ...b.docs, 't.db-mvcc': { learnStatus: 'learning', checklist: { selfTest: false, experiment: false, ownWords: false }, note: 'điện thoại sửa', updatedAt: '2000-06-01T00:00:00.000Z' } };
    b.emit();
    await __flushNow();
    expect((b.docs['t.db-mvcc'] as { checklist: { experiment: boolean } }).checklist.experiment).toBe(true);
    expect((b.docs['undo.db-mvcc'] as { data: { note: string } }).data.note).toBe('điện thoại sửa');
  });

  it('nhập file rồi hoàn tác trả lại dữ liệu cũ', async () => {
    actions.setChecklist('db-mvcc', 'selfTest', true);
    await __flushNow();
    const incoming = { 'db-mvcc': { learnStatus: 'learning' as const, checklist: { selfTest: false, experiment: false, ownWords: false }, note: 'từ file', updatedAt: '2999-01-01T00:00:00.000Z' } };
    actions.importBackup(incoming, { schemaVersion: 1, updatedAt: 'x' }, 'merge');
    await __flushNow();
    expect(progress()['db-mvcc'].note).toBe('từ file');
    expect(actions.undoImport()).toBe(1);
    await __flushNow();
    expect(progress()['db-mvcc'].note).toBe('');
    expect(progress()['db-mvcc'].checklist.selfTest).toBe(true);
  });

  it('dữ liệu của chủ đề không còn tồn tại được chuyển vào mồ côi', async () => {
    b.docs = { 't.chu-de-da-xoa': { learnStatus: 'learning', checklist: { selfTest: false, experiment: false, ownWords: false }, note: 'đừng mất', updatedAt: '2026-01-01' } };
    b.emit();
    await __flushNow();
    expect(b.docs['t.chu-de-da-xoa']).toBeUndefined();
    expect((b.docs['orphan.chu-de-da-xoa'] as { note: string }).note).toBe('đừng mất');
  });
});
