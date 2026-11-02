import { OrtusMotion } from '../../../designsystem';
import { matchLanguage } from '../appLanguage';
import { numberItems } from '../birth/birthWheels';
import { hourCellDescription } from '../hoursGrid';
import { MAX_STAGGERED_ITEMS, revealDelay } from '../reveal';
import { capitalized, currentUiText, fillTemplate, itemOf } from '../uiText';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-US', languageCode: 'en' }],
}));

const TY = 0;

describe('uiText', () => {
  it('fills positional array templates and leaves missing ones', () => {
    expect(fillTemplate('{{p1}} in {{p2}}', 'Venus', 'Taurus')).toBe('Venus in Taurus');
    expect(fillTemplate('{{p1}} {{p3}}', 'a')).toBe('a {{p3}}');
  });

  it('reads past the end of a short array as empty', () => {
    expect(itemOf(['a'], 1)).toBe('');
  });

  it('capitalises in the given language', () => {
    expect(capitalized('istanbul', 'tr')).toBe('İstanbul');
    expect(capitalized('', 'en')).toBe('');
  });
});

describe('matchLanguage', () => {
  it.each([
    ['vi-VN', 'vi'],
    ['pt-br', 'pt-BR'],
    ['pt', 'pt-BR'],
    ['EN', 'en'],
    ['xx', null],
    ['', null],
    [null, null],
  ])('%s -> %s', (stored, expected) => {
    expect(matchLanguage(stored)).toBe(expected);
  });
});

describe('numberItems', () => {
  it('counts inclusively without grouping', () => {
    expect(numberItems(1999, 2001, 'en')).toEqual(['1999', '2000', '2001']);
  });

  it('pads clock numbers to two digits', () => {
    expect(numberItems(0, 2, 'en', true)).toEqual(['00', '01', '02']);
  });

  it('gives nothing for an empty span', () => {
    expect(numberItems(3, 2, 'en')).toEqual([]);
  });
});

describe('revealDelay', () => {
  it('staggers by index and caps long lists', () => {
    expect(revealDelay(0)).toBe(0);
    expect(revealDelay(-2)).toBe(0);
    expect(revealDelay(3)).toBe(3 * OrtusMotion.STAGGER);
    expect(revealDelay(50)).toBe(MAX_STAGGERED_ITEMS * OrtusMotion.STAGGER);
  });
});

describe('hourCellDescription', () => {
  const t = currentUiText();

  it('reads the hour, its range and its states', () => {
    const plain = hourCellDescription(t, TY, false, false);
    const both = hourCellDescription(t, TY, true, true);
    expect(plain).not.toContain(t.tf('hour_state_good'));
    expect(both).toBe(`${plain}, ${t.tf('hour_state_good')}, ${t.tf('hour_state_now')}`);
  });
});
