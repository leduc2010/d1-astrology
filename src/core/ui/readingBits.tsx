import type { StyleProp, ViewStyle } from 'react-native';

import { Disclaimer, OrtusTag, TagTone } from '../../designsystem';
import { useT } from '../../i18n';

/** The standard "for reflection" note required under every reading. */
export function ReadingDisclaimer({ style }: { style?: StyleProp<ViewStyle> }) {
  const { tf } = useT();
  return <Disclaimer text={tf('common_disclaimer')} style={style} />;
}

export type DayQualityTagProps = {
  isAuspicious: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Hoàng đạo / Hắc đạo tag for a day. */
export function DayQualityTag({ isAuspicious, style }: DayQualityTagProps) {
  const { tf } = useT();
  return (
    <OrtusTag
      text={tf(isAuspicious ? 'day_tag_good' : 'day_tag_bad')}
      tone={isAuspicious ? TagTone.Auspicious : TagTone.Inauspicious}
      style={style}
    />
  );
}
