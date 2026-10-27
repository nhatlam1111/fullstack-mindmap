import { create } from 'zustand';
import { safeStorage } from '../lib/storage';
import { today } from '../lib/dates';
import { topics } from '../content';
import {
  type Backend, type Docs, type BackendError, LocalBackend, connectDb,
} from './backend';
import {
  SCHEMA_VERSION, type Meta, type ProgressMap, type TopicProgress, type MergeMode, type ReviewResult,
  emptyProgress, markUnderstood, applyReview, mergeProgress, reconcileIds, TopicProgressSchema, MetaSchema,
} from './model';

const QUEUE_KEY = 'fsmap:queue:v1';
const CACHE_KEY = 'fsmap:cache:v1';
const NOTE_DEBOUNCE_MS = 1000;

/** base = updatedAt của bản trên kho lúc bắt đầu sửa; dùng để biết kho có bị thiết bị khác đổi trong lúc chờ không. */
type QueueItem = { data: Record<string, unknown> | null; at: number; readyAt: number; base: string };
type Queue = Record<string, QueueItem>;

export type SyncStatus = 'connecting' | 'local' | 'synced' | 'pending' | 'offline' | 'error';
export type LocalReason = 'no-runtime' | 'no-db' | 'signed-out' | null;

type UndoDoc = { savedAt: string; reason: 'import' | 'conflict' | 'rename'; data: TopicProgress | null };
type UndoInfo = { at: string; mode: MergeMode; topics: string[]; restoredAt?: string };

type State = {
  remote: Docs;
  queue: Queue;
  status: SyncStatus;
  localReason: LocalReason;
  error: string | null;
  ready: boolean;
};

export const useData = create<State>(() => ({
  remote: safeStorage.get<Docs>(CACHE_KEY, {}),
  queue: safeStorage.get<Queue>(QUEUE_KEY, {}),
  status: 'connecting',
  localReason: null,
  error: null,
  ready: false,
}));

let backend: Backend | null = null;
let flushing = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let retryDelay = 2000;

const nowIso = () => new Date().toISOString();

/** Dữ liệu hiển thị = dữ liệu từ kho + thay đổi đang chờ gửi. */
export function viewDocs(s: Pick<State, 'remote' | 'queue'>): Docs {
  const out: Docs = { ...s.remote };
  for (const [id, item] of Object.entries(s.queue)) {
    if (item.data === null) delete out[id];
    else out[id] = item.data;
  }
  return out;
}

export function selectProgress(docs: Docs): ProgressMap {
  const out: ProgressMap = {};
  for (const [id, d] of Object.entries(docs)) {
    if (!id.startsWith('t.')) continue;
    const parsed = TopicProgressSchema.safeParse(d);
    if (parsed.success) out[id.slice(2)] = parsed.data;
  }
  return out;
}

export function selectMeta(docs: Docs): Meta {
  const parsed = MetaSchema.safeParse(docs.meta);
  return parsed.success ? parsed.data : { schemaVersion: SCHEMA_VERSION, updatedAt: '1970-01-01T00:00:00.000Z' };
}

export function selectOrphans(docs: Docs): ProgressMap {
  const out: ProgressMap = {};
  for (const [id, d] of Object.entries(docs)) {
    if (!id.startsWith('orphan.')) continue;
    const parsed = TopicProgressSchema.safeParse(d);
    if (parsed.success) out[id.slice('orphan.'.length)] = parsed.data;
  }
  return out;
}

export function selectUndo(docs: Docs) {
  const items: { topicId: string; doc: UndoDoc }[] = [];
  for (const [id, d] of Object.entries(docs)) {
    if (id.startsWith('undo.')) items.push({ topicId: id.slice(5), doc: d as unknown as UndoDoc });
  }
  return { items, info: docs.undoinfo as unknown as UndoInfo | undefined };
}

function persistQueue(q: Queue) {
  safeStorage.set(QUEUE_KEY, q);
}

function enqueue(docId: string, data: Record<string, unknown> | null, debounce = false) {
  const at = Date.now();
  useData.setState((s) => {
    const base = s.queue[docId]?.base ?? updatedAtOf(s.remote[docId]);
    const queue = { ...s.queue, [docId]: { data, at, readyAt: debounce ? at + NOTE_DEBOUNCE_MS : at, base } };
    persistQueue(queue);
    return { queue, status: s.status === 'local' ? 'local' : s.status === 'error' ? 'error' : 'pending' };
  });
  scheduleFlush(debounce ? NOTE_DEBOUNCE_MS : 0);
}

function scheduleFlush(delay: number) {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => { flushTimer = null; void flush(); }, delay);
}

const updatedAtOf = (d: Record<string, unknown> | undefined) => (typeof d?.updatedAt === 'string' ? d.updatedAt : '');

async function flush() {
  if (!backend || flushing) return;
  flushing = true;
  try {
    for (;;) {
      const { queue, remote } = useData.getState();
      const now = Date.now();
      const entry = Object.entries(queue).find(([, it]) => it.readyAt <= now);
      if (!entry) {
        const waiting = Object.values(queue);
        if (waiting.length) scheduleFlush(Math.max(50, Math.min(...waiting.map((w) => w.readyAt)) - now));
        break;
      }
      const [docId, item] = entry;
      // Kho đã bị thiết bị khác đổi kể từ lúc bắt đầu sửa ở đây: giữ bản mới hơn, bản còn lại vào undo.<id>.
      const remoteDoc = remote[docId];
      const changedElsewhere = docId.startsWith('t.') && item.data && remoteDoc && updatedAtOf(remoteDoc) !== (item.base ?? '');
      if (changedElsewhere && updatedAtOf(remoteDoc) > updatedAtOf(item.data!)) {
        await backend.write('undo.' + docId.slice(2), { savedAt: nowIso(), reason: 'conflict', data: item.data });
      } else if (changedElsewhere) {
        await backend.write('undo.' + docId.slice(2), { savedAt: nowIso(), reason: 'conflict', data: remoteDoc });
        await backend.write(docId, item.data!);
      } else if (item.data === null) {
        await backend.remove(docId);
      } else {
        await backend.write(docId, item.data);
      }
      useData.setState((s) => {
        const q = { ...s.queue };
        if (q[docId]?.at === item.at) delete q[docId];
        persistQueue(q);
        return { queue: q, status: backend?.mode === 'local' ? 'local' : Object.keys(q).length ? 'pending' : 'synced', error: null };
      });
      retryDelay = 2000;
    }
  } catch (e) {
    const err = e as BackendError;
    if (err?.code === 'quota_exceeded') {
      useData.setState({ status: 'error', error: 'Kho dữ liệu đã đầy. Xuất file sao lưu rồi xóa bớt ghi chú mồ côi hoặc bản lưu tạm.' });
    } else if (err?.code === 'invalid_argument' || err?.code === 'transform_error') {
      useData.setState({ status: 'error', error: 'Kho dữ liệu từ chối ghi. Nếu bạn không phải chủ artifact này, dữ liệu học không lưu được.' });
    } else {
      useData.setState({ status: 'offline' });
      scheduleFlush(retryDelay + Math.random() * 1000);
      retryDelay = Math.min(60_000, retryDelay * 2);
    }
  } finally {
    flushing = false;
  }
}

function onRemote(docs: Docs) {
  safeStorage.set(CACHE_KEY, docs);
  useData.setState((s) => ({
    remote: docs,
    ready: true,
    status: backend?.mode === 'local' ? 'local' : Object.keys(s.queue).length ? (s.status === 'offline' ? 'offline' : 'pending') : 'synced',
  }));
  reconcile();
}

/** Chuyển dữ liệu của id đã đổi tên hoặc đã xóa, một lần sau mỗi snapshot. */
function reconcile() {
  const docs = viewDocs(useData.getState());
  const progress = selectProgress(docs);
  const ids = new Set(Object.keys(topics));
  const prev = new Map<string, string>();
  for (const t of Object.values(topics)) for (const old of t.previousIds) prev.set(old, t.id);
  const stale = Object.keys(progress).filter((id) => !ids.has(id));
  if (!stale.length) return;
  const r = reconcileIds(progress, selectOrphans(docs), ids, prev);
  for (const id of stale) enqueue('t.' + id, null);
  for (const { to } of r.moved) enqueue('t.' + to, r.progress[to] as unknown as Record<string, unknown>);
  for (const [to, p] of Object.entries(r.displaced)) enqueue('undo.' + to, { savedAt: nowIso(), reason: 'rename', data: p });
  for (const id of r.orphaned) enqueue('orphan.' + id, r.orphans[id] as unknown as Record<string, unknown>);
}

let started = false;
export async function startSync() {
  if (started) return;
  started = true;
  const res = await connectDb().catch(() => ({ reason: 'no-db' as const }));
  if ('backend' in res) {
    backend = res.backend;
    useData.setState({ status: Object.keys(useData.getState().queue).length ? 'pending' : 'connecting', localReason: null });
  } else {
    backend = new LocalBackend();
    useData.setState({ status: 'local', localReason: res.reason });
  }
  backend.subscribe(onRemote, (e) => {
    useData.setState({ status: 'error', error: e.code === 'revoked' ? 'Quyền truy cập kho dữ liệu đã bị thu hồi.' : 'Mất kết nối với kho dữ liệu. Tải lại trang để kết nối lại.' });
  });
  scheduleFlush(0);
  window.addEventListener('online', () => scheduleFlush(0));
}

/* ---------- thao tác của người dùng ---------- */

function currentProgress(topicId: string): TopicProgress {
  const docs = viewDocs(useData.getState());
  return selectProgress(docs)[topicId] ?? emptyProgress(nowIso());
}

function saveTopic(topicId: string, p: TopicProgress, debounce = false) {
  enqueue('t.' + topicId, p as unknown as Record<string, unknown>, debounce);
}

function saveMeta(patch: Partial<Meta>) {
  const meta = selectMeta(viewDocs(useData.getState()));
  const next = { ...meta, ...patch, schemaVersion: SCHEMA_VERSION, updatedAt: nowIso() };
  for (const k of Object.keys(next) as (keyof Meta)[]) if (next[k] === undefined) delete next[k];
  enqueue('meta', next as unknown as Record<string, unknown>);
}

export const actions = {
  /** Mở bài lần đầu: chuyển sang Đang học (chỉ với bài có nội dung). */
  opened(topicId: string) {
    const meta = selectMeta(viewDocs(useData.getState()));
    if (meta.lastTopicId !== topicId) saveMeta({ lastTopicId: topicId });
    const t = topics[topicId];
    if (!t || t.contentStatus === 'skeleton') return;
    const p = currentProgress(topicId);
    if (p.learnStatus === 'none') saveTopic(topicId, { ...p, learnStatus: 'learning', updatedAt: nowIso() });
  },
  setChecklist(topicId: string, key: keyof TopicProgress['checklist'], value: boolean) {
    const p = currentProgress(topicId);
    const learnStatus = p.learnStatus === 'none' ? 'learning' : p.learnStatus;
    saveTopic(topicId, { ...p, learnStatus, checklist: { ...p.checklist, [key]: value }, updatedAt: nowIso() });
  },
  setNote(topicId: string, note: string) {
    const p = currentProgress(topicId);
    const learnStatus = p.learnStatus === 'none' && note.trim() ? 'learning' : p.learnStatus;
    saveTopic(topicId, { ...p, learnStatus, note, updatedAt: nowIso() }, true);
  },
  setLearnStatus(topicId: string, status: 'none' | 'learning') {
    const p = currentProgress(topicId);
    saveTopic(topicId, { ...p, learnStatus: status, review: status === 'none' ? undefined : p.review, updatedAt: nowIso() });
  },
  markUnderstood(topicId: string) {
    saveTopic(topicId, markUnderstood(currentProgress(topicId), today(), nowIso()));
  },
  review(topicId: string, result: ReviewResult) {
    saveTopic(topicId, applyReview(currentProgress(topicId), result, today(), nowIso()));
  },
  setStartDate(date: string | undefined) {
    saveMeta({ startDate: date });
  },
  markBackedUp() {
    saveMeta({ lastBackupAt: today() });
  },
  /** Nhập dữ liệu: lưu bản hiện tại của mọi chủ đề bị ghi đè vào undo.<id> trước. */
  importBackup(incoming: ProgressMap, incomingMeta: Meta, mode: MergeMode, incomingOrphans: ProgressMap = {}) {
    const docs = viewDocs(useData.getState());
    const existingOrphans = selectOrphans(docs);
    for (const [id, p] of Object.entries(incomingOrphans)) {
      if (!existingOrphans[id]) enqueue('orphan.' + id, p as unknown as Record<string, unknown>);
    }
    const current = selectProgress(docs);
    const { next, overwritten } = mergeProgress(current, incoming, mode);
    const at = nowIso();
    const changed = new Set<string>(overwritten);
    for (const id of Object.keys(next)) if (!(id in current)) changed.add(id);
    for (const id of changed) enqueue('undo.' + id, { savedAt: at, reason: 'import', data: (current[id] ?? null) as unknown as Record<string, unknown> | null });
    enqueue('undoinfo', { at, mode, topics: [...changed] });
    for (const id of changed) {
      if (next[id]) saveTopic(id, next[id]);
      else enqueue('t.' + id, null);
    }
    const meta = selectMeta(docs);
    if (mode === 'replace') saveMeta({ startDate: incomingMeta.startDate, lastTopicId: incomingMeta.lastTopicId });
    else if (!meta.startDate && incomingMeta.startDate) saveMeta({ startDate: incomingMeta.startDate });
    return { changed: changed.size };
  },
  /** Hoàn tác lần nhập gần nhất. */
  undoImport() {
    const docs = viewDocs(useData.getState());
    const { items, info } = selectUndo(docs);
    if (!info || info.restoredAt) return 0;
    let n = 0;
    for (const id of info.topics) {
      const u = items.find((x) => x.topicId === id);
      if (!u || u.doc.savedAt !== info.at) continue;
      if (u.doc.data) saveTopic(id, { ...u.doc.data, updatedAt: nowIso() });
      else enqueue('t.' + id, null);
      n++;
    }
    enqueue('undoinfo', { ...info, restoredAt: nowIso() });
    return n;
  },
  /** Khôi phục một bản lưu tạm (do xung đột hoặc đổi tên). */
  restoreUndo(topicId: string) {
    const docs = viewDocs(useData.getState());
    const u = selectUndo(docs).items.find((x) => x.topicId === topicId);
    if (!u?.doc.data) return;
    const current = selectProgress(docs)[topicId];
    if (current) enqueue('undo.' + topicId, { savedAt: nowIso(), reason: 'conflict', data: current as unknown as Record<string, unknown> });
    else enqueue('undo.' + topicId, null);
    saveTopic(topicId, { ...u.doc.data, updatedAt: nowIso() });
  },
  discardUndo(topicId: string) {
    enqueue('undo.' + topicId, null);
  },
  discardOrphan(topicId: string) {
    enqueue('orphan.' + topicId, null);
  },
};

/** Chỉ dùng trong test. */
export function __resetForTests() {
  backend = null; started = false; flushing = false; retryDelay = 2000;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
  useData.setState({ remote: {}, queue: {}, status: 'connecting', localReason: null, error: null, ready: false });
}
export function __setBackendForTests(b: Backend) {
  backend = b;
  started = true;
  b.subscribe(onRemote, () => useData.setState({ status: 'error' }));
}
export function __flushNow() {
  return flush();
}
