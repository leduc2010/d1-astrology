import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { OrtusPressable } from '../modifiers/OrtusPressable';
import { OrtusColors } from '../theme/colors';
import { OrtusSizes, OrtusSpacing, OrtusStroke } from '../theme/dimens';
import { OrtusRadii } from '../theme/shapes';
import { OrtusText } from './OrtusText';

/** Text of one native ad; all of it comes from the ad network later, from stubs for now. */
export type NativeAdContent = {
  readonly badge: string;
  readonly advertiser: string;
  readonly title: string;
  readonly body: string;
  readonly cta: string;
};

export type NativeAdSlotProps = {
  content: NativeAdContent;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const ad = OrtusColors.ad;

/**
 * C13 native ad block, placeholder only: no ad SDK is wired. Deliberately neutral grey with no gold
 * so it is never mistaken for a reading. The real SDK view replaces this later, and must never be
 * given birth data.
 */
export function NativeAdSlot({ content, onPress, style, testID }: NativeAdSlotProps) {
  return (
    <View style={[styles.slot, style]} testID={testID}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <OrtusText variant="label" color={ad.title}>
            {content.badge}
          </OrtusText>
        </View>
        <OrtusText variant="captionSmall" color={ad.body}>
          {content.advertiser}
        </OrtusText>
      </View>
      <View style={styles.media} />
      <OrtusText variant="title" color={ad.title}>
        {content.title}
      </OrtusText>
      <OrtusText variant="caption" color={ad.caption} numberOfLines={2}>
        {content.body}
      </OrtusText>
      <OrtusPressable onPress={onPress} outerStyle={styles.ctaOuter} style={styles.cta}>
        <OrtusText variant="buttonSmall" color={ad.title}>
          {content.cta}
        </OrtusText>
      </OrtusPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    alignSelf: 'stretch',
    overflow: 'hidden',
    borderRadius: OrtusRadii.ad,
    backgroundColor: ad.surface,
    borderWidth: OrtusStroke.hairline,
    borderColor: ad.border,
    padding: OrtusSpacing.sm,
    gap: OrtusSpacing.xs,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.xs },
  badge: {
    borderRadius: OrtusRadii.pill,
    backgroundColor: ad.control,
    paddingHorizontal: OrtusSpacing.tight,
    paddingVertical: OrtusSpacing.hair,
  },
  media: { alignSelf: 'stretch', aspectRatio: 16 / 9, borderRadius: OrtusRadii.adMedia, backgroundColor: ad.media },
  ctaOuter: { alignSelf: 'stretch', height: OrtusSizes.buttonHeightSmall, borderRadius: OrtusRadii.pill },
  cta: { borderRadius: OrtusRadii.pill, backgroundColor: ad.control, alignItems: 'center', justifyContent: 'center' },
});
