import { OrtusAlpha } from './alpha';
import { Palette as P, TRANSPARENT, withAlpha } from './palette';

/** A content color with its container (fill) and optional border (Kotlin `ToneColors`). */
export type ToneColors = {
  readonly content: string;
  readonly container: string;
  readonly border: string;
};

export function tone(content: string, container: string, border: string = TRANSPARENT): ToneColors {
  return { content, container, border };
}

/**
 * Same content color re-dressed as a card: faint fill and soft border (Kotlin `asCard()`).
 * Needs the content color as `#RRGGBB` because RN colors are strings.
 */
export function asCard(t: ToneColors, contentHex: string): ToneColors {
  return tone(
    t.content,
    withAlpha(contentHex, OrtusAlpha.TONE_CARD_FILL),
    withAlpha(contentHex, OrtusAlpha.TONE_CARD_BORDER),
  );
}

const W = P.White;

/** Five-element colors. */
export const ElementColors = {
  metal: tone(P.Metal, withAlpha(P.Metal, 0.14)),
  wood: tone(P.Wood, withAlpha(P.Wood, 0.14)),
  water: tone(P.WaterText, withAlpha(P.Water, 0.16)),
  fire: tone(P.Fire, withAlpha(P.Fire, 0.14)),
  earth: tone(P.Earth, withAlpha(P.Earth, 0.14)),
} as const;

/** Chart colors (palace grid, natal wheel). */
export const ChartColors = {
  prosperity: tone(P.Jade, withAlpha(P.Jade, 0.18)),
  power: tone(P.GoldLight, withAlpha(P.Gold, 0.2)),
  fame: tone(P.WaterText, withAlpha(P.Water, 0.2)),
  obstacle: tone(P.Cinnabar, withAlpha(P.Cinnabar, 0.18)),
  luckyStar: P.Mint,
  maleficStar: P.Coral,
  zodiacFire: P.Fire,
  zodiacEarth: P.Earth,
  zodiacAir: P.Metal,
  zodiacWater: P.Water,
  aspectSoft: withAlpha(P.Jade, 0.7),
  aspectHard: withAlpha(P.Cinnabar, 0.7),
  aspectFused: withAlpha(P.Gold, 0.7),
  gridLine: withAlpha(P.Gold, 0.22),
  selectedBorder: P.GoldLight,
} as const;

/** Neutral greys of the native ad slot, so ads never look like app content. */
export const AdColors = {
  surface: P.AdSurface,
  border: P.AdBorder,
  control: P.AdControl,
  media: P.AdMedia,
  title: P.AdTitle,
  body: P.AdBody,
  caption: P.AdCaption,
} as const;

/** Semantic color roles (mirrors Kotlin `OrtusColors`); values equal the Kotlin ones. */
export const OrtusColors = {
  backgroundTop: P.Indigo,
  backgroundBottom: P.Night,
  surface: withAlpha(P.Surface, 0.82),
  surfaceSolid: P.Surface,
  surfaceRaised: P.Surface2,
  accent: P.Gold,
  accentLight: P.GoldLight,
  onAccent: P.Ink,
  textPrimary: P.StarWhite,
  textSecondary: P.Mist,
  textMuted: P.Muted,
  textBody: P.Lavender,
  mystic: P.Mystic,
  mysticLight: P.MysticLight,
  danger: P.Cinnabar,
  success: P.Jade,
  outline: withAlpha(W, 0.1),
  outlineStrong: withAlpha(P.Gold, 0.55),
  divider: withAlpha(W, 0.06),
  cardBorder: withAlpha(P.Gold, 0.16),
  glowBorder: withAlpha(P.Gold, 0.4),
  selectionBorder: withAlpha(P.Gold, 0.35),
  controlBorder: withAlpha(W, 0.25),
  hanGlyph: P.Earth,
  glowShadow: withAlpha(P.Nebula, 0.35),
  accentGlowSoft: withAlpha(P.Gold, 0.15),
  accentGlow: withAlpha(P.Gold, 0.25),
  accentGlowStrong: withAlpha(P.Gold, 0.5),
  accentGlowIntense: withAlpha(P.Gold, 0.7),
  glowCardStar: withAlpha(P.GoldLight, 0.85),
  iconButtonContainer: withAlpha(P.Surface2, 0.8),
  sheetBorder: withAlpha(P.Gold, 0.25),
  sheetHandle: withAlpha(W, 0.25),
  nebula: P.Nebula,
  nebulaSoft: P.Mystic,
  nebulaDeep: P.NebulaDeep,
  starDot: P.StarWhite,
  starGlint: P.GoldLight,
  scrim: withAlpha(P.Scrim, 0.7),
  disabledContainer: withAlpha(P.Surface2, 0.7),
  insetContainer: withAlpha(P.Night, 0.35),
  goldCell: tone(P.GoldLight, withAlpha(P.Gold, 0.18), withAlpha(P.Gold, 0.35)),
  goldCellCaption: P.Sand,
  onAccentMuted: P.Umber,
  mysticCard: tone(P.MysticLight, withAlpha(P.Mystic, 0.12), withAlpha(P.Mystic, 0.35)),
  auspicious: tone(P.Jade, withAlpha(P.Jade, 0.14)),
  inauspicious: tone(P.Cinnabar, withAlpha(P.Cinnabar, 0.14)),
  ai: tone(P.MysticLight, withAlpha(P.Mystic, 0.16)),
  chatQuestion: tone(P.StarWhite, withAlpha(P.GoldLight, 0.16), withAlpha(P.GoldLight, 0.35)),
  chatAnswer: tone(P.Lavender, P.Surface2, withAlpha(P.Mystic, 0.25)),
  calm: tone(P.JadeInk, P.Jade),
  calmSoft: tone(P.Mint, withAlpha(P.Jade, 0.16), withAlpha(P.Jade, 0.5)),
  neutralTag: tone(P.Mist, withAlpha(W, 0.06)),
  neutralTagOnGlow: tone(P.Lavender, withAlpha(W, 0.08)),
  goldChip: tone(P.GoldLight, withAlpha(P.Gold, 0.1), withAlpha(P.Gold, 0.4)),
  sourceTuVi: tone(P.GoldLight, withAlpha(P.Gold, 0.1), withAlpha(P.Gold, 0.3)),
  sourceBatTu: tone(P.BlueText, withAlpha(P.Water, 0.1), withAlpha(P.Water, 0.32)),
  sourceAstrology: tone(P.MysticPale, withAlpha(P.Mystic, 0.12), withAlpha(P.Mystic, 0.35)),
  sourceMarkTuVi: P.Gold,
  sourceMarkBatTu: P.WaterText,
  sourceMarkAstrology: P.MysticLight,
  noteInfo: tone(P.Mist, P.Surface2, withAlpha(W, 0.08)),
  noteWarning: tone(P.StarWhite, withAlpha(P.Cinnabar, 0.1), withAlpha(P.Cinnabar, 0.3)),
  noteGood: tone(P.StarWhite, withAlpha(P.Jade, 0.1), withAlpha(P.Jade, 0.3)),
  elements: ElementColors,
  chart: ChartColors,
  ad: AdColors,
} as const;

export type OrtusColorScheme = typeof OrtusColors;
