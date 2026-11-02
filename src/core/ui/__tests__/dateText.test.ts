import { dateFormat, fullDateText, solarDateText, weekdayHeadings, weekdayText } from '../dateText';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageTag: 'en-US', languageCode: 'en' }],
}));

const DATE = { year: 2026, month: 11, day: 1 };
const AT = new Date(Date.UTC(DATE.year, DATE.month - 1, DATE.day));
const fresh = (language: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(language, { ...options, timeZone: 'UTC' }).format(AT);

describe('dateFormat cache', () => {
  it('hands back the same formatter for the same language and options', () => {
    const first = dateFormat('en', { weekday: 'long' });
    expect(dateFormat('en', { weekday: 'long' })).toBe(first);
    expect(dateFormat('vi', { weekday: 'long' })).not.toBe(first);
    expect(dateFormat('en', { weekday: 'short' })).not.toBe(first);
  });

  it('formats exactly like a freshly built formatter', () => {
    for (const language of ['en', 'vi', 'de']) {
      expect(fullDateText(DATE, language)).toBe(fresh(language, { dateStyle: 'full' }));
      expect(solarDateText(DATE, language, 'medium')).toBe(fresh(language, { dateStyle: 'medium' }));
      // Twice, so the second answer comes from the cache.
      expect(weekdayText(DATE, language)).toBe(weekdayText(DATE, language));
    }
    expect(weekdayText(DATE, 'en')).toBe('Sunday');
    expect(weekdayHeadings([0, 1], 'en')).toEqual(['Sun', 'Mon']);
  });
});
