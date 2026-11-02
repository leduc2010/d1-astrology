import {
  type Branch,
  type DayOfficer,
  type Direction,
  type Element,
  type Festival,
  festivalInfo,
  FestivalScope,
  type HourSpirit,
  isAuspiciousSpirit,
  type Mansion,
  type MoonPhase,
  type SolarTerm,
  type TenGod,
} from '../../engine';
import { mod } from '../../engine/util';
import { branchName } from './ganZhiText';
import { itemOf, type UiText } from './uiText';

/* Display text for the almanac's enums. Arrays are kept in engine order, one item per entry. */

const HOURS_PER_BRANCH = 2;
const HOURS_PER_DAY = 24;
const VIETNAMESE = 'vi';

export const officerName = (t: UiText, officer: DayOfficer): string => itemOf(t.ta('almanac_officers'), officer);
export const mansionName = (t: UiText, mansion: Mansion): string => itemOf(t.ta('almanac_mansions'), mansion);
export const spiritName = (t: UiText, spirit: HourSpirit): string => itemOf(t.ta('almanac_spirits'), spirit);
export const solarTermName = (t: UiText, term: SolarTerm): string => itemOf(t.ta('almanac_solar_terms'), term);
export const moonPhaseName = (t: UiText, phase: MoonPhase): string => itemOf(t.ta('almanac_moon_phases'), phase);
export const festivalName = (t: UiText, festival: Festival): string => itemOf(t.ta('almanac_festivals'), festival);
export const directionName = (t: UiText, direction: Direction): string =>
  itemOf(t.ta('almanac_directions'), direction);
export const elementName = (t: UiText, element: Element): string => itemOf(t.ta('element_names'), element);

/** The colour traditionally tied to an element ("jade green" for Wood). */
export const elementColorName = (t: UiText, element: Element): string => itemOf(t.ta('element_colors'), element);

export const tenGodName = (t: UiText, god: TenGod): string => itemOf(t.ta('ten_gods'), god);

/** What the day officer favours: "setting out, starting a job, applications". */
export const officerGood = (t: UiText, officer: DayOfficer): string => itemOf(t.ta('officer_good'), officer);

/** What the day officer advises against. */
export const officerAvoid = (t: UiText, officer: DayOfficer): string => itemOf(t.ta('officer_avoid'), officer);

/** "Good for …. Better to avoid …." for the day officer. */
export const officerAdvice = (t: UiText, officer: DayOfficer): string =>
  t.tf('officer_advice', officerGood(t, officer), officerAvoid(t, officer));

/** "Life Controller · auspicious day", worded by whether the spirit is a Hoàng đạo one. */
export const daySpiritText = (t: UiText, spirit: HourSpirit): string =>
  t.tf(isAuspiciousSpirit(spirit) ? 'day_spirit_good' : 'day_spirit_bad', spiritName(t, spirit));

/** "Snake hour" / "giờ Tỵ". */
export const hourShortName = (t: UiText, branch: Branch): string => t.tf('hour_short', branchName(t, branch));

/** Whole-hour span of a double hour: Zi is "23–1", Chou "1–3". */
export function hourRange(t: UiText, branch: Branch): string {
  const start = mod(branch * HOURS_PER_BRANCH - 1, HOURS_PER_DAY);
  return t.tf('hour_range', start, (start + HOURS_PER_BRANCH) % HOURS_PER_DAY);
}

/** Joins short phrases with the locale's list separator. */
export const listText = (t: UiText, items: readonly string[]): string => items.join(t.tf('list_separator'));

/** Vietnam-only observances are shown only to readers using Vietnamese. */
export function visibleFestivals(festivals: readonly Festival[], language: string): Festival[] {
  return festivals.filter((f) => festivalInfo(f).scope !== FestivalScope.VIETNAM || language === VIETNAMESE);
}
