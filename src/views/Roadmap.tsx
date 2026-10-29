import { useEffect, useRef } from 'react';
import { content } from '../content';
import { useWeek } from '../store/hooks';
import { actions, useData } from '../store/data';
import { TopicList } from '../components/TopicList';

export function Roadmap({ focus }: { focus?: number }) {
  const current = useWeek();
  const ready = useData((s) => s.ready);
  const autoScrolled = useRef(false);
  const scrollTo = (n: number) => document.getElementById(`week-${n}`)?.scrollIntoView({ block: 'start' });

  // link #wN: cuộn tới chặng N; không có thì cuộn tới chặng hiện tại một lần, không nhảy theo mỗi lần đổi chặng
  useEffect(() => { if (focus) scrollTo(focus); }, [focus]);
  useEffect(() => {
    if (focus || autoScrolled.current || current == null) return;
    autoScrolled.current = true;
    scrollTo(current);
  }, [focus, current]);

  return (
    <div className="page">
      <div>
        <h1 className="page-title">Lộ trình</h1>
        <p className="lede">Học theo tốc độ riêng: xong chặng nào thì chuyển sang chặng tiếp. Bài thực hành xuyên suốt là <a href="#learn-practice-case">hệ thống nghiên cứu thị trường game mobile</a>.</p>
      </div>
      {content.phases.map((ph) => (
        <section key={ph.id} aria-labelledby={`ph-${ph.id}`} style={{ display: 'grid', gap: 16 }}>
          <h2 id={`ph-${ph.id}`} className="phase-title">{ph.title} · chặng {ph.weeks[0]}{ph.weeks.length > 1 ? `–${ph.weeks[ph.weeks.length - 1]}` : ''}</h2>
          {ph.weeks.map((n) => {
            const w = content.weeks.find((x) => x.week === n)!;
            return (
              <div className="week" key={n} id={`week-${n}`} data-current={current === n} style={{ scrollMarginTop: 16 }}>
                <div className="week-num" aria-hidden="true">{String(n).padStart(2, '0')}</div>
                <article className="card" aria-labelledby={`wt-${n}`}>
                  <div className="eyebrow tabular">Chặng {n}{current === n ? ' · chặng hiện tại' : ''}</div>
                  <h3 id={`wt-${n}`} tabIndex={-1} style={{ fontSize: 'var(--fs-lg)' }}>{w.title}</h3>
                  <dl>
                    <dt>Mục tiêu</dt><dd>{w.goal}</dd>
                    <dt>Thực hành</dt><dd>{w.practice}</dd>
                    <dt>Mốc kiểm tra</dt><dd>{w.checkpoint}</dd>
                  </dl>
                  <TopicList ids={w.topics} showGroup />
                  {ready && current !== n && (
                    <div className="btn-row">
                      <button
                        className="btn" type="button" aria-describedby={`wt-${n}`}
                        onClick={() => { actions.setStage(n); document.getElementById(`wt-${n}`)?.focus({ preventScroll: true }); }}
                      >Học chặng này</button>
                    </div>
                  )}
                </article>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
