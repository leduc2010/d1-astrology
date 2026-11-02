import type { TextStyle } from 'react-native';

import { OrtusFontFamily as F } from './fonts';

export type OrtusTextStyle = Readonly<
  Pick<TextStyle, 'fontFamily' | 'fontSize' | 'lineHeight' | 'letterSpacing' | 'includeFontPadding'>
>;

/** Kotlin `style()`: letter spacing is given in em, RN wants dp, so multiply by the size. */
function style(family: string, size: number, lineHeight?: number, letterSpacingEm = 0): OrtusTextStyle {
  return {
    fontFamily: family,
    fontSize: size,
    lineHeight: lineHeight ?? Math.floor(size * 1.25),
    letterSpacing: Number((letterSpacingEm * size).toFixed(3)),
    includeFontPadding: false,
  };
}

/**
 * Type scale (mirrors Kotlin `OrtusTypography`). Styles carry no color: components pick a
 * semantic color from `OrtusColors` so a style can be reused on any surface.
 */
export const OrtusTypography = {
  hero: style(F.cormorantBold, 46, 50),
  display: style(F.cormorantBold, 40, 44),
  dayNumber: style(F.cormorantBold, 64, 64),
  /** The giant date on a day page. */
  dayHero: style(F.cormorantBold, 144, 124),
  /** Badge numeral beside list rows (upcoming days). */
  dateBadge: style(F.cormorantBold, 22, 24),
  h1: style(F.cormorantSemiBold, 32, 38),
  h2: style(F.cormorantSemiBold, 24, 30),
  /** A plan's price on the paywall. */
  price: style(F.cormorantBold, 24, 28),
  headerTitle: style(F.cormorantSemiBold, 21, 26),
  monogram: style(F.cormorantBold, 18, 22),
  subtitle: style(F.beVietnamSemiBold, 17, 24),
  title: style(F.beVietnamSemiBold, 15, 20),
  label: style(F.beVietnamSemiBold, 11, 14, 0.14),
  body: style(F.beVietnamRegular, 15, 22),
  bodyMedium: style(F.beVietnamMedium, 15, 22),
  callout: style(F.beVietnamRegular, 14, 20),
  caption: style(F.beVietnamRegular, 13, 18),
  captionStrong: style(F.beVietnamSemiBold, 13, 18),
  /** Solar date in a month grid cell; the strong cut marks today. */
  calendarDay: style(F.beVietnamRegular, 16, 20),
  calendarDayStrong: style(F.beVietnamBold, 16, 20),
  captionSmall: style(F.beVietnamRegular, 12, 16),
  /** Tile labels and chip captions. */
  footnote: style(F.beVietnamRegular, 11, 14),
  /** Second line of compact cells. */
  micro: style(F.beVietnamRegular, 10, 13),
  microStrong: style(F.beVietnamSemiBold, 10, 13),
  tag: style(F.beVietnamSemiBold, 12, 15),
  button: style(F.beVietnamSemiBold, 16, 20),
  buttonSmall: style(F.beVietnamSemiBold, 14, 18),
  link: style(F.beVietnamSemiBold, 15, 19),
  tab: style(F.beVietnamMedium, 10, 13),
  tabSelected: style(F.beVietnamSemiBold, 10, 13),
  /** Big figure inside a glow card. */
  figure: style(F.cormorantBold, 32, 38),
  wheelSelected: style(F.beVietnamSemiBold, 22, 28),
  wheelSelectedLarge: style(F.beVietnamSemiBold, 26, 32),
  wheelNear: style(F.beVietnamRegular, 17, 22),
  wheelFar: style(F.beVietnamRegular, 15, 20),
  han: style(F.notoSerifBold, 28, 36),
  hanMedium: style(F.notoSerifBold, 20, 28),
  hanSmall: style(F.notoSerifRegular, 16, 22),
  hanTag: style(F.notoSerifSemiBold, 12, 16),
  /** A planet glyph standing alone. */
  astroGlyph: style(F.beVietnamRegular, 18, 20),
  /** Tiny caps inside chart cells and star names. */
  nano: style(F.beVietnamBold, 9, 11, 0.08),
} as const;

export type OrtusTypeVariant = keyof typeof OrtusTypography;

/** Serif headings balance their lines so a wrapped title never leaves one word alone (`LineBreak.Heading`). */
export function isBalancedVariant(variant: OrtusTypeVariant): boolean {
  return OrtusTypography[variant].fontFamily?.startsWith('CormorantGaramond') ?? false;
}
