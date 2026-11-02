import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { makeHelpers, type Helpers } from './helpers';
import { i18n } from './instance';
import { DEFAULT_LANGUAGE, isSupportedLanguage, type LanguageCode } from './languages';

export type BoundHelpers = Helpers & { language: LanguageCode };

/** tf/tp/ta bound to the current language; the calling component re-renders when it changes. */
export function useT(): BoundHelpers {
  const { t, i18n: active } = useTranslation(undefined, { i18n });
  const language = isSupportedLanguage(active.language) ? active.language : DEFAULT_LANGUAGE;
  return useMemo(
    () => ({ ...makeHelpers((key, options) => t(key, options)), language }),
    [t, language],
  );
}
