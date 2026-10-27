import { useEffect, useRef, useState } from 'react';
import { topics, groups, branchById, reviewDueOf, VOLATILITY_LABEL, type Topic } from '../content';
import { useProgress, displayStatus } from '../store/hooks';
import { actions, useData } from '../store/data';
import { checklistDone, emptyProgress } from '../store/model';
import { today, formatDay } from '../lib/dates';
import { ContentChip, LearnChip } from './Status';
import { TopicList } from './TopicList';

const EXAMPLE_KIND = {
  'public-case': 'Case công khai',
  research: 'Nghiên cứu gốc',
  'official-doc': 'Tài liệu chính thức',
  'lab-run': 'Thử nghiệm chạy thật',
  'practice-measurement': 'Số đo bài thực hành',
} as const;

function Html({ html, className = 'prose' }: { html: string; className?: string }) {
  // HTML đã được sanitize lúc build (rehype-sanitize).
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function TopicArticle({ id, compact = false }: { id: string; compact?: boolean }) {
  const t = topics[id];
  useEffect(() => { actions.opened(id); }, [id]);
  if (!t) return null;
  return (
    <div className="article-layout">
      <article className="article" aria-labelledby={`h-${id}`}>
        <Header t={t} />
        {t.contentStatus === 'skeleton' ? <Skeleton t={t} /> : <Body t={t} />}
      </article>
      <aside className="learn-panel" aria-label="Học chủ đề này">
        <LearnPanel t={t} />
        {compact && null}
      </aside>
    </div>
  );
}

function Header({ t }: { t: Topic }) {
  const progress = useProgress();
  const due = reviewDueOf(t);
  const stale = t.contentStatus === 'verified' && due && due < today();
  return (
    <header className="article-head">
      <div className="crumbs">
        <span>{branchById[t.branch]?.title}</span><span aria-hidden="true">›</span><span>{groups[t.parent]?.title}</span>
      </div>
      <h1 id={`h-${t.id}`}>{t.title}</h1>
      <p className="summary">{t.summary}</p>
      <div className="chips">
        <LearnChip status={displayStatus(progress[t.id])} />
        <ContentChip topic={t} />
        <span className="chip" data-tone="outline">{VOLATILITY_LABEL[t.volatility]}</span>
        {t.weeks.map((w) => <a key={w} className="chip" data-tone="outline" href={`#w${w}`}>Tuần {w}</a>)}
        {t.verifiedAt && <span className="chip" data-tone="outline">{t.verifiedBy === 'claude' ? 'Claude kiểm chứng' : 'Bạn kiểm chứng'} {formatDay(t.verifiedAt)}</span>}
      </div>
      {stale && (
        <div className="notice draft-banner" role="note">
          <strong>Có thể đã cũ.</strong>
          <span>Bài quá hạn rà soát từ {formatDay(due!)}. Đối chiếu lại nguồn trước khi dựa vào các nhận định về sản phẩm.</span>
        </div>
      )}
      {t.contentStatus === 'draft' && (
        <div className="notice draft-banner" role="note">
          <strong>Nháp — chưa kiểm chứng.</strong>
          <span>Bài soạn từ các nguồn ở cuối bài nhưng chưa qua checklist kiểm chứng và vòng phản biện độc lập. Đọc với tinh thần kiểm tra, đối chiếu nguồn trước khi tin một nhận định.</span>
        </div>
      )}
    </header>
  );
}

function Skeleton({ t }: { t: Topic }) {
  return (
    <div className="prose">
      <div className="empty">
        Bài này chưa được viết. {t.weeks.length ? <>Theo lộ trình, nó sẽ được biên soạn vào <a href={`#w${t.weeks[0]}`}>tuần {t.weeks[0]}</a>.</> : null}
      </div>
      <Relations t={t} />
    </div>
  );
}

function Relations({ t }: { t: Topic }) {
  if (!t.prerequisites.length && !t.related.length) return null;
  return (
    <div className="rel-lists">
      {t.prerequisites.length > 0 && <div><div className="eyebrow">Cần học trước</div><TopicList ids={t.prerequisites} /></div>}
      {t.related.length > 0 && <div><div className="eyebrow">Có liên quan</div><TopicList ids={t.related} /></div>}
    </div>
  );
}

function Body({ t }: { t: Topic }) {
  return (
    <div>
      {t.sections.map((s) => (
        <section key={s.key + s.title} aria-label={s.title}>
          <div className="prose"><h2>{s.title}</h2></div>
          {s.html && <Html html={s.html} />}
          {s.key === 'examples' && t.examples.length > 0 && (
            <div className="examples">
              {t.examples.map((ex) => (
                <div className="example" key={ex.id}>
                  <div className="example-head">
                    <span className="chip" data-tone="outline">{EXAMPLE_KIND[ex.kind as keyof typeof EXAMPLE_KIND]}</span>
                    {ex.url
                      ? <a className="example-title" href={ex.url} target="_blank" rel="noopener noreferrer">{ex.title}</a>
                      : <span className="example-title">{ex.title}</span>}
                    <span className="muted small">đối chiếu {formatDay(ex.checkedAt)}</span>
                  </div>
                  {ex.html && (
                    <details>
                      <summary>Xem lệnh và kết quả thật{ex.path ? ` (${ex.path})` : ''}</summary>
                      <Html html={ex.html} />
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
          {s.key === 'related' && (
            <>
              <Relations t={t} />
              {t.sources.length > 0 && (
                <>
                  <div className="eyebrow" style={{ marginTop: 20 }}>Nguồn</div>
                  <ol className="sources">
                    {t.sources.map((src) => (
                      <li key={src.id}>
                        <span className="n">[{src.n}]</span>
                        <span>
                          <a href={src.url} target="_blank" rel="noopener noreferrer">{src.title ?? src.url}</a>
                          <span className="chips" style={{ margin: '4px 0' }}>
                            {src.product && <span className="chip" data-tone="outline">{src.product}{src.version ? ' ' + src.version : ''}</span>}
                            <span className="chip" data-tone="outline">đối chiếu {formatDay(src.checkedAt)}</span>
                          </span>
                          <span className="supports">{src.supports}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </>
          )}
        </section>
      ))}
      {t.deep && (
        <details className="deep">
          <summary>Đào sâu</summary>
          <Html html={t.deep} />
        </details>
      )}
      {t.changelog.length > 0 && (
        <div className="changelog">
          {t.changelog.map((c) => <div key={c.date + c.note}>{formatDay(c.date)} · {c.note}</div>)}
        </div>
      )}
    </div>
  );
}

function LearnPanel({ t }: { t: Topic }) {
  const progress = useProgress();
  const queue = useData((s) => s.queue);
  const p = progress[t.id] ?? emptyProgress('');
  const [note, setNote] = useState(p.note);
  const lastId = useRef(t.id);
  // đồng bộ ô ghi chú khi đổi bài hoặc khi thiết bị khác sửa
  useEffect(() => {
    if (lastId.current !== t.id) { lastId.current = t.id; setNote(p.note); return; }
    if (!queue['t.' + t.id]) setNote(p.note);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.id, p.note]);

  const hasArticle = t.contentStatus !== 'skeleton';
  const done = checklistDone(p.checklist);
  const canUnderstand = t.contentStatus === 'verified' && done && p.learnStatus !== 'understood';
  const pending = !!queue['t.' + t.id];

  if (!hasArticle) {
    return (
      <div className="card">
        <div className="eyebrow">Ghi chú</div>
        <p className="small muted">Bài chưa có nội dung. Bạn vẫn ghi chú trước được.</p>
        <NoteBox id={t.id} note={note} setNote={setNote} pending={pending} />
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="eyebrow">Tiêu chí Đã hiểu</div>
        <label className="check" htmlFor={`c-self-${t.id}`}>
          <input id={`c-self-${t.id}`} type="checkbox" checked={p.checklist.selfTest}
            onChange={(e) => actions.setChecklist(t.id, 'selfTest', e.target.checked)} />
          <span>Trả lời được các câu hỏi tự kiểm tra mà không xem bài</span>
        </label>
        <label className="check" htmlFor={`c-exp-${t.id}`}>
          <input id={`c-exp-${t.id}`} type="checkbox" checked={p.checklist.experiment}
            onChange={(e) => actions.setChecklist(t.id, 'experiment', e.target.checked)} />
          <span>Chạy lại thử nghiệm trong lab hoặc đọc kỹ ví dụ thực tế, hoặc ghi lý do không cần</span>
        </label>
        <label className="check" htmlFor={`c-own-${t.id}`}>
          <input id={`c-own-${t.id}`} type="checkbox" checked={p.checklist.ownWords}
            onChange={(e) => actions.setChecklist(t.id, 'ownWords', e.target.checked)} />
          <span>Có ghi chú tự giải thích bằng lời của mình</span>
        </label>
        {p.learnStatus === 'understood' ? (
          <p className="small">
            Đã hiểu. {p.review && <>Lần ôn tiếp theo: <strong className="tabular">{formatDay(p.review.dueAt)}</strong>.</>}
          </p>
        ) : (
          <button className="btn primary" type="button" disabled={!canUnderstand} onClick={() => actions.markUnderstood(t.id)}>
            Đánh dấu Đã hiểu
          </button>
        )}
        {p.learnStatus !== 'understood' && t.contentStatus !== 'verified' && (
          <p className="small muted">Nút mở khi bài đã được kiểm chứng và đủ ba tiêu chí. Bài này đang là Nháp.</p>
        )}
        {p.learnStatus !== 'understood' && t.contentStatus === 'verified' && !done && (
          <p className="small muted">Tick đủ ba tiêu chí để mở nút.</p>
        )}
        {p.learnStatus === 'understood' && (
          <button className="btn" type="button" onClick={() => actions.setLearnStatus(t.id, 'learning')}>Chuyển về Đang học</button>
        )}
      </div>
      <div className="card">
        <div className="eyebrow">Ghi chú của bạn</div>
        <NoteBox id={t.id} note={note} setNote={setNote} pending={pending} />
      </div>
    </>
  );
}

function NoteBox({ id, note, setNote, pending }: { id: string; note: string; setNote: (s: string) => void; pending: boolean }) {
  const status = useData((s) => s.status);
  return (
    <>
      <label className="visually-hidden" htmlFor={`note-${id}`}>Ghi chú cho chủ đề này</label>
      <textarea id={`note-${id}`} className="note-box" value={note}
        placeholder="Giải thích lại bằng lời của bạn: vấn đề, cơ chế, đánh đổi…"
        onChange={(e) => { setNote(e.target.value); actions.setNote(id, e.target.value); }} />
      <div className="save-state" aria-live="polite">
        {pending ? (status === 'offline' ? 'Đang chờ kết nối để lưu…' : 'Đang lưu…') : note ? 'Đã lưu' : ''}
      </div>
    </>
  );
}
