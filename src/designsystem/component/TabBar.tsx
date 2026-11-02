import { useEffect, useState } from 'react';
import { Keyboard, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/tabs';

import { useT, type StringKey } from '@/i18n';

import { UiCue } from '../feedback/UiFeedback';
import { OrtusIcons, type OrtusIconComponent } from '../icons/OrtusIcons';
import { glowStyle } from '../modifiers/glow';
import { OrtusPressable } from '../modifiers/OrtusPressable';
import { useAnimatedValue } from '../modifiers/useAnimatedValue';
import { OrtusColors as c } from '../theme/colors';
import { OrtusGlow, OrtusSizes, OrtusStroke } from '../theme/dimens';
import { OrtusGradients } from '../theme/gradients';
import { OrtusRadii } from '../theme/shapes';
import { OrtusTypography } from '../theme/typography';

/** One tab: its label (from strings) and line icon. */
export type TabItem = { readonly label: string; readonly icon: OrtusIconComponent };

export type OrtusTabBarProps = {
  items: readonly TabItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Space kept below the bar for the system navigation bar; defaults to the safe-area inset. */
  bottomInset?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * C17 bottom tab bar. The selected tab gets gold content and a short glowing bar on its top edge
 * that fades in, so switching tabs feels like a light moving rather than a hard swap.
 */
export function OrtusTabBar({ items, selectedIndex, onSelect, bottomInset, style, testID }: OrtusTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: bottomInset ?? insets.bottom }, style]} testID={testID}>
      <View style={styles.divider} />
      <View style={styles.row} accessibilityRole="tablist">
        {items.map((item, index) => (
          <TabCell
            key={`${index}:${item.label}`}
            item={item}
            selected={index === selectedIndex}
            onPress={() => onSelect(index)}
          />
        ))}
      </View>
    </View>
  );
}

function TabCell({ item, selected, onPress }: { item: TabItem; selected: boolean; onPress: () => void }) {
  const progress = useAnimatedValue(selected ? 1 : 0);
  const indicator = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const goldIcon = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const mutedIcon = useAnimatedStyle(() => ({ opacity: 1 - progress.get() }));
  const tint = useAnimatedStyle(() => ({
    color: interpolateColor(progress.get(), [0, 1], [c.textMuted, c.accent]),
  }));
  const Icon = item.icon;
  return (
    <OrtusPressable
      onPress={onPress}
      cue={UiCue.Select}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected }}
      outerStyle={styles.cellOuter}
      style={styles.cell}
    >
      <Animated.View style={[styles.indicator, indicator]} />
      {/* Compose tweens the icon tint; two stacked glyphs cross-fade to the same effect. */}
      <View style={styles.icon}>
        <Animated.View style={[StyleSheet.absoluteFill, mutedIcon]}>
          <Icon size={OrtusSizes.icon} color={c.textMuted} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, goldIcon]}>
          <Icon size={OrtusSizes.icon} color={c.accent} />
        </Animated.View>
      </View>
      <Animated.Text numberOfLines={1} style={[selected ? OrtusTypography.tabSelected : OrtusTypography.tab, tint]}>
        {item.label}
      </Animated.Text>
    </OrtusPressable>
  );
}

/** Route names of the five tabs (file names under the tab layout) and what each shows. */
const TAB_DESTINATIONS: Readonly<Record<string, { label: StringKey; icon: OrtusIconComponent }>> = {
  index: { label: 'tab_today', icon: OrtusIcons.Today },
  today: { label: 'tab_today', icon: OrtusIcons.Today },
  calendar: { label: 'tab_calendar', icon: OrtusIcons.Calendar },
  charts: { label: 'tab_charts', icon: OrtusIcons.Chart },
  ai: { label: 'tab_ai', icon: OrtusIcons.Ai },
  me: { label: 'tab_me', icon: OrtusIcons.Me },
};

/** True while the software keyboard is up; the bar steps away so it never rides above the keys. */
function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

/**
 * [OrtusTabBar] for expo-router `<Tabs tabBar={(props) => <OrtusRouterTabBar {...props} />}>`.
 * Routes named today/index, calendar, charts, ai and me become tabs; any other route is left out.
 * A press emits `tabPress` first, so a screen can prevent it (e.g. scroll to top instead).
 */
export function OrtusRouterTabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { tf } = useT();
  const keyboardVisible = useKeyboardVisible();
  if (keyboardVisible) return null;
  const tabs = state.routes
    .map((route, index) => ({ route, index, destination: TAB_DESTINATIONS[route.name] }))
    .filter((tab) => tab.destination != null);
  const items = tabs.map((tab) => ({ label: tf(tab.destination.label), icon: tab.destination.icon }));
  const selected = tabs.findIndex((tab) => tab.index === state.index);
  const onSelect = (position: number) => {
    const { route, index } = tabs[position];
    const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (index !== state.index && !event.defaultPrevented) navigateToTab(route.key);
  };
  return <OrtusTabBar items={items} selectedIndex={selected} onSelect={onSelect} bottomInset={insets.bottom} />;
}

const styles = StyleSheet.create({
  bar: { alignSelf: 'stretch', backgroundImage: OrtusGradients.tabBar },
  divider: { height: OrtusStroke.hairline, backgroundColor: c.divider },
  row: { height: OrtusSizes.tabBarHeight, flexDirection: 'row', justifyContent: 'space-around' },
  cellOuter: { flex: 1, alignSelf: 'stretch' },
  // Unclipped so the indicator's glow can spill above the bar, as in Compose.
  cell: { alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  indicator: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: OrtusSizes.tabIndicatorWidth,
    height: OrtusSizes.tabIndicatorHeight,
    borderRadius: OrtusRadii.pill,
    backgroundColor: c.accent,
    ...glowStyle(c.accentGlowIntense, OrtusGlow.indicator),
  },
  icon: { width: OrtusSizes.icon, height: OrtusSizes.icon },
});
