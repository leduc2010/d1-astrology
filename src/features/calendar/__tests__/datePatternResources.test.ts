import { patternDateText } from '@/core/ui';
import { civilDate } from '@/engine';
import { LOCALE_STRINGS } from '@/i18n/resources';

const PATTERN_NAMES = ['date_day_month_pattern', 'date_month_short_pattern', 'date_month_year_pattern'];

/** Pattern letters `patternDateText` renders; any other letter would print as itself. */
const SUPPORTED_LETTER = /^[yuMLdE]$/;

/** Letters outside quoted literals. */
const fieldLetters = (pattern: string): string[] =>
  pattern
    .replace(/'[^']*'/g, '')
    .split('')
    .filter((ch) => /[A-Za-z]/.test(ch));

/** Every translated date pattern must format, or the day screen would show raw letters in that language. */
describe('date pattern resources', () => {
  it('every language date pattern formats a date', () => {
    const day = civilDate(2026, 11, 1);
    const languages = Object.keys(LOCALE_STRINGS) as (keyof typeof LOCALE_STRINGS)[];
    expect(languages.length).toBeGreaterThan(0);
    for (const language of languages) {
      for (const name of PATTERN_NAMES) {
        const pattern = LOCALE_STRINGS[language][name];
        if (typeof pattern !== 'string') continue;
        const unsupported = fieldLetters(pattern).filter((letter) => !SUPPORTED_LETTER.test(letter));
        expect({ language, name, unsupported }).toEqual({ language, name, unsupported: [] });
        expect({ language, name, blank: patternDateText(day, pattern, language).trim() === '' }).toEqual({
          language,
          name,
          blank: false,
        });
      }
    }
  });
});
