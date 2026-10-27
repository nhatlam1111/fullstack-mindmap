import { useState } from 'react';
import { content, topics, topicsOfBranch, hasArticle } from '../content';
import { useMeta, useProgress, useWeek, useDueList } from '../store/hooks';
import { useData, actions } from '../store/data';
import { progressOf } from '../store/model';
import { today, weekRange, formatDay, daysBetween } from '../lib/dates';
import { TopicList } from '../components/TopicList';

export function Today() {
  const meta = useMeta();
  const week = useWeek();
  const progress = useProgress();
  const due = useDueList();
  const { status, localReason } = useData();
  const learning = Object.entries(progress)
    .filter(([id, p]) => topics[id] && p.learnStatus === 'learning')
    .sort((a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt))
    .map(([id]) => id).slice(0, 8);
  const last = meta.lastTopicId && topics[meta.lastTopicId] ? meta.lastTopicId : undefined;
  const hasData = Object.keys(progress).length > 0;
  const backupAge = meta.lastBackupAt ? daysBetween(meta.lastBackupAt, today()) : null;
  const needBackup = hasData && (backupAge === null || backupAge > 30);
  const wk = week && week >= 1 && week <= 24 ? content.weeks.find((w) => w.week === week) : undefined;

  return (
    <div className="page">
      <div>
        <h1 className="page-title">Hôm nay</h1>
        {wk && meta.startDate && (
          <p className="lede tabular">Tuần {wk.week}/24 · {formatDay(weekRange(meta.startDate, wk.week).from)} – {formatDay(weekRange(meta.startDate, wk.week).to)}</p>
        )}
      </div>

      {status === 'local' && <LocalNotice reason={localReason} />}

      {!meta.startDate && <StartDateCard />}
      {week === 0 && meta.startDate && (
        <div className="notice info"><strong>Sắp bắt đầu.</strong><span>Tuần 1 bắt đầu ngày {formatDay(meta.startDate)}.</span></div>
      )}
      {week === 25 && <div className="notice info"><strong>Đã qua 24 tuần.</strong><span>Xem lại bài tổng hợp cuối kỳ và rà soát toàn bộ mindmap.</span></div>}

      {wk && (
        <section className="card" aria-labelledby="this-week">
          <div className="eyebrow">Tuần này</div>
          <h2 id="this-week">{wk.title}</h2>
          <p className="muted">{wk.goal}</p>
          <p className="small"><strong>Thực hành:</strong> {wk.practice}</p>
          <p className="small"><strong>Mốc kiểm tra:</strong> {wk.checkpoint}</p>
          <TopicList ids={wk.topics} />
          <a className="btn" href={`#w${wk.week}`}>Mở trong lộ trình</a>
        </section>
      )}

      <div className="grid-2">
        <section className="card" aria-labelledby="due-h">
          <div className="eyebrow">Cần ôn</div>
          <h2 id="due-h" className="tabular">{due.length ? `${due.length} chủ đề đến hạn` : 'Không có bài đến hạn'}</h2>
          {due.length > 0
            ? <><TopicList ids={due.slice(0, 5)} /><a className="btn primary" href="#review">Ôn ngay</a></>
            : <p className="small muted">Chủ đề vào danh sách ôn sau khi bạn đánh dấu Đã hiểu.</p>}
        </section>
        <section className="card" aria-labelledby="cont-h">
          <div className="eyebrow">Tiếp tục</div>
          <h2 id="cont-h">{last ? topics[last].title : 'Chưa mở bài nào'}</h2>
          {last ? <a className="btn" href={'#' + last}>Mở lại bài</a> : <a className="btn" href="#tree">Chọn chủ đề</a>}
          {learning.length > 0 && <><div className="eyebrow">Đang học</div><TopicList ids={learning} /></>}
        </section>
      </div>

      <section className="card" aria-labelledby="prog-h">
        <div className="eyebrow">Tiến độ theo nhánh</div>
        <h2 id="prog-h" className="visually-hidden">Tiến độ theo nhánh</h2>
        <p className="small muted">Số chủ đề Đã hiểu trên số chủ đề đã có bài hoặc đã tới tuần học.</p>
        <BranchProgress week={week} />
      </section>

      {needBackup && (
        <div className="notice">
          <strong>Nhắc sao lưu.</strong>
          <span>{backupAge === null ? 'Bạn chưa xuất file sao lưu lần nào.' : `Lần sao lưu gần nhất cách đây ${backupAge} ngày.`} <a href="#data">Xuất file sao lưu</a></span>
        </div>
      )}
    </div>
  );
}

export function LocalNotice({ reason }: { reason: string | null }) {
  const text = reason === 'signed-out'
    ? 'Bạn chưa đăng nhập claude.ai nên dữ liệu học chỉ lưu trên trình duyệt này.'
    : 'Trang đang chạy ngoài claude.ai nên dữ liệu học chỉ lưu trên trình duyệt này và không đồng bộ sang thiết bị khác.';
  return <div className="notice"><strong>Chế độ cục bộ.</strong><span>{text}</span></div>;
}

function StartDateCard() {
  const [d, setD] = useState(today());
  return (
    <section className="card" aria-labelledby="start-h">
      <div className="eyebrow">Bắt đầu lộ trình</div>
      <h2 id="start-h">Chọn ngày bắt đầu tuần 1</h2>
      <p className="small muted">Ngày này dùng để biết bạn đang ở tuần nào trong 24 tuần. Đổi lại được ở mục Dữ liệu học.</p>
      <div className="btn-row">
        <label className="visually-hidden" htmlFor="start-date">Ngày bắt đầu</label>
        <input id="start-date" className="input" type="date" value={d} onChange={(e) => setD(e.target.value)} />
        <button className="btn primary" type="button" disabled={!d} onClick={() => actions.setStartDate(d)}>Bắt đầu</button>
      </div>
    </section>
  );
}

function BranchProgress({ week }: { week: number | null }) {
  const progress = useProgress();
  const info = (id: string) => ({ hasArticle: hasArticle(topics[id]), firstWeek: Math.min(...(topics[id].weeks.length ? topics[id].weeks : [99])) });
  return (
    <ul className="topic-list">
      {content.branches.map((b) => {
        const ids = topicsOfBranch(b.id);
        const { total, understood } = progressOf(ids, info, progress, week);
        const pct = total ? Math.round((understood / total) * 100) : 0;
        return (
          <li key={b.id}>
            <div className="row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 120px 64px', gap: 12 }}>
              <span className="title">{b.title}</span>
              <span className="progress" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
              <span className="meta tabular" aria-label={total ? `${understood} trên ${total} chủ đề đã hiểu` : 'Chưa tới tuần học'}>{total ? `${understood}/${total}` : '—'}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
