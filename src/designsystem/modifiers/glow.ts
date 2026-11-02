import type { ViewStyle } from 'react-native';

/**
 * Kotlin `Modifier.glow()` draws `setShadowLayer(radius / 2, 0, offsetY)`. Android turns a shadow
 * radius r into a Gaussian sigma of r * 0.57735 + 0.5; a CSS blur radius is 2 * sigma.
 */
export function glowBlur(radius: number): number {
  const sigma = (radius / 2) * 0.57735 + 0.5;
  return Number((2 * sigma).toFixed(2));
}

/**
 * Soft colored halo behind a view (RN `boxShadow`). Put it on a view that does not clip
 * (`overflow: 'visible'`) and has the same corner radius as the shape it surrounds.
 */
export function glowStyle(color: string, radius: number, offsetY = 0): ViewStyle {
  if (radius <= 0) return {};
  return { boxShadow: [{ offsetX: 0, offsetY, blurRadius: glowBlur(radius), color }] };
}
