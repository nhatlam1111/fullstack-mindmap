/** Ngày theo giờ máy người dùng, dạng YYYY-MM-DD. */
export function today(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const toUTC = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

export function addDays(iso: string, days: number): string {
  return new Date(toUTC(iso) + days * 864e5).toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((toUTC(toIso) - toUTC(fromIso)) / 864e5);
}

/** Tuần hiện tại của lộ trình (1–24), 0 nếu chưa bắt đầu, 25 nếu đã xong. */
export function currentWeek(startDate: string | undefined, todayIso: string): number | null {
  if (!startDate) return null;
  const d = daysBetween(startDate, todayIso);
  if (d < 0) return 0;
  return Math.min(25, Math.floor(d / 7) + 1);
}

export function weekRange(startDate: string, week: number) {
  const from = addDays(startDate, (week - 1) * 7);
  return { from, to: addDays(from, 6) };
}

export function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
