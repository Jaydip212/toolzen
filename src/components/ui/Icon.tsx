/**
 * Icon — TOOLZEN's original inline SVG icon set.
 *
 * Every glyph is drawn on a 24x24 grid with a 1.75px stroke so icons stay
 * visually consistent and inherit `currentColor`. Keeping them inline avoids an
 * icon-library dependency and keeps the bundle small.
 */
import type { SVGProps } from 'react'

const paths = {
  // --- Navigation / UI -------------------------------------------------------
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" /></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  'chevron-down': <path d="M6 9l6 6 6-6" />,
  'chevron-right': <path d="M9 6l6 6-6 6" />,
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  'arrow-left': <path d="M19 12H5M11 6l-6 6 6 6" />,
  'external-link': <><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  home: <><path d="M4 11l8-7 8 7" /><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  filter: <path d="M3 5h18l-7 8v6l-4-2v-4z" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" /></>,
  sliders: <><path d="M5 4v6M5 14v6M12 4v10M12 18v2M19 4v2M19 10v10" /><circle cx="5" cy="12" r="2" /><circle cx="12" cy="16" r="2" /><circle cx="19" cy="8" r="2" /></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" /><circle cx="12" cy="12" r="2.5" /></>,
  'eye-off': <><path d="M4 4l16 16" /><path d="M9.9 5.2A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.6 3.6M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.9 9.9 0 0 0 4.4-1" /></>,

  // --- Actions ---------------------------------------------------------------
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>,
  check: <path d="M5 13l4 4L19 7" />,
  trash: <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />,
  download: <path d="M12 4v10M8 11l4 4 4-4M5 19h14" />,
  upload: <path d="M12 20V10M8 13l4-4 4 4M5 5h14" />,
  refresh: <><path d="M21 12a9 9 0 1 1-2.6-6.3" /><path d="M21 4v5h-5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />,
  'circle-check': <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9.5" /></>,
  'circle-x': <><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></>,
  'alert-triangle': <><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17h.01" /></>,
  'alert-circle': <><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  ban: <><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></>,
  'cloud-off': <><path d="M4 4l16 16" /><path d="M8.5 8.5A5 5 0 0 1 18 10a4 4 0 0 1 1 7.9" /><path d="M6 18a4 4 0 0 1 .5-8" /></>,

  // --- Documents -------------------------------------------------------------
  file: <><path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v5h4" /></>,
  'file-text': <><path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v5h4M8 13h8M8 17h5" /></>,
  'book-open': <><path d="M12 6.5C10.5 5 8 4.5 5 4.5v13c3 0 5.5.5 7 2 1.5-1.5 4-2 7-2v-13c-3 0-5.5.5-7 2z" /><path d="M12 6.5v13" /></>,
  layers: <><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></>,
  scissors: <><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><path d="M8 7.5L20 18M8 16.5L20 6" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  unlock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 7.5-2" /></>,
  repeat: <><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>,
  scan: <><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M4 12h16" /></>,

  // --- Text / data -----------------------------------------------------------
  type: <><path d="M5 6V4h14v2M12 4v16M9 20h6" /></>,
  'align-left': <path d="M4 6h16M4 10h10M4 14h16M4 18h10" />,
  list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  sort: <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />,
  shuffle: <><path d="M16 4h4v4" /><path d="M20 4l-6 6" /><path d="M4 20l6-6" /><path d="M16 20h4v-4" /><path d="M4 4l6 6" /></>,
  hash: <path d="M9 4L7 20M17 4l-2 16M4 9h16M3 15h16" />,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.3 1.3" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.3-1.3" /></>,
  braces: <><path d="M9 4a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2" /><path d="M15 4a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2" /></>,
  table: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M3 15h18M9 4v16" /></>,
  code: <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 4l-4 16" />,
  terminal: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9l3 3-3 3M13 15h4" /></>,
  pilcrow: <><path d="M13 4H9a4 4 0 0 0 0 8h4z" /><path d="M13 4v16M17 4v16" /></>,

  // --- Media / design --------------------------------------------------------
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="9.5" r="1.5" /><path d="M4 17l5-5 4 4 3-3 4 4" /></>,
  crop: <><path d="M6 3v13a2 2 0 0 0 2 2h13" /><path d="M3 6h13a2 2 0 0 1 2 2v13" /></>,
  flip: <><path d="M12 3v18" /><path d="M8 7L4 12l4 5z" /><path d="M16 7l4 5-4 5z" /></>,
  'rotate-cw': <><path d="M21 12a9 9 0 1 1-2.6-6.3" /><path d="M21 3v5h-5" /></>,
  palette: <><path d="M12 3a9 9 0 0 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-1 .8-1.5 1.8-1.5H16a5 5 0 0 0 5-5c0-4.4-4-7-9-7z" /><circle cx="7.5" cy="12" r="1" /><circle cx="9.5" cy="8" r="1" /><circle cx="14" cy="7" r="1" /></>,
  droplet: <path d="M12 3s6 6.4 6 10.5a6 6 0 0 1-12 0C6 9.4 12 3 12 3z" />,
  ruler: <><rect x="3" y="9" width="18" height="6" rx="1.5" /><path d="M7 9v2M11 9v3M15 9v2M19 9v3" /></>,

  // --- Compute / security ----------------------------------------------------
  shield: <path d="M12 3l8 3v6c0 4.5-3.2 7.9-8 9-4.8-1.1-8-4.5-8-9V6z" />,
  key: <><circle cx="8" cy="15" r="3.5" /><path d="M10.5 12.5L20 3M16 7l3 3M14 9l2 2" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 3.8 5.8 3.8 9S14.5 18.3 12 21c-2.5-2.7-3.8-5.8-3.8-9S9.5 5.7 12 3z" /></>,
  zap: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  'trending-up': <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  activity: <path d="M3 12h4l2.5-7 5 14L17 12h4" />,
  database: <><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" /><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>,
  'bar-chart': <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3 3 0 0 1 0 5.6M18 20a6 6 0 0 0-2-4.5" /></>,
  cpu: <><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M10 10h4v4h-4zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" /></>,

  // --- Everyday --------------------------------------------------------------
  calculator: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></>,
  qr: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v3M14 20h7" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  percent: <><path d="M19 5L5 19" /><circle cx="7.5" cy="7.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" /></>,
  banknote: <><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" /></>,
  gauge: <><path d="M12 14l4-4" /><path d="M4.5 18a9 9 0 1 1 15 0" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6.5l8.5 6 8.5-6" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" /></>,
  heart: <path d="M12 20s-7-4.6-7-9.3A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19 10.7C19 15.4 12 20 12 20z" />,
  lightbulb: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2h5c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" /></>,
  wand: <><path d="M4 20l10-10" /><path d="M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" /><path d="M19 13l.7 1.4 1.4.6-1.4.7-.7 1.3-.7-1.3-1.3-.7 1.3-.6z" /></>,
  sparkles: <><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" /><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z" /></>,
  languages: <><path d="M3 6h10M8 4v2c0 4-2.5 7-5 8" /><path d="M6 12c1.5 2 3.5 3.5 6 4" /><path d="M12.5 20l4-9 4 9M14.5 17h4" /></>,
  scale: <><path d="M12 4v16M7 20h10M6 8l6-3 6 3" /><path d="M6 8l-3 6h6zM18 8l-3 6h6z" /></>,
  diff: <><path d="M7 4v12" /><path d="M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /><path d="M17 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" /><path d="M17 8v8a2 2 0 0 1-2 2H9" /></>,
  barcode: <><path d="M4 5v14M7 5v14M10 5v10M13 5v14M16 5v10M19 5v14" /><path d="M2 19h20" /></>,
  'check-square': <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 12.5l2.5 2.5L16 9.5" /></>,
} as const

export type IconName = keyof typeof paths

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  /** Pixel size applied to both width and height. Defaults to 24. */
  size?: number
  /** Accessible label. When omitted the icon is hidden from assistive tech. */
  title?: string
}

export function Icon({ name, size = 24, title, ...rest }: IconProps) {
  const glyph = paths[name]
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {glyph}
    </svg>
  )
}

export default Icon
