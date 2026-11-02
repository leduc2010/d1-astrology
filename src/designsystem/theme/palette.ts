/**
 * Raw brand palette (mirrors Kotlin `Color.kt` private Palette). Screens never use these directly:
 * they read the semantic roles in `OrtusColors`.
 */
export const Palette = {
  Night: "#0B0820",
  Indigo: "#1D1548",
  IndigoDeep: "#120D33",
  TabBarTop: "#140F36",
  Surface: "#17122F",
  Surface2: "#231B4A",
  Gold: "#D8B46A",
  GoldLight: "#F1DDAE",
  GoldPale: "#F3E2B6",
  GoldDeep: "#B88C47",
  Ink: "#1A1238",
  StarWhite: "#F2EDFF",
  Mist: "#A9A0CC",
  Muted: "#6F6798",
  Mystic: "#9373F2",
  MysticLight: "#B9A6F7",
  MysticPale: "#D6CAFB",
  MysticDeep: "#6A4BD8",
  Nebula: "#7A55E8",
  NebulaDeep: "#5A3CBE",
  Cinnabar: "#E0614A",
  Jade: "#5FC3A0",
  JadeInk: "#0E1F1A",
  GlowTop: "#3A2A86",
  GlowBottom: "#1A1440",
  Scrim: "#050312",
  Lavender: "#D9D2F2",
  BlueText: "#C9D8F7",
  Sand: "#C9B78F",
  Umber: "#3A2A1A",
  Metal: "#E6DFC8",
  Wood: "#6CC48A",
  Water: "#5A8DEB",
  WaterText: "#7FA6F0",
  Fire: "#E5644A",
  Earth: "#D3A353",
  Mint: "#8FD3B6",
  Coral: "#E8907F",
  PalaceTop: "#4E3A96",
  PalaceBottom: "#281E56",
  AdSurface: "#232326",
  AdBorder: "#38383D",
  AdControl: "#3F3F45",
  AdMedia: "#2C2C30",
  AdTitle: "#E4E4E7",
  AdBody: "#A1A1AA",
  AdCaption: "#8A8A92",
  White: "#FFFFFF",
} as const;

export const TRANSPARENT = "transparent";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const RGBA_COLOR = /^rgba\((\d{1,3}), (\d{1,3}), (\d{1,3}), [\d.]+\)$/;

/** The red, green and blue of a `#RRGGBB` or `rgba()` colour; anything else is a bug. */
function channels(color: string): readonly [number, number, number] {
  if (HEX_COLOR.test(color)) {
    return [
      parseInt(color.slice(1, 3), 16),
      parseInt(color.slice(3, 5), 16),
      parseInt(color.slice(5, 7), 16),
    ];
  }
  const rgba = RGBA_COLOR.exec(color);
  if (rgba) return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3])];
  throw new Error(`withAlpha expects #RRGGBB or rgba(), got ${color}`);
}

/**
 * [color] at [alpha] (0..1) as an `rgba()` string; the equivalent of Compose `copy(alpha = a)`,
 * so a token that is already translucent gets its alpha replaced, not multiplied.
 */
export function withAlpha(color: string, alpha: number): string {
  const [r, g, b] = channels(color);
  const a = Math.min(1, Math.max(0, alpha));
  return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(4))})`;
}
