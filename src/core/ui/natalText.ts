import { Planet } from '../../engine';
import { mod } from '../../engine/util';
import type { ArrayKey } from '../../i18n';
import { fillTemplate, itemOf, type UiText } from './uiText';

/* Natal readings: what a planet stands for, how it colours each sign, and the house it falls in. */

const SIGNS = 12;

const SIGN_ARRAYS: Readonly<Record<Planet, ArrayKey>> = {
  [Planet.SUN]: 'natal_sun_signs',
  [Planet.MOON]: 'natal_moon_signs',
  [Planet.MERCURY]: 'natal_mercury_signs',
  [Planet.VENUS]: 'natal_venus_signs',
  [Planet.MARS]: 'natal_mars_signs',
  [Planet.JUPITER]: 'natal_jupiter_signs',
  [Planet.SATURN]: 'natal_saturn_signs',
};

/** What `planet` stands for in any chart. */
export const planetNature = (t: UiText, planet: Planet): string => itemOf(t.ta('natal_planet_natures'), planet);

/** `planet` in zodiac sign `sign` (0 = Aries). */
export const planetInSign = (t: UiText, planet: Planet, sign: number): string =>
  itemOf(t.ta(SIGN_ARRAYS[planet]), mod(sign, SIGNS));

/** The rising sign `sign` (0 = Aries). */
export const risingInSign = (t: UiText, sign: number): string => itemOf(t.ta('natal_rising_signs'), mod(sign, SIGNS));

/** `planet` in whole-sign house `house` (1 … 12). */
export const planetInHouse = (t: UiText, planet: Planet, house: number): string =>
  fillTemplate(itemOf(t.ta('natal_planet_in_house'), planet), itemOf(t.ta('natal_house_focus'), mod(house - 1, SIGNS)));

/** The life areas house `house` (1 … 12) speaks to. */
export const houseArea = (t: UiText, house: number): string => itemOf(t.ta('natal_house_areas'), mod(house - 1, SIGNS));
