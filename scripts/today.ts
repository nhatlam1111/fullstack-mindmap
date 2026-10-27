/** Ngày hôm nay theo giờ Việt Nam (Asia/Saigon), dạng YYYY-MM-DD. */
export function todayVN(d = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Saigon' }).format(d);
}
