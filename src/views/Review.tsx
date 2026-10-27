import { useState } from 'react';
import { topics } from '../content';
import { useDueList, useProgress } from '../store/hooks';
import { actions } from '../store/data';
import { formatDay } from '../lib/dates';
import { REVIEW_LADDER, type ReviewResult } from '../store/model';

export function Review() {
  const due = useDueList();
  const progress = useProgress();
  const [revealed, setRevealed] = useState<string | null>(null);
  const batch = due.slice(0, 5);
  const current = batch[0];

  const upcoming = Object.entries(progress)
    .filter(([id, p]) => topics[id] && p.review)
    .sort((a, b) => a[1].review!.dueAt.localeCompare(b[1].review!.dueAt))[0];

  if (!current) {
    return (
      <div className="page">
        <h1 className="page-title">Ôn tập</h1>
        <div className="empty">
          Không có chủ đề nào đến hạn ôn.
          {upcoming ? <> Lần ôn tiếp theo: <a href={'#' + upcoming[0]}>{topics[upcoming[0]].title}</a>, ngày {formatDay(upcoming[1].review!.dueAt)}.</>
            : <> Chủ đề vào danh sách ôn 7 ngày sau khi bạn đánh dấu Đã hiểu.</>}
        </div>
      </div>
    );
  }

  const t = topics[current];
  const p = progress[current];
  const interval = p?.review?.intervalDays ?? REVIEW_LADDER[0];
  const nextClear = REVIEW_LADDER.find((x) => x > interval) ?? REVIEW_LADDER[REVIEW_LADDER.length - 1];
  const show = revealed === current;
  const answer = (r: ReviewResult) => { actions.review(current, r); setRevealed(null); };

  return (
    <div className="page">
      <div>
        <h1 className="page-title">Ôn tập</h1>
        <p className="lede tabular">{due.length} chủ đề đến hạn · mỗi lượt tối đa 5 · đang ôn 1/{batch.length}</p>
      </div>
      <section className="card" aria-labelledby="rv-title">
        <div className="eyebrow">Hạn ôn {formatDay(p!.review!.dueAt)}</div>
        <h2 id="rv-title">{t.title}</h2>
        <p className="small muted">Trả lời trong đầu hoặc ra giấy trước khi mở bài.</p>
        {t.selfTest.length > 0
          ? <ol className="review-q">{t.selfTest.map((q, i) => <li key={i}>{q}</li>)}</ol>
          : <p className="small">Bài chưa có câu hỏi tự kiểm tra. Hãy tự giải thích lại cơ chế và đánh đổi của chủ đề.</p>}
        <div className="btn-row">
          <button className="btn" type="button" aria-expanded={show} onClick={() => setRevealed(show ? null : current)}>{show ? 'Ẩn bài' : 'Hiện bài'}</button>
          <a className="btn" href={'#' + current}>Mở trang bài</a>
        </div>
        {show && (
          <div>
            {t.sections.filter((s) => s.key === 'mechanism' || s.key === 'tradeoffs').map((s) => (
              <div key={s.key}><div className="prose"><h2>{s.title}</h2></div><div className="prose" dangerouslySetInnerHTML={{ __html: s.html }} /></div>
            ))}
            {p?.note && <><div className="eyebrow">Ghi chú của bạn</div><p className="prose" style={{ whiteSpace: 'pre-wrap' }}>{p.note}</p></>}
          </div>
        )}
        <div className="review-actions" role="group" aria-label="Bạn nhớ bài này thế nào">
          <button className="btn" type="button" onClick={() => answer('clear')}>Nhớ rõ<small>ôn lại sau {nextClear} ngày</small></button>
          <button className="btn" type="button" onClick={() => answer('fuzzy')}>Mơ hồ<small>ôn lại sau {interval} ngày</small></button>
          <button className="btn" type="button" onClick={() => answer('forgot')}>Quên<small>về Đang học, ôn sau {REVIEW_LADDER[0]} ngày</small></button>
        </div>
      </section>
    </div>
  );
}
