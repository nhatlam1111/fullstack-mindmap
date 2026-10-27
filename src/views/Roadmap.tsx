import { useEffect } from 'react';
import { content } from '../content';
import { useMeta, useWeek } from '../store/hooks';
import { weekRange, formatDay } from '../lib/dates';
import { TopicList } from '../components/TopicList';

export function Roadmap({ focus }: { focus?: number }) {
  const meta = useMeta();
  const current = useWeek();
  const target = focus ?? (current && current >= 1 && current <= 24 ? current : undefined);

  useEffect(() => {
    if (!target) return;
    const el = document.getElementById(`week-${target}`);
    el?.scrollIntoView({ block: 'start' });
  }, [target]);

  return (
    <div className="page">
      <div>
        <h1 className="page-title">Lộ trình 24 tuần</h1>
        <p className="lede">6–8 giờ mỗi tuần. Bài thực hành xuyên suốt là <a href="#learn-practice-case">ứng dụng quản lý yêu cầu nội bộ</a>.</p>
      </div>
      {content.phases.map((ph) => (
        <section key={ph.id} aria-labelledby={`ph-${ph.id}`} style={{ display: 'grid', gap: 16 }}>
          <h2 id={`ph-${ph.id}`} className="phase-title">{ph.title} · tuần {ph.weeks[0]}{ph.weeks.length > 1 ? `–${ph.weeks[ph.weeks.length - 1]}` : ''}</h2>
          {ph.weeks.map((n) => {
            const w = content.weeks.find((x) => x.week === n)!;
            const range = meta.startDate ? weekRange(meta.startDate, n) : null;
            return (
              <div className="week" key={n} id={`week-${n}`} data-current={current === n} style={{ scrollMarginTop: 16 }}>
                <div className="week-num" aria-hidden="true">{String(n).padStart(2, '0')}</div>
                <article className="card" aria-labelledby={`wt-${n}`}>
                  <div className="eyebrow tabular">Tuần {n}{range ? ` · ${formatDay(range.from)} – ${formatDay(range.to)}` : ''}{current === n ? ' · tuần hiện tại' : ''}</div>
                  <h3 id={`wt-${n}`} style={{ fontSize: 'var(--fs-lg)' }}>{w.title}</h3>
                  <dl>
                    <dt>Mục tiêu</dt><dd>{w.goal}</dd>
                    <dt>Thực hành</dt><dd>{w.practice}</dd>
                    <dt>Mốc kiểm tra</dt><dd>{w.checkpoint}</dd>
                  </dl>
                  <TopicList ids={w.topics} showGroup />
                </article>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
