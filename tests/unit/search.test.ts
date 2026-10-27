import { describe, it, expect } from 'vitest';
import { normalizeVi } from '../../src/lib/normalize';
import { buildIndex, search } from '../../src/lib/search';

describe('tìm kiếm tiếng Việt', () => {
  it('bỏ dấu và đổi đ thành d', () => {
    expect(normalizeVi('Đồng thời ĐƯỜNG')).toBe('dong thoi duong');
  });
  const ms = buildIndex({ 'db-mvcc': 'ghi chú riêng về vacuum khẩn' });
  it('gõ không dấu tìm được tiêu đề có dấu, kể cả chữ đ', () => {
    expect(search(ms, 'xu ly dong thoi')).toContain('be-concurrency-models');
  });
  it('gõ có dấu vẫn tìm được', () => {
    expect(search(ms, 'Bảng, khóa')[0]).toBe('db-tables-keys-constraints');
  });
  it('tìm được trong nội dung bài', () => {
    expect(search(ms, 'wraparound')).toContain('db-mvcc');
  });
  it('tìm được trong ghi chú của người học', () => {
    expect(search(ms, 'vacuum khan')).toContain('db-mvcc');
  });
});
