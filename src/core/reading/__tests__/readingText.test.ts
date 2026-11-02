import { TagTone } from '../../../designsystem';
import { Element, MainStar, PalaceRole, Planet, StrengthLevel } from '../../../engine';
import { stemHan } from '../../ui/ganZhiText';
import { currentUiText, type UiText } from '../../ui/uiText';
import { agreementTone } from '../agreementTag';
import { ReadingFacts, topicReading } from '../reading';
import { ReadingDetails } from '../readingDetails';
import { detailBody, detailLabel } from '../readingDetailText';
import { BaZiSignal, ReadingSystem, Tone, Topic } from '../readingEnums';
import { basedOn, factLabel, factLine, systemSource, toneSentence, topicName } from '../readingText';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-US', languageCode: 'en' }],
}));

const JIA = 0;
const t: UiText = currentUiText();

describe('reading text', () => {
  it('names topics and systems from their arrays', () => {
    expect(topicName(t, Topic.LOVE)).toBe('Love');
    expect(basedOn(t, ReadingSystem.BAZI)).toBe('Based on · Four Pillars');
    expect(systemSource(ReadingSystem.WESTERN)).toBe('Astrology');
  });

  it('capitalises a tone line standing on its own', () => {
    expect(toneSentence(t, Tone.DEEP)).toBe('Leans toward depth and intuition');
  });

  it('labels a stem fact with its Han glyph and element', () => {
    const fact = ReadingFacts.baZiStem(BaZiSignal.DAY_MASTER, JIA);
    expect(factLabel(t, fact)).toBe(`Day master Jia ${stemHan(JIA)} (Wood)`);
    expect(factLine(t, fact)).toContain('leans toward curiosity and openness');
  });

  it('shows the glyph once where the name already is the glyph', () => {
    const han: UiText = { ...t, ta: (key) => (key === 'ganzhi_stems' ? [stemHan(JIA)] : t.ta(key)) };
    const label = factLabel(han, ReadingFacts.baZiStem(BaZiSignal.DAY_MASTER, JIA));
    expect(label.split(stemHan(JIA))).toHaveLength(2);
  });

  it('labels planet and house facts', () => {
    expect(factLabel(t, ReadingFacts.planetSign(Planet.VENUS, 1))).toBe('Venus in Taurus');
    expect(factLabel(t, ReadingFacts.houseSign(10, 0))).toBe('House 10 Aries');
  });

  it('marks a borrowed palace', () => {
    const own = factLabel(t, ReadingFacts.ziWeiPalace(PalaceRole.LIFE, [MainStar.ZI_WEI], false));
    const borrowed = factLabel(t, ReadingFacts.ziWeiPalace(PalaceRole.LIFE, [MainStar.ZI_WEI], true));
    expect(own).not.toBe(borrowed);
  });

  it('writes every detail kind', () => {
    const details = [
      ReadingDetails.dayMasterLevel(StrengthLevel.BALANCED),
      ReadingDetails.usefulFields(Element.WATER),
      ReadingDetails.usefulHabits(Element.WATER),
      ReadingDetails.wealthCapacity(StrengthLevel.STRONG),
      ReadingDetails.planetInSign(Planet.SUN, 4),
      ReadingDetails.planetInHouse(Planet.MARS, 7),
      ReadingDetails.rising(9),
    ];
    details.forEach((d) => {
      expect(detailLabel(t, d)).not.toBe('');
      expect(detailBody(t, d)).not.toBe('');
    });
    expect(detailLabel(t, ReadingDetails.planetInHouse(Planet.MARS, 7))).toBe('Mars in house 7');
  });

  it('colours agreement without ever scoring it', () => {
    const steady = ReadingFacts.baZiElement(BaZiSignal.WEALTH_ELEMENT, Element.EARTH);
    const deep = ReadingFacts.planetSign(Planet.MOON, 3);
    expect(agreementTone(topicReading(Topic.MONEY, [steady, steady], Tone.STEADY, 2))).toBe(TagTone.Auspicious);
    expect(agreementTone(topicReading(Topic.MONEY, [steady, steady, deep], Tone.STEADY, 2))).toBe(TagTone.Gold);
    expect(agreementTone(topicReading(Topic.MONEY, [steady, deep], Tone.STEADY, 1))).toBe(TagTone.Neutral);
  });
});
