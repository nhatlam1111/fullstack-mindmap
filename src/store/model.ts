import { z } from 'zod';
import { addDays } from '../lib/dates';

export const SCHEMA_VERSION = 1;
export const REVIEW_LADDER = [7, 21, 60, 150] as const;

export type LearnStatus = 'none' | 'learning' | 'understood';
export type Checklist = { selfTest: boolean; experiment: boolean; ownWords: boolean };
export type TopicProgress = {
  learnStatus: LearnStatus;
  checklist: Checklist;
  note: string;
  review?: { intervalDays: number; dueAt: string };
  updatedAt: string;
};
export type Meta = {
  schemaVersion: number;
  startDate?: string;
  lastTopicId?: string;
  lastBackupAt?: string;
  updatedAt: string;
};
export type ProgressMap = Record<string, TopicProgress>;

export const emptyProgress = (now: string): TopicProgress => ({
  learnStatus: 'none',
  checklist: { selfTest: false, experiment: false, ownWords: false },
  note: '',
  updatedAt: now,
});

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const TopicProgressSchema = z.object({
  learnStatus: z.enum(['none', 'learning', 'understood']),
  checklist: z.object({ selfTest: z.boolean(), experiment: z.boolean(), ownWords: z.boolean() }),
  note: z.string().max(100_000),
  review: z.object({ intervalDays: z.number().int().positive(), dueAt: isoDay }).optional(),
  updatedAt: z.string().min(10),
});
export const MetaSchema = z.object({
  schemaVersion: z.number().int(),
  startDate: isoDay.optional(),
  lastTopicId: z.string().optional(),
  lastBackupAt: isoDay.optional(),
  updatedAt: z.string().min(10),
});

export const BackupSchema = z.object({
  app: z.literal('fullstack-mindmap'),
  schemaVersion: z.number().int().min(1),
  exportedAt: z.string().min(10),
  meta: MetaSchema,
  topics: z.record(TopicProgressSchema),
  orphans: z.record(TopicProgressSchema).default({}),
});
export type Backup = z.infer<typeof BackupSchema>;

/** Nâng dữ liệu từ phiên bản cũ lên SCHEMA_VERSION. Thêm một nhánh mỗi khi tăng phiên bản. */
export function migrateBackup(raw: unknown): Backup {
  const obj = raw as { schemaVersion?: number };
  if (!obj || typeof obj !== 'object') throw new Error('File không phải dữ liệu sao lưu của mindmap.');
  if (typeof obj.schemaVersion === 'number' && obj.schemaVersion > SCHEMA_VERSION) {
    throw new Error(`File được tạo bởi phiên bản mới hơn (schemaVersion ${obj.schemaVersion}). Hãy dùng bản app mới nhất.`);
  }
  // schemaVersion 1 là phiên bản đầu tiên; chưa có bước migrate nào.
  const parsed = BackupSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(`File sao lưu không hợp lệ: ${first.path.join('.') || '(gốc)'} — ${first.message}`);
  }
  return parsed.data;
}

export function checklistDone(c: Checklist) {
  return c.selfTest && c.experiment && c.ownWords;
}

export function isDue(p: TopicProgress | undefined, todayIso: string) {
  return !!p?.review && p.review.dueAt <= todayIso;
}

/** Đánh dấu Đã hiểu: hạn ôn đầu tiên sau 7 ngày. */
export function markUnderstood(p: TopicProgress, todayIso: string, now: string): TopicProgress {
  return { ...p, learnStatus: 'understood', review: { intervalDays: REVIEW_LADDER[0], dueAt: addDays(todayIso, REVIEW_LADDER[0]) }, updatedAt: now };
}

export type ReviewResult = 'clear' | 'fuzzy' | 'forgot';

export function applyReview(p: TopicProgress, result: ReviewResult, todayIso: string, now: string): TopicProgress {
  const current = p.review?.intervalDays ?? REVIEW_LADDER[0];
  if (result === 'forgot') {
    return {
      ...p,
      learnStatus: 'learning',
      checklist: { ...p.checklist, selfTest: false },
      review: { intervalDays: REVIEW_LADDER[0], dueAt: addDays(todayIso, REVIEW_LADDER[0]) },
      updatedAt: now,
    };
  }
  if (result === 'fuzzy') {
    return { ...p, review: { intervalDays: current, dueAt: addDays(todayIso, current) }, updatedAt: now };
  }
  const idx = REVIEW_LADDER.findIndex((x) => x > current);
  const next = idx === -1 ? REVIEW_LADDER[REVIEW_LADDER.length - 1] : REVIEW_LADDER[idx];
  return { ...p, review: { intervalDays: next, dueAt: addDays(todayIso, next) }, updatedAt: now };
}

export type MergeMode = 'replace' | 'merge';

/**
 * Kết hợp dữ liệu hiện có với dữ liệu nhập vào.
 * Trả về trạng thái mới và danh sách chủ đề bị ghi đè (để lưu bản hoàn tác).
 */
export function mergeProgress(current: ProgressMap, incoming: ProgressMap, mode: MergeMode) {
  const next: ProgressMap = mode === 'replace' ? {} : { ...current };
  const overwritten: string[] = [];
  if (mode === 'replace') {
    for (const id of Object.keys(current)) if (!(id in incoming)) overwritten.push(id);
  }
  for (const [id, inc] of Object.entries(incoming)) {
    const cur = current[id];
    if (mode === 'merge' && cur && cur.updatedAt >= inc.updatedAt) continue;
    if (cur) overwritten.push(id);
    next[id] = inc;
  }
  return { next, overwritten: [...new Set(overwritten)] };
}

/**
 * Đưa dữ liệu học về đúng id chủ đề hiện tại.
 * - id cũ có trong previousIds của một chủ đề → chuyển sang id mới (giữ bản mới hơn nếu cả hai cùng có).
 * - id không còn tồn tại → chuyển vào orphans, không bao giờ xóa.
 */
export function reconcileIds(
  progress: ProgressMap,
  orphans: ProgressMap,
  topicIds: Set<string>,
  previousIdMap: Map<string, string>,
) {
  const next: ProgressMap = { ...progress };
  const nextOrphans: ProgressMap = { ...orphans };
  const moved: { from: string; to: string }[] = [];
  const orphaned: string[] = [];
  const displaced: Record<string, TopicProgress> = {};
  for (const id of Object.keys(progress)) {
    if (topicIds.has(id)) continue;
    const target = previousIdMap.get(id);
    const p = progress[id];
    delete next[id];
    if (target && topicIds.has(target)) {
      const existing = next[target];
      if (!existing || existing.updatedAt < p.updatedAt) {
        if (existing) displaced[target] = existing;
        next[target] = p;
      } else {
        displaced[target] = p;
      }
      moved.push({ from: id, to: target });
    } else {
      nextOrphans[id] = p;
      orphaned.push(id);
    }
  }
  return { progress: next, orphans: nextOrphans, moved, orphaned, displaced };
}

/** Tiến độ của một tập chủ đề. Chủ đề Khung chỉ tính khi tuần học của nó đã bắt đầu. */
export function progressOf(
  ids: string[],
  info: (id: string) => { hasArticle: boolean; firstWeek: number },
  progress: ProgressMap,
  week: number | null,
) {
  let total = 0;
  let understood = 0;
  for (const id of ids) {
    const t = info(id);
    const counts = t.hasArticle || (week != null && week >= t.firstWeek);
    if (!counts) continue;
    total++;
    if (progress[id]?.learnStatus === 'understood') understood++;
  }
  return { total, understood };
}
