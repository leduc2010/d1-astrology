import { type Brightness, type MainStar, PalaceRole } from '../../engine';
import type { ArrayKey } from '../../i18n';
import { itemOf, type UiText } from './uiText';

/* Readings for Tử Vi stars: brightness (Miếu … Hãm) and, per palace, what each main star brings. */

const PALACE_ARRAYS: Readonly<Record<PalaceRole, ArrayKey>> = {
  [PalaceRole.LIFE]: 'ziwei_stars_in_life',
  [PalaceRole.SIBLINGS]: 'ziwei_stars_in_siblings',
  [PalaceRole.SPOUSE]: 'ziwei_stars_in_spouse',
  [PalaceRole.CHILDREN]: 'ziwei_stars_in_children',
  [PalaceRole.WEALTH]: 'ziwei_stars_in_wealth',
  [PalaceRole.HEALTH]: 'ziwei_stars_in_health',
  [PalaceRole.TRAVEL]: 'ziwei_stars_in_travel',
  [PalaceRole.FRIENDS]: 'ziwei_stars_in_friends',
  [PalaceRole.CAREER]: 'ziwei_stars_in_career',
  [PalaceRole.PROPERTY]: 'ziwei_stars_in_property',
  [PalaceRole.FORTUNE]: 'ziwei_stars_in_fortune',
  [PalaceRole.PARENTS]: 'ziwei_stars_in_parents',
};

/** Miếu / Vượng / Đắc / Bình / Hãm. */
export const brightnessName = (t: UiText, b: Brightness): string => itemOf(t.ta('brightness_names'), b);

/** One calm sentence on how freely a star works at this brightness. */
export const brightnessBody = (t: UiText, b: Brightness): string => itemOf(t.ta('brightness_bodies'), b);

/** What a main star is like wherever it sits. */
export const starNature = (t: UiText, star: MainStar): string => itemOf(t.ta('ziwei_star_natures'), star);

/** What `star` brings to the palace of `role`. */
export const starInPalace = (t: UiText, star: MainStar, role: PalaceRole): string =>
  itemOf(t.ta(PALACE_ARRAYS[role]), star);
