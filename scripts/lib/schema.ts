import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'ngày phải có dạng YYYY-MM-DD');
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id chỉ gồm chữ thường, số và dấu gạch ngang');

export const Volatility = z.enum(['stable', 'slow', 'fast']);
export const ContentStatus = z.enum(['skeleton', 'draft', 'verified']);
/** research = nghiên cứu gốc do chính nhóm tác giả công bố (bài báo có đo đạc của họ). */
export const ExampleKind = z.enum(['public-case', 'official-doc', 'research', 'lab-run', 'practice-measurement']);

export const SourceSchema = z.object({
  id,
  url: z.string().url(),
  title: z.string().min(1).optional(),
  supports: z.string().min(1),
  product: z.string().min(1).optional(),
  version: z.string().min(1).optional(),
  checkedAt: isoDate,
}).strict();

export const ExampleSchema = z.object({
  id,
  kind: ExampleKind,
  title: z.string().min(1),
  url: z.string().url().optional(),
  path: z.string().min(1).optional(),
  checkedAt: isoDate,
}).strict().superRefine((ex, ctx) => {
  const needsUrl = ex.kind === 'public-case' || ex.kind === 'official-doc' || ex.kind === 'research';
  if (needsUrl && !ex.url) ctx.addIssue({ code: 'custom', message: `ví dụ ${ex.id} (${ex.kind}) cần url tới nguồn gốc` });
  if (!needsUrl && !ex.path) ctx.addIssue({ code: 'custom', message: `ví dụ ${ex.id} (${ex.kind}) cần path tới thư mục thử nghiệm` });
});

export const TopicFrontmatter = z.object({
  id,
  title: z.string().min(1),
  parent: id,
  summary: z.string().min(1),
  contentStatus: ContentStatus,
  volatility: Volatility,
  verifiedAt: isoDate.optional(),
  /** Ai chạy checklist kiểm chứng: Lam hay Claude. Bắt buộc với bài Đã kiểm chứng. */
  verifiedBy: z.enum(['lam', 'claude']).optional(),
  prerequisites: z.array(id).default([]),
  related: z.array(id).default([]),
  previousIds: z.array(id).default([]),
  sources: z.array(SourceSchema).default([]),
  examples: z.array(ExampleSchema).default([]),
  changelog: z.array(z.object({ date: isoDate, note: z.string().min(1) }).strict()).default([]),
}).strict();

export const BranchesFile = z.object({
  root: z.object({ id, title: z.string().min(1) }).strict(),
  branches: z.array(z.object({
    id,
    title: z.string().min(1),
    volatility: Volatility,
    groups: z.array(z.object({ id, title: z.string().min(1) }).strict()).min(1),
  }).strict()).min(1),
}).strict();

export const RoadmapFile = z.object({
  phases: z.array(z.object({ id, title: z.string().min(1), weeks: z.array(z.number().int()).min(1) }).strict()).min(1),
  weeks: z.array(z.object({
    week: z.number().int().min(1),
    title: z.string().min(1),
    goal: z.string().min(1),
    practice: z.string().min(1),
    checkpoint: z.string().min(1),
    topics: z.array(id).min(1),
  }).strict()).min(1),
}).strict();

export type TopicFrontmatterT = z.infer<typeof TopicFrontmatter>;
export type SourceT = z.infer<typeof SourceSchema>;
export type ExampleT = z.infer<typeof ExampleSchema>;

/** Bảy tiêu đề bắt buộc của khung bài học, đúng thứ tự. */
export const SECTIONS = [
  { key: 'problem', title: 'Vấn đề cần giải quyết' },
  { key: 'mechanism', title: 'Cơ chế và luồng hoạt động' },
  { key: 'tradeoffs', title: 'Điều kiện áp dụng, lợi ích và đánh đổi' },
  { key: 'pitfalls', title: 'Lỗi thường gặp và dấu hiệu nhận biết' },
  { key: 'examples', title: 'Ví dụ thực tế' },
  { key: 'selftest', title: 'Câu hỏi tự kiểm tra' },
  { key: 'related', title: 'Chủ đề liên quan và nguồn kiểm chứng' },
] as const;
export const DEEP_SECTION = 'Đào sâu';
export const NO_EXAMPLE = 'Chưa có ví dụ thực tế';

/** Hạn rà soát (tháng) theo độ ổn định. */
export const REVIEW_MONTHS = { stable: 12, slow: 6, fast: 3 } as const;
