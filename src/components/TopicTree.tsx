import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { content, groups, topics } from '../content';
import { useProgress, displayStatus, STATUS_LABEL } from '../store/hooks';
import { safeStorage } from '../lib/storage';
import { go } from '../router';
import { Icon } from './Icon';
import { StatusDot } from './Status';

const KEY = 'fsmap:tree:v1';

type Row = { id: string; level: 1 | 2 | 3; parent?: string; label: string; expandable: boolean; count?: string };

/** Cây chủ đề theo mẫu WAI-ARIA tree: mũi tên di chuyển và mở nhánh, Enter mở bài. */
export function TopicTree({ currentTopic }: { currentTopic?: string }) {
  const progress = useProgress();
  const [open, setOpen] = useState<Set<string>>(() => new Set(safeStorage.get<string[]>(KEY, [])));
  const [focusId, setFocusId] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLLIElement>());

  // Mở sẵn nhánh và nhóm chứa bài đang xem.
  useEffect(() => {
    if (!currentTopic || !topics[currentTopic]) return;
    const t = topics[currentTopic];
    setOpen((prev) => {
      if (prev.has(t.branch) && prev.has(t.parent)) return prev;
      const next = new Set(prev); next.add(t.branch); next.add(t.parent);
      safeStorage.set(KEY, [...next]);
      return next;
    });
  }, [currentTopic]);

  const toggle = (id: string, value?: boolean) => setOpen((prev) => {
    const next = new Set(prev);
    const willOpen = value ?? !next.has(id);
    if (willOpen) next.add(id); else next.delete(id);
    safeStorage.set(KEY, [...next]);
    return next;
  });

  const rows = useMemo(() => {
    const out: Row[] = [];
    for (const b of content.branches) {
      const ids = b.groups.flatMap((g) => groups[g.id].topics);
      const done = ids.filter((id) => progress[id]?.learnStatus === 'understood').length;
      out.push({ id: b.id, level: 1, label: b.title, expandable: true, count: `${done}/${ids.length}` });
      if (!open.has(b.id)) continue;
      for (const g of b.groups) {
        out.push({ id: g.id, level: 2, parent: b.id, label: g.title, expandable: true, count: String(groups[g.id].topics.length) });
        if (!open.has(g.id)) continue;
        for (const tid of groups[g.id].topics) out.push({ id: tid, level: 3, parent: g.id, label: topics[tid].title, expandable: false });
      }
    }
    return out;
  }, [open, progress]);

  const activeId = focusId && rows.some((r) => r.id === focusId) ? focusId : (currentTopic && rows.some((r) => r.id === currentTopic) ? currentTopic : rows[0]?.id);

  const focusRow = (id: string) => {
    setFocusId(id);
    const el = refs.current.get(id);
    if (el) el.focus();
    else requestAnimationFrame(() => refs.current.get(id)?.focus());
  };

  const activate = (r: Row) => {
    if (r.level === 3) go('#' + r.id);
    else toggle(r.id);
  };

  const onKey = (e: KeyboardEvent, r: Row) => {
    const i = rows.findIndex((x) => x.id === r.id);
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); if (rows[i + 1]) focusRow(rows[i + 1].id); break;
      case 'ArrowUp': e.preventDefault(); if (rows[i - 1]) focusRow(rows[i - 1].id); break;
      case 'Home': e.preventDefault(); focusRow(rows[0].id); break;
      case 'End': e.preventDefault(); focusRow(rows[rows.length - 1].id); break;
      case 'ArrowRight':
        e.preventDefault();
        if (r.expandable && !open.has(r.id)) toggle(r.id, true);
        else if (r.expandable && rows[i + 1]?.parent === r.id) focusRow(rows[i + 1].id);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (r.expandable && open.has(r.id)) toggle(r.id, false);
        else if (r.parent) focusRow(r.parent);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault(); activate(r); break;
    }
  };

  // cây lồng nhau để screen reader hiểu cấp
  const render = (level: 1 | 2 | 3, parent?: string) =>
    rows.filter((r) => r.level === level && r.parent === parent).map((r) => {
      const t = r.level === 3 ? topics[r.id] : undefined;
      const st = t ? displayStatus(progress[r.id]) : undefined;
      const isOpen = open.has(r.id);
      return (
        <li key={r.id} role="treeitem" aria-level={r.level}
          aria-expanded={r.expandable ? isOpen : undefined}
          aria-selected={r.level === 3 ? r.id === currentTopic : undefined}
          tabIndex={r.id === activeId ? 0 : -1}
          ref={(el) => { if (el) refs.current.set(r.id, el); else refs.current.delete(r.id); }}
          onKeyDown={(e) => { if (e.target === e.currentTarget) onKey(e, r); }}
          onFocus={(e) => { if (e.target === e.currentTarget) setFocusId(r.id); }}
          className="tree-item"
          aria-label={t ? `${r.label}, ${STATUS_LABEL[st!]}${t.contentStatus === 'skeleton' ? ', chưa có bài' : ''}` : r.label}
        >
          <div className="tree-row" data-level={r.level} data-content={t?.contentStatus}
            data-selected={r.level === 3 && r.id === currentTopic ? 'true' : undefined}
            onClick={() => { setFocusId(r.id); activate(r); }}>
            {r.expandable
              ? <span className="tree-caret" data-open={isOpen}><Icon name="caret" size={14} /></span>
              : <StatusDot status={st!} content={t?.contentStatus} />}
            <span className="tree-label">{r.label}</span>
            {r.count && <span className="tree-count">{r.count}</span>}
          </div>
          {r.expandable && isOpen && <ul role="group">{render((r.level + 1) as 2 | 3, r.id)}</ul>}
        </li>
      );
    });

  return (
    <ul className="tree" role="tree" aria-label="Cây kiến thức">
      {render(1)}
    </ul>
  );
}
