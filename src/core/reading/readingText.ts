import { InsightSource } from '../../designsystem';
import { branchElement, stemElement } from '../../engine';
import type { ArrayKey } from '../../i18n';
import { elementName } from '../ui/almanacText';
import { mainStarName, palaceRoleName, planetName } from '../ui/chartText';
import { animalName, branchHan, stemHan, stemName, zodiacSignNameOf } from '../ui/ganZhiText';
import { capitalized, itemOf, type UiText } from '../ui/uiText';
import type { ReadingFact } from './reading';
import { type BaZiSignal, ReadingSystem, type Tone, Topic } from './readingEnums';

const HEADLINES: Readonly<Record<Topic, ArrayKey>> = {
  [Topic.PERSONALITY]: 'reading_headlines_personality',
  [Topic.CAREER]: 'reading_headlines_career',
  [Topic.LOVE]: 'reading_headlines_love',
  [Topic.MONEY]: 'reading_headlines_money',
  [Topic.FAMILY]: 'reading_headlines_family',
  [Topic.WELLBEING]: 'reading_headlines_wellbeing',
};

const BODIES: Readonly<Record<Topic, ArrayKey>> = {
  [Topic.PERSONALITY]: 'reading_bodies_personality',
  [Topic.CAREER]: 'reading_bodies_career',
  [Topic.LOVE]: 'reading_bodies_love',
  [Topic.MONEY]: 'reading_bodies_money',
  [Topic.FAMILY]: 'reading_bodies_family',
  [Topic.WELLBEING]: 'reading_bodies_wellbeing',
};

const SOURCES: Readonly<Record<ReadingSystem, InsightSource>> = {
  [ReadingSystem.ZIWEI]: InsightSource.TuVi,
  [ReadingSystem.BAZI]: InsightSource.BatTu,
  [ReadingSystem.WESTERN]: InsightSource.Astrology,
};

export const topicName = (t: UiText, topic: Topic): string => itemOf(t.ta('reading_topics'), topic);

export const topicHeadline = (t: UiText, topic: Topic, tone: Tone): string => itemOf(t.ta(HEADLINES[topic]), tone);

export const topicBody = (t: UiText, topic: Topic, tone: Tone): string => itemOf(t.ta(BODIES[topic]), tone);

/** "leans toward depth and intuition": finishes a sentence that starts with a system name. */
export const toneLine = (t: UiText, tone: Tone): string => itemOf(t.ta('reading_tone_lines'), tone);

/** [toneLine] standing on its own line: "Leans toward depth and intuition". */
export const toneSentence = (t: UiText, tone: Tone): string => capitalized(toneLine(t, tone), t.language);

export const systemName = (t: UiText, system: ReadingSystem): string => itemOf(t.ta('reading_systems'), system);

/** The designsystem source chip for a reading system. */
export const systemSource = (system: ReadingSystem): InsightSource => SOURCES[system];

const signalName = (t: UiText, signal: BaZiSignal): string => itemOf(t.ta('reading_bazi_signals'), signal);

/** A name followed by its Han glyph, once only where the name already is the glyph (Chinese). */
const withHan = (t: UiText, name: string, han: string): string =>
  name === han ? name : t.tf('reading_name_with_han', name, han);

/** The chart detail behind a fact: "Life · Zi Wei – Tian Fu", "Day master Jia 甲 (Wood)", "Venus in Taurus". */
export function factLabel(t: UiText, fact: ReadingFact): string {
  const { tf } = t;
  switch (fact.kind) {
    case 'ZiWeiPalace': {
      const stars = fact.stars.map((s) => mainStarName(t, s)).join(tf('reading_star_separator'));
      const key = fact.borrowed ? 'reading_fact_palace_borrowed' : 'reading_fact_palace';
      return tf(key, palaceRoleName(t, fact.role), stars);
    }
    case 'BaZiStem':
      return tf(
        'reading_fact_named',
        signalName(t, fact.signal),
        withHan(t, stemName(t, fact.stem), stemHan(fact.stem)),
        elementName(t, stemElement(fact.stem)),
      );
    case 'BaZiBranch':
      return tf(
        'reading_fact_named',
        signalName(t, fact.signal),
        withHan(t, animalName(t, fact.branch), branchHan(fact.branch)),
        elementName(t, branchElement(fact.branch)),
      );
    case 'BaZiElement':
      return tf('reading_fact_element', signalName(t, fact.signal), elementName(t, fact.element));
    case 'PlanetSign':
      return tf('reading_fact_planet', planetName(t, fact.planet), zodiacSignNameOf(t, fact.sign));
    case 'HouseSign':
      return tf('reading_fact_house', fact.house, zodiacSignNameOf(t, fact.sign));
  }
}

/** "Based on · Purple Star" for a source chip. */
export const basedOn = (t: UiText, system: ReadingSystem): string => t.tf('reading_based_on', systemName(t, system));

/** "Venus in Taurus — leans toward steadiness and follow-through". */
export const factLine = (t: UiText, fact: ReadingFact): string =>
  t.tf('reading_fact_line', factLabel(t, fact), toneLine(t, fact.tone));
