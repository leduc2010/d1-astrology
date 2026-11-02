import { matchDeviceLocale, resolveDeviceLanguage } from '../deviceLanguage';
import { isRtl, SUPPORTED_LANGUAGES } from '../languages';

const locale = (languageTag: string, languageCode: string | null = languageTag.split(/[-_]/)[0]) => ({
  languageTag,
  languageCode,
});

describe('matchDeviceLocale', () => {
  it.each([
    ['vi-VN', 'vi'],
    ['in-ID', 'id'],
    ['id-ID', 'id'],
    ['pt-BR', 'pt-BR'],
    ['pt', 'pt-BR'],
    ['zh-CN', 'zh'],
    ['zh-Hant-TW', 'zh'],
    ['zh-Hans', 'zh'],
    ['ar-EG', 'ar'],
    ['en-GB', 'en'],
    ['de_AT', 'de'],
  ])('%s -> %s', (tag, want) => {
    expect(matchDeviceLocale(locale(tag))).toBe(want);
  });

  it.each(['pt-PT', 'ja-JP', 'it-IT'])('%s has no app language', (tag) => {
    expect(matchDeviceLocale(locale(tag))).toBeNull();
  });

  it('reads the language from the tag when languageCode is null', () => {
    expect(matchDeviceLocale(locale('ko-KR', null))).toBe('ko');
  });
});

describe('resolveDeviceLanguage', () => {
  it('takes the first supported language in preference order', () => {
    expect(resolveDeviceLanguage([locale('ja-JP'), locale('pt-PT'), locale('fr-CA'), locale('de-DE')])).toBe('fr');
  });

  it('defaults to English', () => {
    expect(resolveDeviceLanguage([locale('ja-JP')])).toBe('en');
    expect(resolveDeviceLanguage([])).toBe('en');
  });
});

describe('languages', () => {
  it('lists the 14 app languages with English first', () => {
    expect(SUPPORTED_LANGUAGES.map((l) => l.code)).toEqual([
      'en', 'es', 'pt-BR', 'fr', 'de', 'ru', 'hi', 'id', 'ko', 'zh', 'ar', 'nl', 'bn', 'vi',
    ]);
  });

  it('marks only Arabic as right-to-left', () => {
    expect(SUPPORTED_LANGUAGES.filter((l) => isRtl(l.code)).map((l) => l.code)).toEqual(['ar']);
    expect(isRtl('ar-EG')).toBe(true);
  });
});
