import { topics, groups } from '../content';
import { useProgress, displayStatus } from '../store/hooks';
import { StatusDot, ContentChip } from './Status';

export function TopicList({ ids, showGroup = false, meta }: { ids: string[]; showGroup?: boolean; meta?: (id: string) => string | undefined }) {
  const progress = useProgress();
  return (
    <ul className="topic-list">
      {ids.filter((id) => topics[id]).map((id) => {
        const t = topics[id];
        const st = displayStatus(progress[id]);
        const extra = meta?.(id);
        return (
          <li key={id}>
            <a href={'#' + id}>
              <StatusDot status={st} content={t.contentStatus} />
              <span className="title">
                {t.title}
                {showGroup && <span className="muted small"> · {groups[t.parent]?.title}</span>}
              </span>
              {t.contentStatus !== 'skeleton' && <ContentChip topic={t} />}
              {extra && <span className="meta">{extra}</span>}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
