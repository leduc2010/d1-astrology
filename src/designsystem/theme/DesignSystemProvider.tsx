import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';

import { UiFeedbackProvider, type UiFeedback } from '../feedback/UiFeedback';
import { OrtusColors, type OrtusColorScheme } from './colors';
import { OrtusTypography } from './typography';

const ReducedMotionContext = createContext(false);

/** Follows the system "remove animations" / "reduce motion" accessibility setting. */
export function useSystemReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduced(value);
      })
      .catch(() => {
        // Unknown platform state: keep motion on, as Kotlin does when the scale cannot be read.
      });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}

export type DesignSystemProviderProps = {
  /** The in-app "reduce motion" setting; OR-ed with the system setting (Kotlin `OrtusTheme`). */
  reducedMotion?: boolean;
  /** Cue sink for presses, toggles and sheets; usually the `SoundPlayer` from `src/sound`. */
  feedback?: UiFeedback;
  children: ReactNode;
};

/**
 * Root of the design system (Kotlin `OrtusTheme` + `LocalUiFeedback`). Provides reduced motion
 * and, when given, the feedback sink. Place `SoundProvider` inside it, or pass `feedback`.
 */
export function DesignSystemProvider({ reducedMotion = false, feedback, children }: DesignSystemProviderProps) {
  const systemReduced = useSystemReducedMotion();
  const content = feedback ? <UiFeedbackProvider feedback={feedback}>{children}</UiFeedbackProvider> : children;
  return (
    <ReducedMotionContext.Provider value={reducedMotion || systemReduced}>{content}</ReducedMotionContext.Provider>
  );
}

/** True when the user asked for less motion; ambient loops stop and transitions snap. */
export function useReducedMotion(): boolean {
  return useContext(ReducedMotionContext);
}

/** Kotlin `OrtusTheme.colors`; colors are static, the hook exists for call-site parity. */
export function useOrtusColors(): OrtusColorScheme {
  return OrtusColors;
}

/** Kotlin `OrtusTheme.typography`. */
export function useOrtusTypography(): typeof OrtusTypography {
  return OrtusTypography;
}
