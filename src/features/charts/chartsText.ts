import { Gender } from '@/core/model';
import {
  branchName,
  bureauName,
  elementName,
  itemOf,
  mainStarName,
  minorStarName,
  stemName,
  zodiacSignName,
  zodiacSignNameOf,
  type UiText,
} from '@/core/ui';
import { Planet, stemElement, stemIsYang, type Element, type NatalChart, type Stem, type ZiWeiStar } from '@/engine';

import { decadeEndAge, palaceOf, type NatalView, type PalaceView, type ZiWeiView } from './model/chartViews';

/* Text shared by the hub and the chart pages. */

export const starName = (t: UiText, star: ZiWeiStar): string =>
  star.kind === 'main' ? mainStarName(t, star.star) : minorStarName(t, star.star);

/** Main stars of a palace joined by a dash, or "No major star". */
export function mainStarsText(t: UiText, palace: PalaceView): string {
  if (palace.mainStars.length === 0) return t.tf('charts_no_main_star');
  return palace.mainStars.map((m) => starName(t, m.star)).join(t.tf('charts_star_separator'));
}

/** "Thái Dương – Cự Môn in Dần". */
export const palaceHeadline = (t: UiText, palace: PalaceView): string =>
  t.tf('charts_palace_headline', mainStarsText(t, palace), branchName(t, palace.branch));

/** "Earth 5 bureau · Decade 25–34", or just the bureau before the first decade starts. */
export function ziWeiSummary(t: UiText, ziWei: ZiWeiView): string {
  const bureau = bureauName(t, ziWei.bureau);
  if (ziWei.currentDecade === null) return bureau;
  const decade = palaceOf(ziWei, ziWei.currentDecade);
  return t.tf('charts_ziwei_summary', bureau, decade.decadeStartAge, decadeEndAge(decade));
}

/** "Day master Mậu Earth". */
export const dayMasterText = (t: UiText, stem: Stem): string =>
  t.tf('charts_day_master_headline', stemName(t, stem), elementName(t, stemElement(stem)));

/** "Wood 3 · Earth 2 · Water 1", leaving out absent elements. */
export const balanceSummary = (t: UiText, balance: readonly (readonly [Element, number])[]): string =>
  balance
    .filter(([, count]) => count > 0)
    .map(([element, count]) => t.tf('charts_count', elementName(t, element), count))
    .join(t.tf('charts_dot_separator'));

/** "Sun Leo 22°". */
export function sunHeadline(t: UiText, chart: NatalChart): string {
  const sun = chart.planets.get(Planet.SUN);
  if (!sun) throw new Error('natal chart has no Sun');
  return t.tf('charts_sun_headline', zodiacSignName(t, sun.longitude), sun.degree);
}

/** "Moon in Aries · Rising Scorpio"; the rising sign only with a birth time. */
export function moonAndRising(t: UiText, natal: NatalView): string {
  const moon = t.tf('charts_moon_in', moonSignText(t, natal));
  const asc = natal.chart.ascendant;
  const rising = asc ? t.tf('charts_rising_in', zodiacSignName(t, asc.longitude)) : null;
  return [moon, rising].filter((s): s is string => s !== null).join(t.tf('charts_dot_separator'));
}

/** The Moon's sign, or "Aries or Taurus" when an unknown birth time leaves two. */
export function moonSignText(t: UiText, natal: NatalView): string {
  const signs = natal.moonSigns.map((sign) => zodiacSignNameOf(t, sign));
  if (signs.length === 1) return signs[0]!;
  return t.tf('charts_sign_either', signs[0] ?? '', signs[signs.length - 1] ?? '');
}

const POLARITY_FEMALE_OFFSET = 2;

/** "Yin female": the year stem's polarity with the person's gender, which sets the direction of luck. */
export function polarityText(t: UiText, yearStem: Stem, gender: Gender): string {
  const index = (stemIsYang(yearStem) ? 0 : 1) + (gender === Gender.MALE ? 0 : POLARITY_FEMALE_OFFSET);
  return itemOf(t.ta('charts_polarity'), index);
}
