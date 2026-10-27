const paths: Record<string, string> = {
  today: 'M4 5h16v15H4zM4 9h16M9 3v4M15 3v4',
  map: 'M12 4v4M12 8l-6 5M12 8l6 5M6 13v3M18 13v3M4 16h4v4H4zM16 16h4v4h-4zM9 2h6v4H9z',
  tree: 'M5 5h4M5 12h4M5 19h4M12 5h7M12 12h7M12 19h7',
  roadmap: 'M4 6h3M4 12h3M4 18h3M10 6h10M10 12h10M10 18h10',
  review: 'M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4',
  data: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  caret: 'M9 6l6 6-6 6',
  close: 'M6 6l12 12M18 6L6 18',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  fit: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
};

export function Icon({ name, size = 18, label }: { name: keyof typeof paths | string; size?: number; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : true} role={label ? 'img' : undefined} aria-label={label}>
      <path d={paths[name] ?? ''} />
    </svg>
  );
}
