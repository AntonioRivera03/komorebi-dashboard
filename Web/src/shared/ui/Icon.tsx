import type { SVGProps } from 'react'

export type IconName =
  | 'plus'
  | 'mic'
  | 'search'
  | 'sun'
  | 'moon'
  | 'close'
  | 'check'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'arrow-right'
  | 'sparkle'
  | 'leaf'
  | 'pin'
  | 'dots'
  | 'refresh'
  | 'link'
  | 'bell'
  | 'home'
  | 'book'
  | 'calendar'
  | 'clock'
  | 'flag'
  | 'play'
  | 'pause'
  | 'trash'
  | 'edit'
  | 'external'
  | 'filter'
  | 'grid'
  | 'send'
  | 'shield'
  | 'warning'
  | 'info'
  | 'minus'
  | 'quote'
  | 'settings'
  | 'eye'
  | 'thermometer'
  | 'lamp'

const paths: Record<IconName, string> = {
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM19 11a7 7 0 0 1-14 0M12 18v3',
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM20 20l-4-4',
  sun: 'M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12l5 5L20 7',
  'chevron-right': 'M9 6l6 6-6 6',
  'chevron-left': 'M15 6l-6 6 6 6',
  'chevron-down': 'M6 9l6 6 6-6',
  'arrow-right': 'M5 12h14M13 6l6 6-6 6',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z',
  leaf: 'M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l7-7',
  pin: 'M9 4h6l-1 6 3 3v1H7v-1l3-3-1-6zM12 14v6',
  dots: 'M6 12h.01M12 12h.01M18 12h.01',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4l2-2zM10 20a2 2 0 0 0 4 0',
  home: 'M4 11l8-7 8 7v9H4z',
  book: 'M4 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-7a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h7z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  clock: 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM12 8v4l3 2',
  flag: 'M6 21V4h11l-2 4 2 4H6',
  play: 'M7 5l12 7-12 7z',
  pause: 'M7 5h4v14H7zM13 5h4v14h-4z',
  trash: 'M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13',
  edit: 'M4 20l4-1L19 8l-3-3L5 16l-1 4z',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  filter: 'M4 5h16l-6 8v6l-4-2v-4z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  send: 'M4 12l16-8-6 16-2-6z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  warning: 'M12 4l9 16H3zM12 10v4M12 17v.5',
  info: 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM12 11v5M12 8v.5',
  quote: 'M7 8h4v4H7zM7 12a4 4 0 0 0 4 4M14 8h4v4h-4zM14 12a4 4 0 0 0 4 4',
  settings: 'M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM19 12l2-1-1-3-2 .3-1.6-1.6L17 4l-3-1-1 2h-2L10 3 7 4l.6 2.7L6 8.3 3.7 8l-1 3 2 1v2l-2 1 1 3 2.3-.3L7.6 19 7 22l3 1 1-2h2l1 2 3-1-.6-2.7 1.6-1.6 2.3.3 1-3-2-1z',
  eye: 'M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z',
  thermometer: 'M10 4a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0zM12 9v8',
  lamp: 'M9 4h6l3 8H6zM12 12v5M8 21h8M10 17h4',
}

type Props = SVGProps<SVGSVGElement> & { name: IconName; size?: number }

export function Icon({ name, size = 16, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  )
}
