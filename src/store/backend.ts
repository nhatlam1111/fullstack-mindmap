/**
 * Hai nơi lưu dữ liệu học:
 * - DbBackend: kho dữ liệu của artifact trên claude.ai, vùng riêng data/users/<id>/ của tài khoản.
 * - LocalBackend: localStorage, khi trang không chạy trong claude.ai hoặc chưa đăng nhập.
 * Tên document trong vùng riêng:
 *   meta · t.<topicId> · undo.<topicId> · undoinfo · orphan.<topicId>
 */
import { safeStorage } from '../lib/storage';

export type Docs = Record<string, Record<string, unknown>>;
export type BackendError = { code: string; message: string };
export type Unsub = () => void;

export interface Backend {
  readonly mode: 'db' | 'local';
  subscribe(next: (docs: Docs) => void, error: (e: BackendError) => void): Unsub;
  write(docId: string, data: Record<string, unknown>): Promise<void>;
  remove(docId: string): Promise<void>;
}

type DbDoc = { id: string; exists: boolean; data(): Record<string, unknown> | undefined };
type DbQuerySnap = { docs: DbDoc[] };
type DbDocRef = {
  set(d: Record<string, unknown>): Promise<void>;
  delete(): Promise<void>;
};
type DbCollection = {
  doc(id: string): DbDocRef;
  onSnapshot(next: (s: DbQuerySnap) => void, error?: (e: BackendError) => void): Unsub;
};
export type DbLike = { collection(path: string): DbCollection };
export type UserLike = { id(): Promise<string | null> };

export class DbBackend implements Backend {
  readonly mode = 'db' as const;
  private col: DbCollection;
  constructor(db: DbLike, uid: string) {
    this.col = db.collection(`data/users/${uid}`);
  }
  subscribe(next: (docs: Docs) => void, error: (e: BackendError) => void): Unsub {
    return this.col.onSnapshot((snap) => {
      const docs: Docs = {};
      for (const d of snap.docs) if (d.exists) docs[d.id] = { ...(d.data() ?? {}) };
      next(docs);
    }, error);
  }
  write(docId: string, data: Record<string, unknown>) {
    return this.col.doc(docId).set(data);
  }
  remove(docId: string) {
    return this.col.doc(docId).delete();
  }
}

const LOCAL_KEY = 'fsmap:local:v1';

export class LocalBackend implements Backend {
  readonly mode = 'local' as const;
  private listeners = new Set<(docs: Docs) => void>();
  private docs: Docs = safeStorage.get<Docs>(LOCAL_KEY, {});
  subscribe(next: (docs: Docs) => void): Unsub {
    this.listeners.add(next);
    queueMicrotask(() => next({ ...this.docs }));
    return () => this.listeners.delete(next);
  }
  private emit() {
    safeStorage.set(LOCAL_KEY, this.docs);
    for (const l of this.listeners) l({ ...this.docs });
  }
  async write(docId: string, data: Record<string, unknown>) {
    this.docs = { ...this.docs, [docId]: data };
    this.emit();
  }
  async remove(docId: string) {
    const next = { ...this.docs };
    delete next[docId];
    this.docs = next;
    this.emit();
  }
}

type ClaudeWindow = { claude?: { use(name: string): Promise<unknown> } };

/** Kết nối kho dữ liệu nếu có; null nếu trang không chạy trong claude.ai, chưa đăng nhập hoặc không được cấp quyền. */
export async function connectDb(): Promise<{ backend: DbBackend } | { reason: 'no-runtime' | 'no-db' | 'signed-out' }> {
  const claude = (window as unknown as ClaudeWindow).claude;
  if (!claude?.use) return { reason: 'no-runtime' };
  const [db, user] = await Promise.all([
    claude.use('db') as Promise<DbLike | null>,
    claude.use('user') as Promise<UserLike | null>,
  ]);
  if (!db) return { reason: 'no-db' };
  const uid = user ? await user.id() : null;
  if (!uid) return { reason: 'signed-out' };
  return { backend: new DbBackend(db, uid) };
}

type DownloadsLike = { save(r: { filename: string; data: string | Blob }): Promise<{ status: string }> };

export async function getDownloads(): Promise<DownloadsLike | null> {
  const claude = (window as unknown as ClaudeWindow).claude;
  if (!claude?.use) return null;
  return (await claude.use('downloads')) as DownloadsLike | null;
}
