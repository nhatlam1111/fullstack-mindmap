/** Chuẩn hóa để tìm kiếm tiếng Việt có hoặc không dấu. */
export function normalizeVi(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
}
