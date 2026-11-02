import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { NoUiFeedback, UiFeedbackProvider, type UiFeedback } from '@/designsystem/feedback/UiFeedback';

import { SoundPlayer } from './SoundPlayer';

const SoundContext = createContext<UiFeedback>(NoUiFeedback);

export type SoundProviderProps = {
  /** The Settings "sounds" toggle; sounds are on unless the owner turns them off. */
  enabled?: boolean;
  children: ReactNode;
};

/**
 * Owns the app's one [SoundPlayer] and hands it to the design system as its feedback sink, so
 * every press, toggle and sheet plays its cue. Place it inside `DesignSystemProvider`.
 */
export function SoundProvider({ enabled = true, children }: SoundProviderProps) {
  const [player] = useState(() => new SoundPlayer());

  useEffect(() => {
    player.load();
    return () => player.release();
  }, [player]);

  useEffect(() => {
    player.setEnabled(enabled);
  }, [player, enabled]);

  return (
    <SoundContext.Provider value={player}>
      <UiFeedbackProvider feedback={player}>{children}</UiFeedbackProvider>
    </SoundContext.Provider>
  );
}

/** The cue player, for actions outside design-system controls (a reading revealed, a save done). */
export function useSound(): UiFeedback {
  return useContext(SoundContext);
}
