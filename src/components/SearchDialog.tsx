import { useEffect, useMemo, useRef, useState } from 'react';
import { topics, groups, branchById } from '../content';
import { useProgress, displayStatus } from '../store/hooks';
import { buildIndex, search } from '../lib/search';
import { go } from '../router';
import { LearnChip, ContentChip } from './Status';

export function SearchDialog({ onClose }: { onClose: () => void }) {
  const progress = useProgress();
  const notes = useMemo(() => Object.fromEntries(Object.entries(progress).map(([id, p]) => [id, p.note])), [progress]);
  const index = useMemo(() => buildIndex(notes), [notes]);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => search(index, q), [index, q]);

  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => { setSel(0); }, [q]);

  const open = (id: string) => { onClose(); go('#' + id); };

  return (
    <div className="search-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-box" role="dialog" aria-modal="true" aria-label="Tìm chủ đề">
        <input ref={input} id="search-input" className="search-input" type="search" value={q}
          placeholder="Tìm chủ đề, nội dung bài, ghi chú… (gõ có hoặc không dấu)"
          aria-controls="search-results" aria-activedescendant={results[sel] ? 'sr-' + results[sel] : undefined}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { e.preventDefault(); onClose(); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
            else if (e.key === 'Enter' && results[sel]) { e.preventDefault(); open(results[sel]); }
          }} />
        {q.trim() && results.length === 0 && <div className="search-empty">Không có chủ đề nào khớp “{q}”.</div>}
        {!q.trim() && <div className="search-empty small">Gõ để tìm trong {Object.keys(topics).length} chủ đề. ↑ ↓ để chọn, Enter để mở, Esc để đóng.</div>}
        {results.length > 0 && (
          <ul id="search-results" className="search-results" role="listbox" aria-label="Kết quả">
            {results.map((id, i) => {
              const t = topics[id];
              return (
                <li key={id} id={'sr-' + id} role="option" aria-selected={i === sel}
                  onMouseEnter={() => setSel(i)} onClick={() => open(id)}>
                  <span className="r-title">{t.title}<LearnChip status={displayStatus(progress[id])} />{t.contentStatus !== 'skeleton' && <ContentChip topic={t} />}</span>
                  <span className="r-path">{branchById[t.branch]?.title} › {groups[t.parent]?.title}</span>
                  <span className="r-snippet">{t.summary}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
