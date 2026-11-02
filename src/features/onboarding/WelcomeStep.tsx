import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { currentLanguageLabel, LanguageSheet, Reveal } from '@/core/ui';
import {
  AstralHalo,
  CalloutTone,
  Disclaimer,
  OrtusCallout,
  OrtusColors as c,
  OrtusIcons,
  OrtusLinkButton,
  OrtusMotion,
  OrtusSizes,
  OrtusSpacing,
  OrtusTag,
  OrtusText,
  OrtusWideButton,
  TagTone,
  UiCue,
  useReducedMotion,
} from '@/designsystem';
import { type StringKey, useT } from '@/i18n';

const TAGS: readonly StringKey[] = [
  'onboarding_tag_ziwei',
  'onboarding_tag_bazi',
  'onboarding_tag_astrology',
  'onboarding_tag_lunar',
];

export type WelcomeStepProps = {
  onBegin: () => void;
  eraseFailed: boolean;
  onRetryErase: () => void;
};

/** S01-01: the astral halo, what the app reads, and the way in. The language can be changed here. */
export function WelcomeStep({ onBegin, eraseFailed, onRetryErase }: WelcomeStepProps) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const [showLanguages, setShowLanguages] = useState(false);
  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + OrtusSpacing.xl,
          paddingBottom: insets.bottom + OrtusSpacing.xl,
          paddingStart: insets.left + OrtusSpacing.screen,
          paddingEnd: insets.right + OrtusSpacing.screen,
        },
      ]}
    >
      <LanguageLink onPress={() => setShowLanguages(true)} />
      <View style={styles.flex} />
      <Reveal index={0}>
        <AstralHalo size={OrtusSizes.halo} />
      </Reveal>
      <Reveal index={1}>
        <OrtusText variant="hero" color={c.textPrimary} style={styles.center}>
          {t.tf('onboarding_welcome_title')}
        </OrtusText>
      </Reveal>
      <View style={styles.gapSm} />
      <Reveal index={2}>
        <OrtusText variant="body" color={c.textSecondary} style={styles.center}>
          {t.tf('onboarding_welcome_body')}
        </OrtusText>
      </Reveal>
      <View style={styles.gapLg} />
      <Reveal index={3} style={styles.tags}>
        {TAGS.map((key) => (
          <OrtusTag key={key} text={t.tf(key)} tone={TagTone.Gold} />
        ))}
      </Reveal>
      <View style={styles.flex} />
      <Reveal index={4} style={styles.actions}>
        {eraseFailed && <EraseFailedNotice onRetry={onRetryErase} />}
        <OrtusWideButton text={t.tf('onboarding_welcome_cta')} onPress={onBegin} cue={UiCue.Open} />
        <Disclaimer text={t.tf('onboarding_disclaimer')} />
      </Reveal>
      {showLanguages && <LanguageSheet onDismiss={() => setShowLanguages(false)} />}
    </View>
  );
}

/** Shown when the last erase-all left settings behind, so the user is never told it all went. */
function EraseFailedNotice({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  const reduced = useReducedMotion();
  const entering = reduced ? undefined : FadeIn.duration(OrtusMotion.STANDARD).easing(OrtusMotion.settle);
  const exiting = reduced ? undefined : FadeOut.duration(OrtusMotion.STANDARD).easing(OrtusMotion.settle);
  return (
    <Animated.View entering={entering} exiting={exiting} style={styles.notice}>
      <OrtusCallout text={t.tf('onboarding_erase_failed')} tone={CalloutTone.Warning} />
      <OrtusLinkButton text={t.tf('onboarding_retry')} onPress={onRetry} />
    </Animated.View>
  );
}

function LanguageLink({ onPress }: { onPress: () => void }) {
  const t = useT();
  return (
    <View style={styles.languageLink}>
      <View accessible accessibilityLabel={t.tf('onboarding_language')}>
        <OrtusIcons.Globe size={OrtusSizes.iconSmall} color={c.textSecondary} />
      </View>
      <OrtusLinkButton
        text={currentLanguageLabel(t)}
        onPress={onPress}
        color={c.textSecondary}
        trailingIcon={OrtusIcons.ChevronDown}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  gapSm: { height: OrtusSpacing.sm },
  gapLg: { height: OrtusSpacing.lg },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: OrtusSpacing.xs },
  actions: { alignSelf: 'stretch', gap: OrtusSpacing.sm },
  notice: { alignItems: 'center' },
  languageLink: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.xxs },
});
