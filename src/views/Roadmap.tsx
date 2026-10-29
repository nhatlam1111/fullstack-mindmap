import { useEffect } from 'react';
import { content } from '../content';
import { useWeek } from '../store/hooks';
import { actions, useData } from '../store/data';
import { TopicList } from '../components/TopicList';

export function Roadmap({ focus }: { focus?: number }) {
  const current = useWeek();
  const ready = useData((s) => s.ready);
  const target = focus ?? current ?? undefined;

  useEffect(() => {
    if (!target) return;
    const el = document.getElementById(`week-${target}`);
    el?.scrollIntoView({ block: 'start' });
  }, [target]);

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
                  <h3 id={`wt-${n}`} style={{ fontSize: 'var(--fs-lg)' }}>{w.title}</h3>
                  <dl>
                    <dt>Mục tiêu</dt><dd>{w.goal}</dd>
                    <dt>Thực hành</dt><dd>{w.practice}</dd>
                    <dt>Mốc kiểm tra</dt><dd>{w.checkpoint}</dd>
                  </dl>
                  <TopicList ids={w.topics} showGroup />
                  {ready && current !== n && (
                    <div className="btn-row">
                      <button className="btn" type="button" onClick={() => actions.setStage(n)}>Học chặng này</button>
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
