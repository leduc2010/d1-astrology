import { BeVietnamPro_400Regular } from '@expo-google-fonts/be-vietnam-pro/400Regular';
import { BeVietnamPro_500Medium } from '@expo-google-fonts/be-vietnam-pro/500Medium';
import { BeVietnamPro_600SemiBold } from '@expo-google-fonts/be-vietnam-pro/600SemiBold';
import { BeVietnamPro_700Bold } from '@expo-google-fonts/be-vietnam-pro/700Bold';
import { CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond/500Medium';
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond/600SemiBold';
import { CormorantGaramond_700Bold } from '@expo-google-fonts/cormorant-garamond/700Bold';
import { NotoSerifTC_400Regular } from '@expo-google-fonts/noto-serif-tc/400Regular';
import { NotoSerifTC_600SemiBold } from '@expo-google-fonts/noto-serif-tc/600SemiBold';
import { NotoSerifTC_700Bold } from '@expo-google-fonts/noto-serif-tc/700Bold';
import { useFonts } from 'expo-font';

/**
 * Font family names, one per loaded weight (RN picks a cut by family name, not fontWeight).
 * Same families and weights as the Kotlin downloadable fonts.
 */
export const OrtusFontFamily = {
  cormorantMedium: 'CormorantGaramond_500Medium',
  cormorantSemiBold: 'CormorantGaramond_600SemiBold',
  cormorantBold: 'CormorantGaramond_700Bold',
  beVietnamRegular: 'BeVietnamPro_400Regular',
  beVietnamMedium: 'BeVietnamPro_500Medium',
  beVietnamSemiBold: 'BeVietnamPro_600SemiBold',
  beVietnamBold: 'BeVietnamPro_700Bold',
  notoSerifRegular: 'NotoSerifTC_400Regular',
  notoSerifSemiBold: 'NotoSerifTC_600SemiBold',
  notoSerifBold: 'NotoSerifTC_700Bold',
} as const;

const FONT_ASSETS = {
  [OrtusFontFamily.cormorantMedium]: CormorantGaramond_500Medium,
  [OrtusFontFamily.cormorantSemiBold]: CormorantGaramond_600SemiBold,
  [OrtusFontFamily.cormorantBold]: CormorantGaramond_700Bold,
  [OrtusFontFamily.beVietnamRegular]: BeVietnamPro_400Regular,
  [OrtusFontFamily.beVietnamMedium]: BeVietnamPro_500Medium,
  [OrtusFontFamily.beVietnamSemiBold]: BeVietnamPro_600SemiBold,
  [OrtusFontFamily.beVietnamBold]: BeVietnamPro_700Bold,
  [OrtusFontFamily.notoSerifRegular]: NotoSerifTC_400Regular,
  [OrtusFontFamily.notoSerifSemiBold]: NotoSerifTC_600SemiBold,
  [OrtusFontFamily.notoSerifBold]: NotoSerifTC_700Bold,
};

/**
 * Loads every Ortus font. Returns `[loaded, error]` like expo-font `useFonts`; keep the splash
 * screen up until `loaded || error` (on error the platform fonts are used, as Kotlin falls back
 * while its downloadable fonts load).
 */
export function useOrtusFonts(): [boolean, Error | null] {
  return useFonts(FONT_ASSETS);
}
