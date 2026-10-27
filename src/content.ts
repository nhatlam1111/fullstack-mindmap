import raw from './generated/content.json';
import type { ContentJson, CompiledTopic } from '../scripts/lib/compile';

export type Topic = CompiledTopic;
export type Content = ContentJson;

export const content = raw as unknown as Content;

export const topics = content.topics;
export const topicOrder = content.order;

export type GroupInfo = { id: string; title: string; branch: string; topics: string[] };
export const groups: Record<string, GroupInfo> = {};
for (const b of content.branches) for (const g of b.groups) groups[g.id] = { ...g, branch: b.id, topics: [] };
for (const id of topicOrder) groups[topics[id].parent]?.topics.push(id);

export const branchById = Object.fromEntries(content.branches.map((b) => [b.id, b]));

export function topicsOfBranch(branchId: string): string[] {
  return topicOrder.filter((id) => topics[id].branch === branchId);
}

export function hasArticle(t: Topic) {
  return t.contentStatus !== 'skeleton';
}

export const REVIEW_MONTHS = { stable: 12, slow: 6, fast: 3 } as const;

/** Ngày hết hạn rà soát nội dung, hoặc undefined nếu chưa kiểm chứng. */
export function reviewDueOf(t: Topic): string | undefined {
  if (!t.verifiedAt) return undefined;
  const [y, m, d] = t.verifiedAt.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + REVIEW_MONTHS[t.volatility], d)).toISOString().slice(0, 10);
}

export const VOLATILITY_LABEL = { stable: 'Ổn định', slow: 'Thay đổi chậm', fast: 'Thay đổi nhanh' } as const;
export const CONTENT_LABEL = { skeleton: 'Khung', draft: 'Nháp', verified: 'Đã kiểm chứng' } as const;
