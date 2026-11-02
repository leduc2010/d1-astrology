import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { getDeviceLanguage } from './deviceLanguage';
import { makeHelpers, type Helpers } from './helpers';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type LanguageCode } from './languages';
import { LOCALE_STRINGS } from './resources';

const resources = Object.fromEntries(
  SUPPORTED_LANGUAGES.map(({ code }) => [code, { translation: LOCALE_STRINGS[code] }]),
);

/** The app's i18next instance, initialised synchronously with every locale bundled. */
export const i18n = createInstance();

let languageOverride: LanguageCode | null = null;

void i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
  load: 'currentOnly',
  initAsync: false,
  keySeparator: false,
  nsSeparator: false,
  returnNull: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

/** The language strings are currently shown in. */
export function getAppLanguage(): LanguageCode {
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language);
  return current?.code ?? DEFAULT_LANGUAGE;
}

/** The language the user picked, or null when the app follows the system language. */
export function getAppLanguageOverride(): LanguageCode | null {
  return languageOverride;
}

/**
 * Switches the app language (null = follow the device language again). Components using `useT()`
 * re-render. Persisting the choice is the settings layer's job; call this again on start-up.
 */
export async function setAppLanguage(code: LanguageCode | null): Promise<void> {
  languageOverride = code;
  await i18n.changeLanguage(code ?? getDeviceLanguage());
}

/** Helpers bound to whatever language is current at call time (for non-React code). */
export const { tf, tp, ta }: Helpers = makeHelpers((key, options) => i18n.t(key, options));
