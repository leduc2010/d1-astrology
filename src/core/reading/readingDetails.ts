import {
  branchClash,
  branchOfRole,
  type Brightness,
  brightnessIn,
  type DayMasterStrength,
  type Element,
  houseOf,
  type MainStar,
  mainStarsIn,
  type NatalChart,
  PalaceRole,
  Planet,
  PLANETS,
  type StrengthLevel,
  type ZiWeiChart,
} from '../../engine';
import type { ReadingCharts } from './reading';
import { ReadingSystem, Topic } from './readingEnums';

type DetailBase = { readonly system: ReadingSystem };

/** A main star read in [role]; [borrowed] when the palace is empty and reads its opposite. */
export type StarInPalaceDetail = DetailBase & {
  readonly kind: 'StarInPalace';
  readonly star: MainStar;
  readonly role: PalaceRole;
  readonly brightness: Brightness;
  readonly borrowed: boolean;
};
export type DayMasterLevelDetail = DetailBase & { readonly kind: 'DayMasterLevel'; readonly level: StrengthLevel };
/** Fields of work that carry the useful element (Dụng thần). */
export type UsefulFieldsDetail = DetailBase & { readonly kind: 'UsefulFields'; readonly element: Element };
/** Everyday habits that bring in the useful element. */
export type UsefulHabitsDetail = DetailBase & { readonly kind: 'UsefulHabits'; readonly element: Element };
/** How the day master's strength carries its wealth element. */
export type WealthCapacityDetail = DetailBase & { readonly kind: 'WealthCapacity'; readonly level: StrengthLevel };
/** A planet's sign (0 Aries … 11 Pisces). */
export type PlanetInSignDetail = DetailBase & { readonly kind: 'PlanetInSign'; readonly planet: Planet; readonly sign: number };
/** A planet's whole-sign house, 1..12; needs the birth time. */
export type PlanetInHouseDetail = DetailBase & {
  readonly kind: 'PlanetInHouse';
  readonly planet: Planet;
  readonly house: number;
};
export type RisingDetail = DetailBase & { readonly kind: 'Rising'; readonly sign: number };

/**
 * A supporting signal behind a topic, beyond each system's headline `ReadingFact`: a star in its
 * palace, a planet in its sign or house, or what the day master's strength suggests. Each one has
 * its own written reading, so the article and Ask AI can go deeper than the shared tone.
 */
export type ReadingDetail =
  | StarInPalaceDetail
  | DayMasterLevelDetail
  | UsefulFieldsDetail
  | UsefulHabitsDetail
  | WealthCapacityDetail
  | PlanetInSignDetail
  | PlanetInHouseDetail
  | RisingDetail;

const ZIWEI = ReadingSystem.ZIWEI;
const BAZI = ReadingSystem.BAZI;
const WESTERN = ReadingSystem.WESTERN;

/** Builders that stamp each detail with its system. */
export const ReadingDetails = Object.freeze({
  starInPalace: (star: MainStar, role: PalaceRole, brightness: Brightness, borrowed: boolean): StarInPalaceDetail => ({
    kind: 'StarInPalace',
    star,
    role,
    brightness,
    borrowed,
    system: ZIWEI,
  }),
  dayMasterLevel: (level: StrengthLevel): DayMasterLevelDetail => ({ kind: 'DayMasterLevel', level, system: BAZI }),
  usefulFields: (element: Element): UsefulFieldsDetail => ({ kind: 'UsefulFields', element, system: BAZI }),
  usefulHabits: (element: Element): UsefulHabitsDetail => ({ kind: 'UsefulHabits', element, system: BAZI }),
  wealthCapacity: (level: StrengthLevel): WealthCapacityDetail => ({ kind: 'WealthCapacity', level, system: BAZI }),
  planetInSign: (planet: Planet, sign: number): PlanetInSignDetail => ({ kind: 'PlanetInSign', planet, sign, system: WESTERN }),
  planetInHouse: (planet: Planet, house: number): PlanetInHouseDetail => ({
    kind: 'PlanetInHouse',
    planet,
    house,
    system: WESTERN,
  }),
  rising: (sign: number): RisingDetail => ({ kind: 'Rising', sign, system: WESTERN }),
});

export const MAX_DETAILS = 5;
const CAREER_HOUSE = 10;
const PARTNER_HOUSE = 7;
const MONEY_HOUSE = 2;
const HOME_HOUSE = 4;
const HEALTH_HOUSE = 6;

/**
 * Picks up to [MAX_DETAILS] details per topic, taking from the systems in turn so a cap never
 * leaves one system out. Signals that need a birth time, or a Moon sign that is not certain, are
 * left out rather than guessed.
 */
export function readingDetailsOf(charts: ReadingCharts, topic: Topic): ReadingDetail[] {
  return interleave([ziWei(charts.ziWei, topic), baZi(charts.strength, topic), western(charts, topic)]).slice(
    0,
    MAX_DETAILS,
  );
}

function ziWei(chart: ZiWeiChart | null, topic: Topic): ReadingDetail[] {
  if (!chart) return [];
  switch (topic) {
    case Topic.PERSONALITY:
      return stars(chart, PalaceRole.LIFE);
    case Topic.CAREER:
      return stars(chart, PalaceRole.CAREER);
    case Topic.LOVE:
      return stars(chart, PalaceRole.SPOUSE);
    case Topic.MONEY:
      return stars(chart, PalaceRole.WEALTH);
    case Topic.FAMILY:
      return [...stars(chart, PalaceRole.PROPERTY).slice(0, 1), ...stars(chart, PalaceRole.PARENTS).slice(0, 1)];
    case Topic.WELLBEING:
      return [...stars(chart, PalaceRole.FORTUNE).slice(0, 1), ...stars(chart, PalaceRole.HEALTH).slice(0, 1)];
  }
}

/** The palace's own main stars, or its opposite's when it has none, each at its own brightness. */
function stars(chart: ZiWeiChart, role: PalaceRole): ReadingDetail[] {
  const branch = branchOfRole(chart, role);
  const own = mainStarsIn(chart, branch);
  const borrowed = own.length === 0;
  const source = borrowed ? branchClash(branch) : branch;
  const found = borrowed ? mainStarsIn(chart, source) : own;
  return found.map((star) => ReadingDetails.starInPalace(star, role, brightnessIn(star, source), borrowed));
}

function baZi(strength: DayMasterStrength, topic: Topic): ReadingDetail[] {
  switch (topic) {
    case Topic.PERSONALITY:
      return [ReadingDetails.dayMasterLevel(strength.level)];
    case Topic.CAREER:
      return [ReadingDetails.usefulFields(strength.useful)];
    case Topic.LOVE:
    case Topic.FAMILY:
      return [];
    case Topic.MONEY:
      return [ReadingDetails.wealthCapacity(strength.level)];
    case Topic.WELLBEING:
      return [ReadingDetails.usefulHabits(strength.useful)];
  }
}

function western(charts: ReadingCharts, topic: Topic): ReadingDetail[] {
  const natal = charts.natal;
  const moon = charts.isMoonCertain ? present(sign(natal, Planet.MOON)) : [];
  switch (topic) {
    case Topic.PERSONALITY: {
      const rising = natal.ascendant ? ReadingDetails.rising(natal.ascendant.sign) : null;
      return [...present(sign(natal, Planet.SUN), rising), ...moon];
    }
    case Topic.CAREER:
      return [...present(sign(natal, Planet.SATURN)), ...inHouse(natal, CAREER_HOUSE)];
    case Topic.LOVE:
      return [...present(sign(natal, Planet.VENUS), sign(natal, Planet.MARS)), ...inHouse(natal, PARTNER_HOUSE)];
    case Topic.MONEY:
      return [...present(sign(natal, Planet.JUPITER)), ...inHouse(natal, MONEY_HOUSE)];
    case Topic.FAMILY:
      return [...moon, ...inHouse(natal, HOME_HOUSE)];
    case Topic.WELLBEING:
      return [...moon, ...inHouse(natal, HEALTH_HOUSE)];
  }
}

function sign(natal: NatalChart, planet: Planet): ReadingDetail | null {
  const position = natal.planets.get(planet);
  return position ? ReadingDetails.planetInSign(planet, position.sign) : null;
}

/** Planets standing in [house]; none without a birth time. */
function inHouse(natal: NatalChart, house: number): ReadingDetail[] {
  return PLANETS.filter((p) => houseOf(natal, p) === house).map((p) => ReadingDetails.planetInHouse(p, house));
}

const present = (...items: (ReadingDetail | null)[]): ReadingDetail[] =>
  items.filter((d): d is ReadingDetail => d !== null);

/** First of each list, then the second of each, and so on. */
function interleave<T>(lists: readonly (readonly T[])[]): T[] {
  const longest = Math.max(0, ...lists.map((l) => l.length));
  return Array.from({ length: longest }, (_, i) => i).flatMap((i) =>
    lists.flatMap((l) => (i < l.length ? [l[i]!] : [])),
  );
}
