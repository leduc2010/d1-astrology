import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioSource } from 'expo-audio';

import type { UiCue, UiFeedback } from '@/designsystem/feedback/UiFeedback';

import { CUE_SOURCES, CUE_VOLUMES, MIN_GAP_MS } from './cues';

/** What the player needs from the platform; tests pass fakes. */
export type SoundPlayerDeps = {
  createPlayer: (source: AudioSource) => AudioPlayer;
  configureAudio: () => Promise<void>;
  now: () => number;
};

/** Cues mix with other apps' audio, stay silent in silent/vibrate mode and never play in the background. */
const configureCueAudio = () =>
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false });

const DEFAULT_DEPS: SoundPlayerDeps = {
  createPlayer: (source) => createAudioPlayer(source),
  configureAudio: configureCueAudio,
  now: () => Date.now(),
};

function reportSoundError(error: unknown): void {
  // A missing cue must never break the action that triggered it; surface it while developing.
  if (__DEV__) console.warn('[sound] cue failed', error);
}

/**
 * Plays the short UI cues (mirrors Kotlin `SoundPlayer`).
 *
 * - Honors the in-app toggle ([setEnabled], on by default) and the device's silent mode.
 * - Mixes with music from other apps instead of pausing it.
 * - Throttles cues so rapid taps never stack (max one cue per [MIN_GAP_MS]).
 */
export class SoundPlayer implements UiFeedback {
  private readonly deps: SoundPlayerDeps;
  private readonly players = new Map<UiCue, AudioPlayer>();
  private enabled = true;
  private lastPlayedAt = Number.NEGATIVE_INFINITY;
  private configured = false;

  constructor(deps: Partial<SoundPlayerDeps> = {}) {
    this.deps = { ...DEFAULT_DEPS, ...deps };
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Configures the audio session and loads every cue up front, like Kotlin's SoundPool. Idempotent. */
  load(): void {
    if (!this.configured) {
      this.configured = true;
      this.deps.configureAudio().catch(reportSoundError);
    }
    (Object.keys(CUE_SOURCES) as UiCue[]).forEach((cue) => this.playerFor(cue));
  }

  perform(cue: UiCue): void {
    if (!this.enabled) return;
    const now = this.deps.now();
    if (now - this.lastPlayedAt < MIN_GAP_MS) return;
    const player = this.playerFor(cue);
    if (player == null || !player.isLoaded) return;
    this.lastPlayedAt = now;
    try {
      player.volume = CUE_VOLUMES[cue];
      player.seekTo(0).catch(reportSoundError);
      player.play();
    } catch (error) {
      reportSoundError(error);
    }
  }

  /** Frees the native players; a later [load] or [perform] creates them again. */
  release(): void {
    this.players.forEach((player) => {
      try {
        player.remove();
      } catch (error) {
        reportSoundError(error);
      }
    });
    this.players.clear();
  }

  private playerFor(cue: UiCue): AudioPlayer | null {
    const existing = this.players.get(cue);
    if (existing) return existing;
    try {
      const player = this.deps.createPlayer(CUE_SOURCES[cue]);
      this.players.set(cue, player);
      return player;
    } catch (error) {
      reportSoundError(error);
      return null;
    }
  }
}
