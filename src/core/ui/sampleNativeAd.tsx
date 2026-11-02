import { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { type NativeAdContent, NativeAdSlot } from '../../designsystem';
import { useT } from '../../i18n';
import type { AdPlacement } from '../model';
import { useAdPlacements } from './placements';

// The placeholder has nowhere to go; the real ad view handles its own click.
const NO_OP = () => undefined;

export type SampleNativeAdProps = {
  placement: AdPlacement;
  style?: StyleProp<ViewStyle>;
};

/**
 * Placeholder native ad with stub copy until an ad provider is wired. Never receives birth data.
 * Draws nothing when [placement] is not in the provided ad placements.
 */
export function SampleNativeAd({ placement, style }: SampleNativeAdProps) {
  const { tf } = useT();
  const placements = useAdPlacements();
  const content = useMemo<NativeAdContent>(
    () => ({
      badge: tf('ad_badge'),
      advertiser: tf('ad_sample_advertiser'),
      title: tf('ad_sample_title'),
      body: tf('ad_sample_body'),
      cta: tf('ad_sample_cta'),
    }),
    [tf],
  );
  if (!placements.has(placement)) return null;
  return <NativeAdSlot content={content} onPress={NO_OP} style={style} />;
}
