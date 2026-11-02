import {
  AspectKind,
  type Bureau,
  type LifeStage,
  type MainStar,
  type MinorStar,
  naYinIndex,
  type PalaceRole,
  type Planet,
  type StemBranch,
  Transformation,
  ZodiacElement,
} from '../../engine';
import { mod } from '../../engine/util';
import { ChartColors, type ToneColors } from '../../designsystem/theme/colors';
import { itemOf, type UiText } from './uiText';

/* Display text and colours for the chart engines (Bát Tự, Tử Vi, natal). Arrays follow engine order. */

const PLANET_GLYPHS = '☉☽☿♀♂♃♄';
const SIGN_GLYPHS = '♈♉♊♋♌♍♎♏♐♑♒♓';
/** Forces text (not emoji) presentation of a symbol. */
const TEXT_PRESENTATION = String.fromCharCode(0xfe0e);

export const lifeStageName = (t: UiText, stage: LifeStage): string => itemOf(t.ta('chart_life_stages'), stage);

/** Nạp âm sound of a pillar: "Mountain Fire" / "Sơn Đầu Hỏa". */
export const naYinName = (t: UiText, pair: StemBranch): string => itemOf(t.ta('chart_nayin_names'), naYinIndex(pair));

export const palaceRoleName = (t: UiText, role: PalaceRole): string => itemOf(t.ta('chart_palace_roles'), role);
export const mainStarName = (t: UiText, star: MainStar): string => itemOf(t.ta('chart_main_stars'), star);
export const minorStarName = (t: UiText, star: MinorStar): string => itemOf(t.ta('chart_minor_stars'), star);
export const transformationName = (t: UiText, tr: Transformation): string =>
  itemOf(t.ta('chart_transformations'), tr);

/** One-word badge: "Lộc", "Quyền", "Khoa", "Kỵ". */
export const transformationShortName = (t: UiText, tr: Transformation): string =>
  itemOf(t.ta('chart_transformations_short'), tr);

export const bureauName = (t: UiText, bureau: Bureau): string => itemOf(t.ta('chart_bureaus'), bureau);
export const planetName = (t: UiText, planet: Planet): string => itemOf(t.ta('chart_planets'), planet);
export const aspectName = (t: UiText, kind: AspectKind): string => itemOf(t.ta('chart_aspects'), kind);
export const zodiacElementName = (t: UiText, element: ZodiacElement): string =>
  itemOf(t.ta('chart_zodiac_elements'), element);

/** Astronomical glyph of a planet, forced to text presentation. */
export const planetGlyph = (planet: Planet): string => (PLANET_GLYPHS[planet] ?? '') + TEXT_PRESENTATION;

/** Glyph of the zodiac sign 0 (Aries) … 11 (Pisces), forced to text presentation. */
export const zodiacGlyph = (sign: number): string =>
  (SIGN_GLYPHS[mod(sign, SIGN_GLYPHS.length)] ?? '') + TEXT_PRESENTATION;

const TRANSFORMATION_COLORS: Readonly<Record<Transformation, ToneColors>> = {
  [Transformation.PROSPERITY]: ChartColors.prosperity,
  [Transformation.POWER]: ChartColors.power,
  [Transformation.FAME]: ChartColors.fame,
  [Transformation.OBSTACLE]: ChartColors.obstacle,
};

const ZODIAC_ELEMENT_COLORS: Readonly<Record<ZodiacElement, string>> = {
  [ZodiacElement.FIRE]: ChartColors.zodiacFire,
  [ZodiacElement.EARTH]: ChartColors.zodiacEarth,
  [ZodiacElement.AIR]: ChartColors.zodiacAir,
  [ZodiacElement.WATER]: ChartColors.zodiacWater,
};

/** Line colour of an aspect: soft (flowing), hard (tense) or fused (conjunction). */
const ASPECT_COLORS: Readonly<Record<AspectKind, string>> = {
  [AspectKind.CONJUNCTION]: ChartColors.aspectFused,
  [AspectKind.SEXTILE]: ChartColors.aspectSoft,
  [AspectKind.TRINE]: ChartColors.aspectSoft,
  [AspectKind.SQUARE]: ChartColors.aspectHard,
  [AspectKind.OPPOSITION]: ChartColors.aspectHard,
};

export const transformationColors = (tr: Transformation): ToneColors => TRANSFORMATION_COLORS[tr];
export const zodiacElementColor = (element: ZodiacElement): string => ZODIAC_ELEMENT_COLORS[element];
export const aspectColor = (kind: AspectKind): string => ASPECT_COLORS[kind];
