/** Shared opacity levels (mirrors Kotlin `OrtusAlpha`). */
export const OrtusAlpha = {
  /** Disabled controls and icons. */
  DIMMED: 0.4,
  /** Fill of a tone card made from a single content color. */
  TONE_CARD_FILL: 0.08,
  /** Border of a tone card made from a single content color. */
  TONE_CARD_BORDER: 0.3,
  /** Locked (read-only) checkbox rows. */
  LOCKED: 0.75,
  /** Spinner track behind the moving arc. */
  SPINNER_TRACK: 0.25,
  /** Fill behind status icons. */
  STATUS_FILL: 0.16,
} as const;
