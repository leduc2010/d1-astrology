import { Palette as P, withAlpha } from './palette';

/**
 * Gradients (mirrors Kotlin `OrtusGradients`), as CSS gradient strings for the RN `backgroundImage`
 * style. Compose's horizontal/vertical brushes are absolute (they do not flip in RTL), and so are
 * these. Compose's default radial radius is half the smaller side, i.e. CSS `closest-side`.
 */
export const OrtusGradientStops = {
  night: [P.Indigo, P.Night],
  glowCard: [P.GlowTop, P.GlowBottom],
  gold: [P.GoldPale, P.Gold, P.GoldDeep],
  goldProgress: [P.GoldDeep, P.Gold, P.GoldPale],
  selectedCell: [P.PalaceTop, P.PalaceBottom],
  header: [P.Indigo, P.IndigoDeep],
  tabBar: [P.TabBarTop, P.Night],
  aiAvatar: [P.MysticLight, P.MysticDeep],
  aiSend: [P.MysticLight, P.Nebula],
  mysticBar: [P.MysticDeep, P.MysticLight],
} as const;

const S = OrtusGradientStops;

function linear(direction: string, stops: readonly string[]): string {
  return `linear-gradient(${direction}, ${stops.join(', ')})`;
}

function radial(stops: readonly string[]): string {
  return `radial-gradient(circle closest-side at center, ${stops.join(', ')})`;
}

export const OrtusGradients = {
  /** 180° night sky: indigo at the top, night at the bottom. */
  night: linear('to bottom', S.night),
  /** 135° glow card (top-left corner to bottom-right corner). */
  glowCard: linear('to bottom right', S.glowCard),
  /** Primary gold (buttons, selected segment, switch track, premium tag). */
  gold: linear('to right', S.gold),
  /** Progress fill runs the other way so the bright end leads. */
  goldProgress: linear('to right', S.goldProgress),
  /** Selected palace and the current luck pillar. */
  selectedCell: linear('to bottom', S.selectedCell),
  header: linear('to bottom', S.header),
  tabBar: linear('to bottom', S.tabBar),
  aiAvatar: radial(S.aiAvatar),
  /** Ask AI send button, lit once there is something to send. */
  aiSend: linear('to bottom right', S.aiSend),
  /** Violet fill for descriptive bars: a level, never a score. */
  mysticBar: linear('to right', S.mysticBar),
  /** Soft round glow (nebula clouds, halos) fading to transparent. [color] is `#RRGGBB`. */
  halo(color: string, peakAlpha: number): string {
    return radial([withAlpha(color, peakAlpha), withAlpha(color, 0)]);
  },
} as const;
