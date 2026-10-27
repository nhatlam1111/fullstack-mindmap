import MiniSearch from 'minisearch';
import { normalizeVi } from './normalize';
import { topics, groups, branchById } from '../content';

type Doc = { id: string; title: string; summary: string; text: string; note: string; path: string };

/** Index dựng ở trình duyệt từ nội dung bài và ghi chú; tìm có hoặc không dấu. */
export function buildIndex(notes: Record<string, string>) {
  const ms = new MiniSearch<Doc>({
    fields: ['title', 'summary', 'text', 'note'],
    storeFields: ['id'],
    processTerm: (term) => normalizeVi(term),
    searchOptions: { boost: { title: 4, summary: 2, note: 1.5 }, prefix: true, fuzzy: 0.15, combineWith: 'AND' },
  });
  ms.addAll(Object.values(topics).map((t) => ({
    id: t.id,
    title: t.title,
    summary: t.summary,
    text: t.text,
    note: notes[t.id] ?? '',
    path: `${branchById[t.branch]?.title} › ${groups[t.parent]?.title}`,
  })));
  return ms;
}

export function search(ms: MiniSearch<Doc>, q: string, limit = 20): string[] {
  if (!q.trim()) return [];
  let res = ms.search(q);
  if (res.length === 0) res = ms.search(q, { combineWith: 'OR' });
  return res.slice(0, limit).map((r) => String(r.id));
}
