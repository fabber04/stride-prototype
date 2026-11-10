const paths = {
  today: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4" />
    </>
  ),
  clubs: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" />
      <circle cx="17.5" cy="9" r="2.5" />
      <path d="M17 14c2.5 0 4.5 1.8 4.5 4.5" />
    </>
  ),
  learn: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5l5 3.5-5 3.5z" />
    </>
  ),
  mentors: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.7 2.7L16 9.5" />
    </>
  ),
  download: <path d="M12 4v10m0 0l-4-4m4 4l4-4M5 19h14" />,
  wifi: (
    <>
      <path d="M2 9a15 15 0 0120 0M5 12.5a10.5 10.5 0 0114 0M8.5 16a5.5 5.5 0 017 0" />
      <circle cx="12" cy="19.5" r="1" fill="currentColor" />
    </>
  ),
  refresh: <path d="M21 12a9 9 0 11-3-6.7M21 4v5h-5" />,
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  message: <path d="M4 5h16v11H9l-5 4z" />,
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  home: <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16v-5a6 6 0 0112 0v5l2 2H4z" />
      <path d="M10 21h4" />
    </>
  ),
  back: <path d="M15 5l-7 7 7 7" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" />
    </>
  ),
  sport: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.8l4 2.9-1.5 4.6h-5L8 10.7z" />
    </>
  ),
  pawn: (
    <>
      <circle cx="12" cy="6" r="2.5" />
      <path d="M10 8.5c-.5 2.5-1.5 4.5-2 7h8c-.5-2.5-1.5-4.5-2-7M7 19h10M8 15.5L7 19M16 15.5l1 3.5" />
    </>
  ),
  bookOpen: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 3v18" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.5L8 21l4-2 4 2-1-7.5" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2.5" />
      <path d="M9 4V3h6v1M9 10h6M9 14h6" />
    </>
  ),
  send: <path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  wifiOff: (
    <>
      <path d="M3 3l18 18M8.5 16a5.5 5.5 0 017 0M5 12.5a10.5 10.5 0 015-2.7M14.5 9.9A10.5 10.5 0 0119 12.5M2 9a15 15 0 014.5-3M10 4.6A15 15 0 0122 9" />
      <circle cx="12" cy="19.5" r="1" fill="currentColor" />
    </>
  ),
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
  sparkles: (
    <>
      <path d="M10 3l1.8 4.7L16.5 9.5l-4.7 1.8L10 16l-1.8-4.7L3.5 9.5l4.7-1.8z" />
      <path d="M18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9z" />
    </>
  ),
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />,
  thumbsDown: (
    <>
      <path d="M7 4h9.5a2 2 0 012 1.6l1.3 7a2 2 0 01-2 2.4H14l1 4a2 2 0 01-2 2.4L8 14V4z" />
      <path d="M4 4h3v10H4z" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6L6 18" />,
  sliders: <path d="M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  code: <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />,
  robot: (
    <>
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 4v4M9 13h.01M15 13h.01M9.5 17h5" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7M3 13h18" />
    </>
  ),
  book: (
    <>
      <path d="M5 5a2 2 0 012-2h12v15H7a2 2 0 00-2 2z" />
      <path d="M5 20a2 2 0 002 1h12v-3" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </>
  )
};

export function Icon({ name, size = 22, strokeWidth = 2, color = 'currentColor', className, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {paths[name]}
    </svg>
  );
}

export function PlayFill({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

export function HeartFill({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-7.5-10.5a4.3 4.3 0 017.5-2.8 4.3 4.3 0 017.5 2.8c0 5.9-7.5 10.5-7.5 10.5z" />
    </svg>
  );
}

export function PauseFill({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6.5" y="5" width="4" height="14" rx="1" />
      <rect x="13.5" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
