/**
 * Báo cáo rà soát hằng tuần: danh sách link nguồn cần kiểm tra và các bài Đã kiểm chứng quá hạn rà soát.
 * In JSON để scheduled task (hoặc bạn) đọc rồi kiểm tra từng link.
 */
import path from 'node:path';
import { loadContent } from './lib/content';
import { REVIEW_MONTHS } from './lib/schema';
import { todayVN } from './today';

const root = path.resolve(import.meta.dirname, '..');
const today = todayVN();
const loaded = loadContent(root);
const addMonths = (d: string, m: number) => { const [y, mo, da] = d.split('-').map(Number); return new Date(Date.UTC(y, mo - 1 + m, da)).toISOString().slice(0, 10); };
const links = new Map<string, string[]>();
const overdue: { id: string; verifiedAt: string; due: string; volatility: string }[] = [];
for (const t of loaded.topics) {
  for (const s of t.fm.sources) links.set(s.url, [...(links.get(s.url) ?? []), t.fm.id]);
  for (const e of t.fm.examples) if (e.url) links.set(e.url, [...(links.get(e.url) ?? []), t.fm.id]);
  if (t.fm.contentStatus === 'verified' && t.fm.verifiedAt) {
    const due = addMonths(t.fm.verifiedAt, REVIEW_MONTHS[t.fm.volatility]);
    if (due < today) overdue.push({ id: t.fm.id, verifiedAt: t.fm.verifiedAt, due, volatility: t.fm.volatility });
  }
}
console.log(JSON.stringify({ today, links: [...links].map(([url, topics]) => ({ url, topics: [...new Set(topics)] })), overdue }, null, 2));
