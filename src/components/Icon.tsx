// Minimal 24px stroke icons.
const paths: Record<string, string> = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  cube: 'M12 2l9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10',
  film: 'M4 4h16v16H4zM4 9h16M4 15h16M9 4v5M15 4v5M9 15v5M15 15v5',
  image: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5a1.5 1.5 0 1 0 0-.01',
  palette: 'M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-1.3-1.1-1.6-1.1-2.7 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3zM7.5 12.5v.01M9.5 8v.01M14.5 8v.01M17 11.5v.01',
  gamepad: 'M7 8h10a5 5 0 0 1 4.9 6l-.6 3a2.5 2.5 0 0 1-4.4 1l-1.6-2H8.7l-1.6 2a2.5 2.5 0 0 1-4.4-1l-.6-3A5 5 0 0 1 7 8zM8 11v4M6 13h4M15.5 12v.01M17.5 14v.01',
  user: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5',
  wire: 'M12 2l9 5v10l-9 5-9-5V7zM3 7l18 10M21 7L3 17M12 2v20',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  shadow: 'M12 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM4 19c2-2 14-2 16 0M6 21h12',
  spin: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4',
  reset: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4',
  info: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 11v6M12 7.5v.01',
  help: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17v.01',
  full: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  eyeOff: 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3 3.8M6.6 6.6C3.8 8.3 2 12 2 12s3.6 7 10 7c1.9 0 3.5-.6 4.9-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2',
  sound: 'M4 9h4l5-4v14l-5-4H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12',
  mute: 'M4 9h4l5-4v14l-5-4H4zM17 9l5 6M22 9l-5 6',
  play: 'M7 4l13 8-13 8z',
  pause: 'M7 4h3v16H7zM14 4h3v16h-3z',
  prev: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
  up: 'M5 15l7-7 7 7',
  down: 'M5 9l7 7 7-7',
  back: 'M19 12H5M11 6l-6 6 6 6',
  loop: 'M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4',
  close: 'M6 6l12 12M18 6L6 18',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  link: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  check: 'M5 12l5 5 9-11',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  plus: 'M12 5v14M5 12h14',
  smile: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8.5 14.5c1.8 2 5.2 2 7 0M9 9.5v.01M15 9.5v.01',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  drag: 'M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z',
}

export function Icon({ name, size = 18 }: { name: keyof typeof paths | string; size?: number }) {
  const fill = name === 'play' || name === 'pause'
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth={fill ? 0 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[name]} />
    </svg>
  )
}
