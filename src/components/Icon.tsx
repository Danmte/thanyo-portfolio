// Minimal stroke icons for the model viewer toolbar.
const paths: Record<string, string> = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  cube: 'M12 2l9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10',
  film: 'M4 4h16v16H4zM4 9h16M4 15h16M9 4v5M15 4v5M9 15v5M15 15v5',
  image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5a1.5 1.5 0 1 0 0-.01',
  wire: 'M12 2l9 5v10l-9 5-9-5V7zM3 7l18 10M21 7L3 17M12 2v20',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  shadow: 'M12 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM4 19c2-2 14-2 16 0M6 21h12',
  spin: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4',
  reset: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4',
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 11v6M12 7.5v.01',
  full: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  play: 'M7 4l13 8-13 8z',
  pause: 'M7 4h3v16H7zM14 4h3v16h-3z',
  prev: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
  loop: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4',
  close: 'M6 6l12 12M18 6L6 18',
}

export function Icon({ name, size = 18 }: { name: keyof typeof paths | string; size?: number }) {
  const fill = name === 'play' || name === 'pause'
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={fill ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[name]} />
    </svg>
  )
}
