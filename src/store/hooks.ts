import { useMemo } from 'react';
import { useData, viewDocs, selectProgress, selectMeta, selectOrphans, selectUndo } from './data';
import { today } from '../lib/dates';
import { isDue, currentStage, type TopicProgress } from './model';
import { content, topics } from '../content';

export function useDocs() {
  const remote = useData((s) => s.remote);
  const queue = useData((s) => s.queue);
  return useMemo(() => viewDocs({ remote, queue }), [remote, queue]);
}
export function useProgress() {
  const docs = useDocs();
  return useMemo(() => selectProgress(docs), [docs]);
}
export function useMeta() {
  const docs = useDocs();
  return useMemo(() => selectMeta(docs), [docs]);
}
export function useOrphans() {
  const docs = useDocs();
  return useMemo(() => selectOrphans(docs), [docs]);
}
export function useUndo() {
  const docs = useDocs();
  return useMemo(() => selectUndo(docs), [docs]);
}
/** Chặng hiện tại (tên giữ từ thời lộ trình theo tuần). */
export function useWeek() {
  const meta = useMeta();
  return currentStage(meta, today(), content.weeks.length);
}

export type DisplayStatus = 'none' | 'learning' | 'understood' | 'due';
export function displayStatus(p: TopicProgress | undefined, todayIso = today()): DisplayStatus {
  if (!p) return 'none';
  if (isDue(p, todayIso)) return 'due';
  return p.learnStatus;
}
export const STATUS_LABEL: Record<DisplayStatus, string> = {
  none: 'Chưa học', learning: 'Đang học', understood: 'Đã hiểu', due: 'Cần ôn',
};

export function useDueList() {
  const progress = useProgress();
  return useMemo(() => {
    const t = today();
    return Object.entries(progress)
      .filter(([id, p]) => topics[id] && isDue(p, t))
      .sort((a, b) => a[1].review!.dueAt.localeCompare(b[1].review!.dueAt))
      .map(([id]) => id);
  }, [progress]);
}
