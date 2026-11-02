import type { ViewStyle } from 'react-native';

/** Fully rounded ends; RN clamps any radius above half the height. */
export const PILL_RADIUS = 9999;

/** Corner radii in dp (mirrors Kotlin `OrtusShapes`). */
export const OrtusRadii = {
  card: 20,
  input: 14,
  note: 14,
  iconBox: 12,
  tile: 12,
  cell: 10,
  ad: 12,
  adMedia: 8,
  tag: 7,
  pill: PILL_RADIUS,
  panel: 24,
  prompt: 16,
  sheet: 28,
} as const;

type Corners = Pick<
  ViewStyle,
  'borderRadius' | 'borderTopStartRadius' | 'borderTopEndRadius' | 'borderBottomStartRadius' | 'borderBottomEndRadius'
>;

/** Shapes as style fragments; asymmetric ones use start/end corners so they flip in RTL. */
export const OrtusShapes = {
  card: { borderRadius: OrtusRadii.card },
  input: { borderRadius: OrtusRadii.input },
  note: { borderRadius: OrtusRadii.note },
  iconBox: { borderRadius: OrtusRadii.iconBox },
  tile: { borderRadius: OrtusRadii.tile },
  cell: { borderRadius: OrtusRadii.cell },
  ad: { borderRadius: OrtusRadii.ad },
  adMedia: { borderRadius: OrtusRadii.adMedia },
  tag: { borderRadius: OrtusRadii.tag },
  pill: { borderRadius: OrtusRadii.pill },
  panel: { borderRadius: OrtusRadii.panel },
  prompt: { borderRadius: OrtusRadii.prompt },
  /** Bottom sheet: only the top corners are rounded. */
  sheet: { borderTopStartRadius: OrtusRadii.sheet, borderTopEndRadius: OrtusRadii.sheet },
  /** User question bubble: sharp top-end corner, pointing at the asker. */
  bubbleQuestion: {
    borderTopStartRadius: 18,
    borderTopEndRadius: 4,
    borderBottomEndRadius: 18,
    borderBottomStartRadius: 18,
  },
  /** AI answer bubble: sharp top-start corner, next to the avatar. */
  bubbleAnswer: {
    borderTopStartRadius: 4,
    borderTopEndRadius: 18,
    borderBottomEndRadius: 18,
    borderBottomStartRadius: 18,
  },
} as const satisfies Record<string, Corners>;

export type OrtusShape = (typeof OrtusShapes)[keyof typeof OrtusShapes];
