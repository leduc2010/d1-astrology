import { getLocales } from 'expo-localization';

import { DEFAULT_LANGUAGE, isSupportedLanguage, type LanguageCode } from './languages';

/** The parts of an expo-localization `Locale` used for matching. */
export type DeviceLocale = { languageTag: string; languageCode: string | null };

/** Android's legacy ISO 639 codes. */
const LEGACY_LANGUAGE: Record<string, string> = { in: 'id', iw: 'he', ji: 'yi' };

/**
 * Maps one device locale to an app language, the way Android resource lookup picks a values-* folder:
 * `in` -> `id`; `pt-BR` and region-less `pt` -> `pt-BR` (other Portuguese regions have no folder);
 * any Chinese (`zh`, `zh-Hant-TW`...) -> `zh`; otherwise the bare language when the app has it.
 */
export function matchDeviceLocale(locale: DeviceLocale): LanguageCode | null {
  const subtags = locale.languageTag.replace(/_/g, '-').split('-');
  const rawLanguage = (locale.languageCode ?? subtags[0]).toLowerCase();
  const language = LEGACY_LANGUAGE[rawLanguage] ?? rawLanguage;
  if (language === 'pt') {
    const region = subtags.slice(1).find((s) => /^([A-Za-z]{2}|\d{3})$/.test(s));
    return region === undefined || region.toUpperCase() === 'BR' ? 'pt-BR' : null;
  }
  return isSupportedLanguage(language) ? language : null;
}

/** First supported language in the device's preference list, else English. */
export function resolveDeviceLanguage(locales: readonly DeviceLocale[]): LanguageCode {
  for (const locale of locales) {
    const match = matchDeviceLocale(locale);
    if (match) return match;
  }
  return DEFAULT_LANGUAGE;
}

/** The app language the device's settings ask for. */
export function getDeviceLanguage(): LanguageCode {
  try {
    return resolveDeviceLanguage(getLocales());
  } catch {
    return DEFAULT_LANGUAGE;
  }
}
