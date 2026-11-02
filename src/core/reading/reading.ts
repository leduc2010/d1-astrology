import { pillarsStrength, type ResolvedBirth } from '../data/chart/resolvedBirth';
import {
  type Branch,
  branchClash,
  branchElement,
  branchOfRole,
  controls,
  type DayMasterStrength,
  Element,
  elementBalance,
  ELEMENTS,
  mainStarElement,
  type MainStar,
  mainStarsIn,
  type NatalChart,
  PalaceRole,
  Planet,
  type Stem,
  type StemBranch,
  stemElement,
  ZodiacElement,
  ZODIAC_ELEMENTS,
  type ZiWeiChart,
} from '../../engine';
import { maxBy } from '../../engine/util';
import { readingDetailsOf, type ReadingDetail } from './readingDetails';
import { BaZiSignal, ReadingSystem, Tone, Topic, TOPICS } from './readingEnums';

const ELEMENT_TONES: Readonly<Record<Element, Tone>> = {
  [Element.WOOD]: Tone.BRIGHT,
  [Element.FIRE]: Tone.DRIVE,
  [Element.EARTH]: Tone.STEADY,
  [Element.METAL]: Tone.STEADY,
  [Element.WATER]: Tone.DEEP,
};

const ZODIAC_ELEMENT_TONES: Readonly<Record<ZodiacElement, Tone>> = {
  [ZodiacElement.FIRE]: Tone.DRIVE,
  [ZodiacElement.EARTH]: Tone.STEADY,
  [ZodiacElement.AIR]: Tone.BRIGHT,
  [ZodiacElement.WATER]: Tone.DEEP,
};

export const elementTone = (element: Element): Tone => ELEMENT_TONES[element];
export const zodiacElementTone = (element: ZodiacElement): Tone => ZODIAC_ELEMENT_TONES[element];

/** Tone of a sign (0 Aries … 11 Pisces) through its element. */
const signTone = (sign: number): Tone =>
  zodiacElementTone((sign % ZODIAC_ELEMENTS.length) as ZodiacElement);

type FactBase = { readonly system: ReadingSystem; readonly tone: Tone };

/** Main stars of a Tử Vi palace; [borrowed] when the palace is empty and reads its opposite. */
export type ZiWeiPalaceFact = FactBase & {
  readonly kind: 'ZiWeiPalace';
  readonly role: PalaceRole;
  readonly stars: readonly MainStar[];
  readonly borrowed: boolean;
};
export type BaZiStemFact = FactBase & { readonly kind: 'BaZiStem'; readonly signal: BaZiSignal; readonly stem: Stem };
export type BaZiBranchFact = FactBase & {
  readonly kind: 'BaZiBranch';
  readonly signal: BaZiSignal;
  readonly branch: Branch;
};
export type BaZiElementFact = FactBase & {
  readonly kind: 'BaZiElement';
  readonly signal: BaZiSignal;
  readonly element: Element;
};
/** A planet's sign (0 Aries … 11 Pisces). */
export type PlanetSignFact = FactBase & { readonly kind: 'PlanetSign'; readonly planet: Planet; readonly sign: number };
/** The sign on a whole-sign house cusp. */
export type HouseSignFact = FactBase & { readonly kind: 'HouseSign'; readonly house: number; readonly sign: number };

/** One system's evidence for a topic; `system` and `tone` are filled in by the builders below. */
export type ReadingFact =
  | ZiWeiPalaceFact
  | BaZiStemFact
  | BaZiBranchFact
  | BaZiElementFact
  | PlanetSignFact
  | HouseSignFact;

/** Builders that work out each fact's system and tone, as the Kotlin data classes did. */
export const ReadingFacts = Object.freeze({
  ziWeiPalace: (role: PalaceRole, stars: readonly MainStar[], borrowed: boolean): ZiWeiPalaceFact => ({
    kind: 'ZiWeiPalace',
    role,
    stars,
    borrowed,
    system: ReadingSystem.ZIWEI,
    // Callers never build a palace fact without stars; the first star sets the palace's tone.
    tone: elementTone(mainStarElement(stars[0]!)),
  }),
  baZiStem: (signal: BaZiSignal, stem: Stem): BaZiStemFact => ({
    kind: 'BaZiStem',
    signal,
    stem,
    system: ReadingSystem.BAZI,
    tone: elementTone(stemElement(stem)),
  }),
  baZiBranch: (signal: BaZiSignal, branch: Branch): BaZiBranchFact => ({
    kind: 'BaZiBranch',
    signal,
    branch,
    system: ReadingSystem.BAZI,
    tone: elementTone(branchElement(branch)),
  }),
  baZiElement: (signal: BaZiSignal, element: Element): BaZiElementFact => ({
    kind: 'BaZiElement',
    signal,
    element,
    system: ReadingSystem.BAZI,
    tone: elementTone(element),
  }),
  planetSign: (planet: Planet, sign: number): PlanetSignFact => ({
    kind: 'PlanetSign',
    planet,
    sign,
    system: ReadingSystem.WESTERN,
    tone: signTone(sign),
  }),
  houseSign: (house: number, sign: number): HouseSignFact => ({
    kind: 'HouseSign',
    house,
    sign,
    system: ReadingSystem.WESTERN,
    tone: signTone(sign),
  }),
});

/**
 * What the systems say about one topic. [tone] is the tone most systems share (ties go to the
 * system listed first) and [agreement] how many of the [facts] point to it. [details] are the
 * supporting signals read one by one; they do not count toward the agreement.
 */
export interface TopicReading {
  readonly topic: Topic;
  readonly facts: readonly ReadingFact[];
  readonly tone: Tone;
  readonly agreement: number;
  readonly details: readonly ReadingDetail[];
  /** How many systems had something to say (`facts.length`). */
  readonly available: number;
  /** Facts that point to another tone. */
  readonly dissenting: readonly ReadingFact[];
}

export function topicReading(
  topic: Topic,
  facts: readonly ReadingFact[],
  tone: Tone,
  agreement: number,
  details: readonly ReadingDetail[] = [],
): TopicReading {
  return Object.freeze({
    topic,
    facts,
    tone,
    agreement,
    details,
    available: facts.length,
    dissenting: facts.filter((f) => f.tone !== tone),
  });
}

/** The fact [system] gave for [reading], if any. */
export const factFor = (reading: TopicReading, system: ReadingSystem): ReadingFact | null =>
  reading.facts.find((f) => f.system === system) ?? null;

/** Charts worked out once for a birth, so every topic reads from the same data. */
export interface ReadingCharts {
  readonly natal: NatalChart;
  /** False when the birth time is unknown and the Moon changed sign that day. */
  readonly isMoonCertain: boolean;
  readonly ziWei: ZiWeiChart | null;
  readonly dayMaster: Stem;
  readonly monthStem: Stem;
  readonly dayBranch: Branch;
  readonly yearBranch: Branch;
  readonly balance: ReadonlyMap<Element, number>;
  readonly strength: DayMasterStrength;
}

export function readingCharts(birth: ResolvedBirth): ReadingCharts {
  const pillars = birth.pillars();
  const known: StemBranch[] = [pillars.year, pillars.month, pillars.day];
  if (pillars.hour) known.push(pillars.hour);
  return Object.freeze({
    natal: birth.natal(),
    isMoonCertain: birth.moonSigns().length === 1,
    ziWei: birth.ziWei(),
    dayMaster: pillars.day.stem,
    monthStem: pillars.month.stem,
    dayBranch: pillars.day.branch,
    yearBranch: pillars.year.branch,
    balance: elementBalance(known),
    strength: pillarsStrength(pillars),
  });
}

const CAREER_HOUSE = 10;
const MONEY_HOUSE = 2;
const HOME_HOUSE = 4;
const SIGNS = 12;

const TOPIC_PALACES: Readonly<Record<Topic, PalaceRole>> = {
  [Topic.PERSONALITY]: PalaceRole.LIFE,
  [Topic.CAREER]: PalaceRole.CAREER,
  [Topic.LOVE]: PalaceRole.SPOUSE,
  [Topic.MONEY]: PalaceRole.WEALTH,
  [Topic.FAMILY]: PalaceRole.PROPERTY,
  [Topic.WELLBEING]: PalaceRole.FORTUNE,
};

/** Main stars of [role]'s palace, borrowing the opposite palace's when it has none. */
function palaceFact(chart: ZiWeiChart, role: PalaceRole): ZiWeiPalaceFact | null {
  const branch = branchOfRole(chart, role);
  const own = mainStarsIn(chart, branch);
  if (own.length > 0) return ReadingFacts.ziWeiPalace(role, own, false);
  const opposite = mainStarsIn(chart, branchClash(branch));
  return opposite.length > 0 ? ReadingFacts.ziWeiPalace(role, opposite, true) : null;
}

function ziWeiFact(charts: ReadingCharts, topic: Topic): ReadingFact | null {
  return charts.ziWei ? palaceFact(charts.ziWei, TOPIC_PALACES[topic]) : null;
}

function baZiFact(charts: ReadingCharts, topic: Topic): ReadingFact {
  switch (topic) {
    case Topic.PERSONALITY:
      return ReadingFacts.baZiStem(BaZiSignal.DAY_MASTER, charts.dayMaster);
    case Topic.CAREER:
      return ReadingFacts.baZiStem(BaZiSignal.MONTH_STEM, charts.monthStem);
    case Topic.LOVE:
      return ReadingFacts.baZiBranch(BaZiSignal.DAY_BRANCH, charts.dayBranch);
    case Topic.MONEY:
      return ReadingFacts.baZiElement(BaZiSignal.WEALTH_ELEMENT, controls(stemElement(charts.dayMaster)));
    case Topic.FAMILY:
      return ReadingFacts.baZiBranch(BaZiSignal.YEAR_BRANCH, charts.yearBranch);
    case Topic.WELLBEING:
      return ReadingFacts.baZiElement(
        BaZiSignal.STRONGEST_ELEMENT,
        maxBy(ELEMENTS, (e) => charts.balance.get(e) ?? 0),
      );
  }
}

function planetFact(natal: NatalChart, planet: Planet): ReadingFact | null {
  const position = natal.planets.get(planet);
  return position ? ReadingFacts.planetSign(planet, position.sign) : null;
}

function houseFact(natal: NatalChart, house: number): ReadingFact | null {
  return natal.ascendant ? ReadingFacts.houseSign(house, (natal.ascendant.sign + house - 1) % SIGNS) : null;
}

/**
 * Houses need the rising sign; without a birth time a planet stands in for the house. A Moon
 * that may sit in either of two signs gives no fact rather than a guess.
 */
function westernFact(charts: ReadingCharts, topic: Topic): ReadingFact | null {
  const natal = charts.natal;
  const moon = charts.isMoonCertain ? planetFact(natal, Planet.MOON) : null;
  switch (topic) {
    case Topic.PERSONALITY:
      return planetFact(natal, Planet.SUN);
    case Topic.CAREER:
      return houseFact(natal, CAREER_HOUSE) ?? planetFact(natal, Planet.SATURN);
    case Topic.LOVE:
      return planetFact(natal, Planet.VENUS);
    case Topic.MONEY:
      return houseFact(natal, MONEY_HOUSE) ?? planetFact(natal, Planet.JUPITER);
    case Topic.FAMILY:
      return houseFact(natal, HOME_HOUSE) ?? moon;
    case Topic.WELLBEING:
      return moon;
  }
}

function topic(charts: ReadingCharts, which: Topic): TopicReading {
  const facts = [ziWeiFact(charts, which), baZiFact(charts, which), westernFact(charts, which)].filter(
    (f): f is ReadingFact => f !== null,
  );
  const counts = new Map<Tone, number>();
  facts.forEach((f) => counts.set(f.tone, (counts.get(f.tone) ?? 0) + 1));
  const best = Math.max(0, ...counts.values());
  // Ties go to the system listed first.
  const tone = facts.find((f) => counts.get(f.tone) === best)?.tone ?? Tone.STEADY;
  return topicReading(which, facts, tone, best, readingDetailsOf(charts, which));
}

/** Reads every topic from one birth's charts. */
export const Readings = Object.freeze({
  all: (charts: ReadingCharts): TopicReading[] => TOPICS.map((t) => topic(charts, t)),
  topic,
  palaceFact,
});
