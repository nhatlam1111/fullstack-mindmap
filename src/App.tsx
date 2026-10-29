import { useEffect, useState } from 'react';
import { useRoute, type Route } from './router';
import { content, topics } from './content';
import { useData, startSync } from './store/data';
import { useDueList, useWeek } from './store/hooks';
import { Icon } from './components/Icon';
import { TopicTree } from './components/TopicTree';
import { SearchDialog } from './components/SearchDialog';
import { TopicArticle } from './components/TopicArticle';
import { Today } from './views/Today';
import { Roadmap } from './views/Roadmap';
import { Review } from './views/Review';
import { DataView } from './views/DataView';
import { MapView } from './views/MapView';

const SYNC_LABEL = {
  connecting: 'Đang kết nối', local: 'Cục bộ', synced: 'Đã đồng bộ', pending: 'Đang lưu', offline: 'Ngoại tuyến', error: 'Lỗi lưu',
} as const;

function useIsNarrow() {
  const q = '(max-width: 767px)';
  const [narrow, setNarrow] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setNarrow(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return narrow;
}

export function App() {
  const route = useRoute();
  const [searchOpen, setSearchOpen] = useState(false);
  const status = useData((s) => s.status);
  const due = useDueList();
  const week = useWeek();
  const narrow = useIsNarrow();

  useEffect(() => { void startSync(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setSearchOpen(true); }
      else if (e.key === '/' && !typing) { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.getElementById('main')?.scrollTo({ top: 0 });
    const t = route.name === 'topic' ? topics[route.id]?.title : undefined;
    document.title = t ? `${t} · Mindmap Fullstack` : 'Mindmap Fullstack';
  }, [route]);

  const currentTopic = route.name === 'topic' ? route.id : undefined;
  const isMap = route.name === 'map' && !narrow;

  const nav: { r: Route['name']; href: string; label: string; icon: string; badge?: number; wideOnly?: boolean }[] = [
    { r: 'today', href: '#today', label: 'Hôm nay', icon: 'today' },
    { r: 'map', href: '#map', label: 'Bản đồ', icon: 'map', wideOnly: true },
    { r: 'tree', href: '#tree', label: 'Cây', icon: 'tree' },
    { r: 'roadmap', href: '#roadmap', label: 'Lộ trình', icon: 'roadmap' },
    { r: 'review', href: '#review', label: 'Ôn tập', icon: 'review', badge: due.length },
    { r: 'data', href: '#data', label: 'Dữ liệu học', icon: 'data' },
  ];

  return (
    <div className="shell">
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Bỏ qua tới nội dung</a>
      <header className="topbar">
        <a className="brand" href="#today">
          <span className="brand-name">Mindmap Fullstack</span>
          {week != null && <span className="week-stamp tabular">Chặng {week}/{content.weeks.length}</span>}
        </a>
        <span className="topbar-spacer" />
        <button className="search-trigger" type="button" onClick={() => setSearchOpen(true)} aria-label="Tìm kiếm (Ctrl K)">
          <Icon name="search" size={16} /><span className="search-label">Tìm chủ đề</span><kbd>Ctrl K</kbd>
        </button>
        <a className="sync" href="#data" data-status={status} title="Trạng thái lưu dữ liệu học">
          <span className="sync-dot" /><span className="sync-label">{SYNC_LABEL[status]}</span>
          <span className="visually-hidden">{SYNC_LABEL[status]}</span>
        </a>
      </header>
      <div className="body">
        <nav className="sidebar" aria-label="Điều hướng chính">
          <div className="nav">
            {nav.filter((n) => n.r !== 'tree').map((n) => (
              <a key={n.r} href={n.href} aria-current={route.name === n.r ? 'page' : undefined}>
                <Icon name={n.icon} />{n.label}{n.badge ? <span className="badge" aria-label={`${n.badge} chủ đề cần ôn`}>{n.badge}</span> : null}
              </a>
            ))}
          </div>
          <TopicTree currentTopic={currentTopic} />
        </nav>
        <main id="main" className="main" tabIndex={-1}>
          {isMap ? <MapView /> : (
            <div className={'main-inner' + (route.name === 'topic' ? ' wide' : '')}>
              {route.name === 'today' && <Today />}
              {route.name === 'tree' && (
                <div className="page tree-page">
                  <h1 className="page-title">Cây kiến thức</h1>
                  <TopicTree currentTopic={currentTopic} />
                </div>
              )}
              {route.name === 'map' && narrow && (
                <div className="page">
                  <h1 className="page-title">Bản đồ</h1>
                  <p className="lede">Bản đồ chỉ hiển thị trên màn hình rộng. Trên điện thoại, dùng cây kiến thức.</p>
                  <div className="tree-page"><TopicTree /></div>
                </div>
              )}
              {route.name === 'roadmap' && <Roadmap focus={route.week} />}
              {route.name === 'review' && <Review />}
              {route.name === 'data' && <DataView />}
              {route.name === 'topic' && <TopicArticle key={route.id} id={route.id} />}
              {route.name === 'notfound' && (
                <div className="page">
                  <h1 className="page-title">Không tìm thấy</h1>
                  <p className="lede">Không có chủ đề hay trang nào tên “{route.hash}”. Có thể chủ đề đã đổi id. <a href="#tree">Mở cây kiến thức</a></p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Điều hướng chính">
        {nav.filter((n) => n.r !== 'data').map((n) => (
          <a key={n.r} href={n.href} aria-current={route.name === n.r ? 'page' : undefined} className={n.wideOnly ? 'only-wide' : undefined}>
            <Icon name={n.icon} size={20} />{n.label}{n.badge ? <span className="badge">{n.badge}</span> : null}
          </a>
        ))}
      </nav>
      {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
