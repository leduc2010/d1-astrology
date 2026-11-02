/**
 * The app's languages. Order and native names follow the Kotlin `AppLanguage.tags` picker
 * (English first), names being `Locale.getDisplayName(locale)` with the first letter titlecased.
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'en', nativeName: 'English' },
  { code: 'es', nativeName: 'Español' },
  { code: 'pt-BR', nativeName: 'Português (Brasil)' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'de', nativeName: 'Deutsch' },
  { code: 'ru', nativeName: 'Русский' },
  { code: 'hi', nativeName: 'हिन्दी' },
  { code: 'id', nativeName: 'Indonesia' },
  { code: 'ko', nativeName: '한국어' },
  { code: 'zh', nativeName: '中文' },
  { code: 'ar', nativeName: 'العربية' },
  { code: 'nl', nativeName: 'Nederlands' },
  { code: 'bn', nativeName: 'বাংলা' },
  { code: 'vi', nativeName: 'Tiếng Việt' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

const CODES: readonly string[] = SUPPORTED_LANGUAGES.map((l) => l.code);

const RTL_LANGUAGES: readonly string[] = ['ar', 'fa', 'he', 'iw', 'ur', 'ps', 'yi'];

export function isSupportedLanguage(code: string): code is LanguageCode {
  return CODES.includes(code);
}

/** True for right-to-left scripts (of the app's languages, only Arabic). */
export function isRtl(code: string): boolean {
  return RTL_LANGUAGES.includes(code.split('-')[0].toLowerCase());
}

/** Native display name of [code], e.g. "Tiếng Việt". */
export function nativeLanguageName(code: LanguageCode): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.nativeName ?? code;
}
