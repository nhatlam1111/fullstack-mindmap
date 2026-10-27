import path from 'node:path';
import type { Page } from '@playwright/test';

export const APP = 'file://' + path.resolve(import.meta.dirname, '../../dist/index.html');

/** Chặn font ngoài (môi trường test không có mạng) để trang tải nhanh và ổn định. */
export async function blockNetwork(page: Page) {
  await page.route(/^https?:\/\//, (r) => r.abort());
}

/** Runtime giả lập window.claude: db (lưu trong sessionStorage), user, downloads. */
export async function fakeClaude(page: Page, seed: Record<string, unknown> = {}) {
  await page.addInitScript((seedDocs) => {
    const KEY = 'fake-db';
    if (!sessionStorage.getItem(KEY)) sessionStorage.setItem(KEY, JSON.stringify(seedDocs));
    const fake = {
      docs: JSON.parse(sessionStorage.getItem(KEY) || '{}') as Record<string, unknown>,
      listeners: new Set<(s: unknown) => void>(),
      fail: 0,
      paths: [] as string[],
    };
    (window as unknown as { __fake: typeof fake }).__fake = fake;
    const snap = () => ({ docs: Object.entries(fake.docs).map(([id, d]) => ({ id, exists: true, data: () => d })) });
    const emit = () => { sessionStorage.setItem(KEY, JSON.stringify(fake.docs)); for (const l of fake.listeners) l(snap()); };
    (window as unknown as { claude: unknown }).claude = {
      use: async (name: string) => {
        if (name === 'user') return { id: async () => 'u_test' };
        if (name === 'downloads') return { save: async (r: { filename: string; data: string }) => { (window as unknown as { __saved: unknown }).__saved = r; return { status: 'saved' }; } };
        if (name === 'db') return {
          collection: (p: string) => ({
            doc: (id: string) => ({
              set: async (d: unknown) => {
                if (fake.fail > 0) { fake.fail--; throw { code: 'unavailable', message: 'offline' }; }
                fake.paths.push(p + '/' + id); fake.docs[id] = d; emit();
              },
              delete: async () => { delete fake.docs[id]; emit(); },
            }),
            onSnapshot: (next: (s: unknown) => void) => { fake.listeners.add(next); setTimeout(() => next(snap()), 0); return () => fake.listeners.delete(next); },
          }),
        };
        return null;
      },
    };
  }, seed);
}
