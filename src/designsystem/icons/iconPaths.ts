/**
 * Path data of every `OrtusIcons` glyph (24 x 24 viewport), copied verbatim from Kotlin
 * `OrtusIcons.kt`. Line icons are stroked at 1.6 with round caps and joins; `filled` icons are
 * filled; `mirror` icons flip in right-to-left layouts (Kotlin `autoMirror`).
 */
export type IconSpec = {
  readonly paths: readonly string[];
  readonly filled?: boolean;
  readonly mirror?: boolean;
};

const CIRCLE_9 = 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18Z';

export const ICON_VIEWPORT = 24;
export const ICON_STROKE = 1.6;

export const OrtusIconPaths = {
  Today: {
    paths: [
      'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8Z',
      'M12 2.5v2 M12 19.5v2 M2.5 12h2 M19.5 12h2',
      'M5.3 5.3l1.4 1.4 M17.3 17.3l1.4 1.4 M5.3 18.7l1.4-1.4 M17.3 6.7l1.4-1.4',
    ],
  },
  Calendar: {
    paths: [
      'M5.5 5h13a2.5 2.5 0 0 1 2.5 2.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-11A2.5 2.5 0 0 1 5.5 5Z',
      'M3 10h18 M8 3v4 M16 3v4',
    ],
  },
  Chart: {
    paths: [CIRCLE_9, 'M12 7.5a4.5 4.5 0 1 0 0 9a4.5 4.5 0 1 0 0-9Z', 'M12 3v4.5 M12 16.5V21 M3 12h4.5 M16.5 12H21'],
  },
  Ai: {
    paths: [
      'M11 3.5l1.7 4.8l4.8 1.7l-4.8 1.7L11 16.5l-1.7-4.8L4.5 10l4.8-1.7Z',
      'M18 14.5l.8 2.2l2.2.8l-2.2.8l-.8 2.2l-.8-2.2l-2.2-.8l2.2-.8Z',
    ],
  },
  Me: {
    paths: ['M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8Z', 'M4.5 20.5c0-3.9 3.4-6.2 7.5-6.2s7.5 2.3 7.5 6.2'],
  },
  Back: { paths: ['M15 5l-7 7l7 7'], mirror: true },
  ChevronRight: { paths: ['M9.5 5.5l6.5 6.5l-6.5 6.5'], mirror: true },
  ChevronDown: { paths: ['M5.5 9.5l6.5 6.5l6.5-6.5'] },
  Close: { paths: ['M6.5 6.5l11 11 M17.5 6.5l-11 11'] },
  Check: { paths: ['M5 12.5l4.5 4.5L19 7.5'] },
  Info: { paths: [CIRCLE_9, 'M12 11v5.5 M12 7.6v.4'] },
  Warning: { paths: ['M12 3.8l9 15.7H3Z', 'M12 10v4.2 M12 16.8v.3'] },
  Bell: { paths: ['M6.5 16v-5a5.5 5.5 0 0 1 11 0v5l1.5 2h-14Z', 'M10 21h4'] },
  Send: { paths: ['M4 12l16-7.5l-6 16l-2.6-6.4Z', 'M11.4 14.1L20 4.5'], mirror: true },
  Settings: {
    paths: ['M4 7h9 M17 7h3 M4 17h3 M11 17h9', 'M15 5a2 2 0 1 0 0 4a2 2 0 1 0 0-4Z M9 15a2 2 0 1 0 0 4a2 2 0 1 0 0-4Z'],
  },
  Heart: { paths: ['M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4A4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z'] },
  Moon: { paths: ['M19.5 14.5A8 8 0 1 1 9.5 4.5a6.4 6.4 0 0 0 10 10Z'] },
  Lock: {
    paths: [
      'M6.5 10.5h11a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-7a1.5 1.5 0 0 1 1.5-1.5Z',
      'M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5',
    ],
  },
  Share: {
    paths: ['M12 15V4 M7.5 8.5L12 4l4.5 4.5', 'M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13'],
  },
  Plus: { paths: ['M12 5v14 M5 12h14'] },
  Phone: {
    paths: ['M6 4h3l1.5 4.5-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4.5 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 4 6a2 2 0 0 1 2-2Z'],
  },
  Pin: {
    paths: ['M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z', 'M12 7.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5Z'],
  },
  Search: { paths: ['M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13Z', 'M15.5 15.5L20 20'] },
  Globe: {
    paths: [
      CIRCLE_9,
      'M3 12h18',
      'M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9s1.2-6.4 3.7-9Z',
    ],
  },
  /** Four-point star (glow card corner, AI avatar). */
  Sparkle: {
    paths: ['M12 2C12.6 8 16 11.4 22 12C16 12.6 12.6 16 12 22C11.4 16 8 12.6 2 12C8 11.4 11.4 8 12 2Z'],
    filled: true,
  },
} as const satisfies Record<string, IconSpec>;

export type OrtusIconName = keyof typeof OrtusIconPaths;
