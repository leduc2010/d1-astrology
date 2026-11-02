import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadingScrollView, OrtusSpacing } from '../../designsystem';

export type OrtusScreenProps = {
  /** Fixed above the scrolling column (a top bar, a segmented control). */
  header?: ReactNode;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

/**
 * Standard screen frame: an optional fixed header above a scrolling column, below the status bar.
 *
 * Screens are transparent on purpose: the app draws one shared night sky behind the navigator,
 * so screen transitions cross-fade content while the stars keep drifting uninterrupted.
 * The bottom inset is owned by the tab bar (or by the caller on child screens).
 */
export function OrtusScreen({ header, style, children }: OrtusScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.screen, { paddingTop: insets.top }, style]}>
      {header}
      <FadingScrollView style={styles.fill} contentContainerStyle={styles.content}>
        {children}
      </FadingScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  fill: { flex: 1 },
  content: {
    paddingHorizontal: OrtusSpacing.screen,
    paddingVertical: OrtusSpacing.md,
    gap: OrtusSpacing.cardGap,
  },
});
