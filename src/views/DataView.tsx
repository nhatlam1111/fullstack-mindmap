import { useRef, useState } from 'react';
import { content, topics, CONTENT_LABEL } from '../content';
import { useData, actions } from '../store/data';
import { useMeta, useProgress, useOrphans, useUndo } from '../store/hooks';
import { getDownloads } from '../store/backend';
import { migrateBackup, SCHEMA_VERSION, type Backup, type MergeMode } from '../store/model';
import { today, formatDay } from '../lib/dates';
import { LocalNotice } from './Today';

const STATUS_TEXT = {
  connecting: 'Đang kết nối kho dữ liệu…',
  local: 'Chỉ lưu trên trình duyệt này',
  synced: 'Đã đồng bộ với kho dữ liệu trên claude.ai',
  pending: 'Đang gửi thay đổi lên kho dữ liệu',
  offline: 'Mất kết nối — thay đổi được giữ lại và gửi khi có mạng',
  error: 'Lỗi kho dữ liệu',
} as const;

export function DataView() {
  const { status, error, localReason, queue } = useData();
  const meta = useMeta();
  const progress = useProgress();
  const orphans = useOrphans();
  const undo = useUndo();
  const notes = Object.values(progress).filter((p) => p.note.trim()).length;
  const pendingCount = Object.keys(queue).length;
  const counts = Object.values(topics).reduce<Record<string, number>>((a, t) => { a[t.contentStatus] = (a[t.contentStatus] ?? 0) + 1; return a; }, {});

  return (
    <div className="page">
      <div>
        <h1 className="page-title">Dữ liệu học</h1>
        <p className="lede">Trạng thái học, checklist, ghi chú và lịch ôn nằm trong vùng riêng của tài khoản bạn trong kho dữ liệu của artifact. Người khác mở cùng link không thấy dữ liệu này.</p>
      </div>
      {status === 'local' && <LocalNotice reason={localReason} />}
      {error && <div className="notice bad" role="alert"><strong>Lỗi.</strong><span>{error}</span></div>}

      <section className="card" aria-labelledby="sync-h">
        <h2 id="sync-h">Đồng bộ</h2>
        <dl className="kv">
          <dt>Trạng thái</dt><dd>{STATUS_TEXT[status]}</dd>
          <dt>Thay đổi chưa gửi</dt><dd className="tabular">{pendingCount}</dd>
          <dt>Chủ đề có dữ liệu học</dt><dd className="tabular">{Object.keys(progress).length} ({notes} có ghi chú)</dd>
          <dt>Sao lưu gần nhất</dt><dd>{meta.lastBackupAt ? formatDay(meta.lastBackupAt) : 'Chưa sao lưu'}</dd>
        </dl>
      </section>

      <StartDate current={meta.startDate} />
      <ExportCard />
      <ImportCard />

      {undo.info && !undo.info.restoredAt && (
        <section className="card" aria-labelledby="undo-h">
          <h2 id="undo-h">Hoàn tác lần nhập gần nhất</h2>
          <p className="small muted">Lần nhập lúc {new Date(undo.info.at).toLocaleString('vi-VN')} ({undo.info.mode === 'replace' ? 'thay thế' : 'gộp'}) đã thay đổi {undo.info.topics.length} chủ đề.</p>
          <UndoButton />
        </section>
      )}

      <ConflictCopies items={undo.items.filter((u) => u.doc.reason !== 'import' && u.doc.data)} />

      {Object.keys(orphans).length > 0 && (
        <section className="card" aria-labelledby="orph-h">
          <h2 id="orph-h">Ghi chú mồ côi</h2>
          <p className="small muted">Dữ liệu của các chủ đề đã bị xóa khỏi cây. Không bao giờ bị xóa tự động.</p>
          <ul className="topic-list">
            {Object.entries(orphans).map(([id, p]) => <OrphanRow key={id} id={id} note={p.note} />)}
          </ul>
        </section>
      )}

      <section className="card" aria-labelledby="ct-h">
        <h2 id="ct-h">Nội dung</h2>
        <dl className="kv">
          <dt>Bản publish</dt><dd>{new Date(content.builtAt).toLocaleString('vi-VN')}</dd>
          <dt>Chủ đề</dt><dd className="tabular">{Object.keys(topics).length} ({(['verified', 'draft', 'skeleton'] as const).map((k) => `${CONTENT_LABEL[k]}: ${counts[k] ?? 0}`).join(' · ')})</dd>
          <dt>Phiên bản dữ liệu</dt><dd className="tabular">schemaVersion {SCHEMA_VERSION}</dd>
        </dl>
      </section>
    </div>
  );
}

function StartDate({ current }: { current?: string }) {
  const [d, setD] = useState(current ?? today());
  return (
    <section className="card" aria-labelledby="sd-h">
      <h2 id="sd-h">Ngày bắt đầu lộ trình</h2>
      <div className="btn-row">
        <label className="visually-hidden" htmlFor="sd-input">Ngày bắt đầu tuần 1</label>
        <input id="sd-input" className="input" type="date" value={d} onChange={(e) => setD(e.target.value)} />
        <button className="btn" type="button" disabled={!d || d === current} onClick={() => actions.setStartDate(d)}>Lưu</button>
        {current && <span className="small muted">Đang dùng: {formatDay(current)}</span>}
      </div>
    </section>
  );
}

function buildBackup(): Backup {
  const s = useData.getState();
  const docs = { ...s.remote };
  for (const [id, it] of Object.entries(s.queue)) { if (it.data === null) delete docs[id]; else docs[id] = it.data; }
  const topicsOut: Backup['topics'] = {};
  const orphansOut: Backup['orphans'] = {};
  for (const [id, d] of Object.entries(docs)) {
    if (id.startsWith('t.')) topicsOut[id.slice(2)] = d as never;
    if (id.startsWith('orphan.')) orphansOut[id.slice(7)] = d as never;
  }
  const meta = (docs.meta as Backup['meta']) ?? { schemaVersion: SCHEMA_VERSION, updatedAt: new Date().toISOString() };
  return { app: 'fullstack-mindmap', schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), meta, topics: topicsOut, orphans: orphansOut };
}

function ExportCard() {
  const [msg, setMsg] = useState<string | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  const run = async () => {
    setMsg(null);
    const json = JSON.stringify(buildBackup(), null, 2);
    const filename = `fsmap-backup-${today()}.json`;
    const dl = await getDownloads().catch(() => null);
    if (!dl) { setFallback(json); setMsg('Trang không lưu file trực tiếp được ở đây. Sao chép nội dung bên dưới vào một file .json.'); return; }
    try {
      await dl.save({ filename, data: json });
      actions.markBackedUp();
      setMsg(`Đã lưu ${filename}.`);
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === 'declined') setMsg('Bạn đã hủy lưu file.');
      else if (code === 'rate_limited') setMsg('Đang có một hộp thoại lưu file mở. Đóng nó rồi thử lại.');
      else { setFallback(json); setMsg('Không lưu file được ở đây. Sao chép nội dung bên dưới vào một file .json.'); }
    }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(fallback ?? ''); actions.markBackedUp(); setMsg('Đã sao chép. Dán vào một file .json và cất ở nơi an toàn.'); }
    catch { setMsg('Không sao chép tự động được. Chọn toàn bộ nội dung trong ô rồi sao chép.'); }
  };
  return (
    <section className="card" aria-labelledby="ex-h">
      <h2 id="ex-h">Xuất file sao lưu</h2>
      <p className="small muted">Một file JSON chứa toàn bộ dữ liệu học. Nên xuất ít nhất mỗi 30 ngày.</p>
      <div className="btn-row"><button className="btn primary" type="button" onClick={run}>Xuất file sao lưu</button></div>
      {msg && <p className="small" role="status">{msg}</p>}
      {fallback && (
        <>
          <label className="visually-hidden" htmlFor="export-json">Nội dung file sao lưu</label>
          <textarea id="export-json" className="json-out" readOnly value={fallback} onFocus={(e) => e.currentTarget.select()} />
          <div className="btn-row"><button className="btn" type="button" onClick={copy}>Sao chép</button></div>
        </>
      )}
    </section>
  );
}

function ImportCard() {
  const progress = useProgress();
  const [parsed, setParsed] = useState<Backup | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<MergeMode>('merge');
  const [done, setDone] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (f: File | undefined) => {
    setErr(null); setParsed(null); setDone(null); setConfirming(false);
    if (!f) return;
    try {
      const text = await f.text();
      let raw: unknown;
      try { raw = JSON.parse(text); } catch { throw new Error('File không phải JSON hợp lệ.'); }
      setParsed(migrateBackup(raw));
    } catch (e) {
      setErr((e as Error).message);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const apply = () => {
    if (!parsed) return;
    const { changed } = actions.importBackup(parsed.topics, parsed.meta, mode, parsed.orphans);
    setDone(`Đã nhập: ${changed} chủ đề thay đổi. Bản trước khi nhập được giữ để hoàn tác.`);
    setParsed(null); setConfirming(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const incomingNotes = parsed ? Object.values(parsed.topics).filter((p) => p.note.trim()).length : 0;
  const unknown = parsed ? Object.keys(parsed.topics).filter((id) => !topics[id]).length : 0;

  return (
    <section className="card" aria-labelledby="im-h">
      <h2 id="im-h">Nhập file sao lưu</h2>
      <p className="small muted">File được kiểm tra trước; file lỗi không làm thay đổi gì.</p>
      <label className="small" htmlFor="import-file">Chọn file .json</label>
      <input ref={fileRef} id="import-file" type="file" accept="application/json,.json" onChange={(e) => onFile(e.target.files?.[0])} />
      {err && <div className="notice bad" role="alert"><strong>Không nhập được.</strong><span>{err}</span></div>}
      {done && <p className="small" role="status">{done}</p>}
      {parsed && (
        <div style={{ display: 'grid', gap: 12 }}>
          <dl className="kv">
            <dt>Ngày xuất</dt><dd>{new Date(parsed.exportedAt).toLocaleString('vi-VN')}</dd>
            <dt>Chủ đề trong file</dt><dd className="tabular">{Object.keys(parsed.topics).length} ({incomingNotes} có ghi chú){unknown ? ` · ${unknown} chủ đề không còn trong cây sẽ chuyển vào ghi chú mồ côi` : ''}</dd>
            <dt>Đang có trên kho</dt><dd className="tabular">{Object.keys(progress).length} chủ đề</dd>
          </dl>
          <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            <legend className="small" style={{ fontWeight: 600, marginBottom: 6 }}>Cách nhập</legend>
            <label className="radio" htmlFor="mode-merge">
              <input id="mode-merge" type="radio" name="mode" checked={mode === 'merge'} onChange={() => setMode('merge')} />
              <span><strong>Gộp</strong> — với mỗi chủ đề, giữ bản được sửa gần nhất.</span>
            </label>
            <label className="radio" htmlFor="mode-replace">
              <input id="mode-replace" type="radio" name="mode" checked={mode === 'replace'} onChange={() => setMode('replace')} />
              <span><strong>Thay thế</strong> — dữ liệu hiện tại được thay bằng nội dung file.</span>
            </label>
          </fieldset>
          {!confirming
            ? <div className="btn-row"><button className="btn primary" type="button" onClick={() => setConfirming(true)}>Nhập dữ liệu</button></div>
            : (
              <div className="notice">
                <strong>Xác nhận.</strong>
                <span style={{ display: 'grid', gap: 8 }}>
                  {mode === 'replace' ? 'Toàn bộ dữ liệu học hiện tại sẽ được thay bằng file này.' : 'Các chủ đề trong file mới hơn bản hiện tại sẽ được ghi đè.'} Bản hiện tại được giữ để hoàn tác.
                  <span className="btn-row">
                    <button className="btn primary" type="button" onClick={apply}>{mode === 'replace' ? 'Thay thế dữ liệu' : 'Gộp dữ liệu'}</button>
                    <button className="btn" type="button" onClick={() => setConfirming(false)}>Thôi</button>
                  </span>
                </span>
              </div>
            )}
        </div>
      )}
    </section>
  );
}

function UndoButton() {
  const [msg, setMsg] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  if (msg) return <p className="small" role="status">{msg}</p>;
  return confirming
    ? <div className="btn-row"><button className="btn primary" type="button" onClick={() => setMsg(`Đã khôi phục ${actions.undoImport()} chủ đề về trước lần nhập.`)}>Khôi phục</button><button className="btn" type="button" onClick={() => setConfirming(false)}>Thôi</button></div>
    : <div className="btn-row"><button className="btn" type="button" onClick={() => setConfirming(true)}>Hoàn tác lần nhập</button></div>;
}

function ConflictCopies({ items }: { items: { topicId: string; doc: { savedAt: string; reason: string; data: { note: string; updatedAt: string } | null } }[] }) {
  if (!items.length) return null;
  return (
    <section className="card" aria-labelledby="cf-h">
      <h2 id="cf-h">Bản lưu tạm</h2>
      <p className="small muted">Khi cùng một chủ đề được sửa trên hai thiết bị lúc mất kết nối, bản mới hơn được giữ và bản còn lại nằm ở đây.</p>
      <ul className="topic-list">
        {items.map((u) => (
          <li key={u.topicId}>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <span className="title"><a href={'#' + u.topicId}>{topics[u.topicId]?.title ?? u.topicId}</a> <span className="muted small">· lưu lúc {new Date(u.doc.savedAt).toLocaleString('vi-VN')}</span>
                {u.doc.data?.note && <span className="muted small" style={{ display: 'block', whiteSpace: 'pre-wrap' }}>{u.doc.data.note.slice(0, 240)}</span>}
              </span>
              <button className="btn" type="button" onClick={() => actions.restoreUndo(u.topicId)}>Dùng bản này</button>
              <button className="btn" type="button" onClick={() => actions.discardUndo(u.topicId)}>Bỏ</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function OrphanRow({ id, note }: { id: string; note: string }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <li>
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <span className="title"><code>{id}</code>{note && <span className="muted small" style={{ display: 'block', whiteSpace: 'pre-wrap' }}>{note}</span>}</span>
        {confirming
          ? <><button className="btn danger" type="button" onClick={() => actions.discardOrphan(id)}>Xóa hẳn</button><button className="btn" type="button" onClick={() => setConfirming(false)}>Thôi</button></>
          : <button className="btn" type="button" onClick={() => setConfirming(true)}>Xóa</button>}
      </div>
    </li>
  );
}
