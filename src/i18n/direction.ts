import { I18nManager } from 'react-native';

import { isRtl } from './languages';

/** The parts of `I18nManager` that set the layout direction (injectable for tests). */
export interface DirectionManager {
  readonly isRTL: boolean;
  allowRTL(allow: boolean): void;
  forceRTL(force: boolean): void;
}

/**
 * Points the layout direction at [language] (Arabic mirrors, the rest do not), as Android does on
 * its own when the per-app locale changes. RN only reads the direction at start-up, so the caller
 * must reload the app when this returns true.
 */
export function applyLayoutDirection(language: string, manager: DirectionManager = I18nManager): boolean {
  const rtl = isRtl(language);
  manager.allowRTL(rtl);
  manager.forceRTL(rtl);
  return manager.isRTL !== rtl;
}
