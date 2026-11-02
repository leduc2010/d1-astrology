import { getLocales } from 'expo-localization';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OrtusScreen, useOpenLink } from '@/core/ui';
import {
  ButtonSize,
  ButtonStyle,
  OrtusButton,
  OrtusCard,
  OrtusColors as c,
  OrtusIcons,
  OrtusSpacing,
  OrtusText,
  OrtusWideButton,
  SectionLabel,
} from '@/designsystem';
import { useT } from '@/i18n';
import { goBack } from '@/navigation/routes';

import { dialDigits, supportLinesFor, type SupportLine } from './supportLines';

/**
 * Where the phone is, for picking local lines: the system region (not the app language, which says
 * nothing about where someone is). Kotlin read the mobile network's and SIM's country first.
 */
function supportCountry(): string {
  return getLocales()[0]?.regionCode ?? '';
}

/**
 * S06-06: shown instead of an answer when a message sounds like the person may be in danger.
 * Calm and plain on purpose: no astrology, no decoration, just people to talk to.
 */
export function SupportScreen() {
  const { tf } = useT();
  const insets = useSafeAreaInsets();
  const openLink = useOpenLink();
  const [support] = useState(() => supportLinesFor(supportCountry()));
  // Opens the dialler with the number filled in; nothing is placed. No dialler: the number stays on screen.
  const use = (line: SupportLine) => openLink(line.kind === 'phone' ? `tel:${dialDigits(line.number)}` : line.url);
  return (
    <OrtusScreen style={{ paddingBottom: insets.bottom }}>
      <View style={styles.intro}>
        <OrtusText variant="display" color={c.textPrimary} accessibilityRole="header">
          {tf('ai_support_title')}
        </OrtusText>
        <OrtusText variant="body" color={c.textSecondary}>
          {tf('ai_support_body')}
        </OrtusText>
      </View>
      <SectionLabel text={tf(support.heading)} />
      {support.lines.map((line) => (
        <SupportCard key={line.name} line={line} onUse={() => use(line)} />
      ))}
      <OrtusText variant="callout" color={c.textSecondary}>
        {tf(support.danger)}
      </OrtusText>
      <OrtusWideButton text={tf('ai_support_back')} onPress={goBack} variant={ButtonStyle.Outline} />
    </OrtusScreen>
  );
}

function SupportCard({ line, onUse }: { line: SupportLine; onUse: () => void }) {
  const { tf } = useT();
  const name = tf(line.name);
  const detail = tf(line.detail);
  const isPhone = line.kind === 'phone';
  const caption = line.kind === 'phone' && line.number !== '' ? `${line.number} · ${detail}` : detail;
  return (
    <OrtusCard>
      <View style={styles.row}>
        <View style={styles.text}>
          <OrtusText variant="title" color={c.textPrimary}>
            {name}
          </OrtusText>
          <OrtusText variant="caption" color={c.textSecondary}>
            {caption}
          </OrtusText>
        </View>
        <OrtusButton
          text={tf(isPhone ? 'ai_support_call' : 'ai_support_open')}
          onPress={onUse}
          variant={line.primary ? ButtonStyle.Calm : ButtonStyle.CalmSoft}
          size={ButtonSize.Small}
          leadingIcon={isPhone ? OrtusIcons.Phone : OrtusIcons.Globe}
          accessibilityLabel={tf(isPhone ? 'ai_support_call_description' : 'ai_support_open_description', name)}
        />
      </View>
    </OrtusCard>
  );
}

const styles = StyleSheet.create({
  intro: { paddingTop: OrtusSpacing.lg, gap: OrtusSpacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.md },
  text: { flex: 1, gap: OrtusSpacing.hair },
});
