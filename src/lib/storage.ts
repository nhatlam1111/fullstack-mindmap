/** localStorage có thể trống hoặc ném lỗi trong một số ngữ cảnh; mọi truy cập đều qua đây. */
export const safeStorage = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = window.localStorage.getItem(key);
      return v == null ? fallback : (JSON.parse(v) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown): boolean {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key: string) {
    try { window.localStorage.removeItem(key); } catch { /* bỏ qua */ }
  },
};
