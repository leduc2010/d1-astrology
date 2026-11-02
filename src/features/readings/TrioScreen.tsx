import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AgreementTag,
  factLabel,
  systemName,
  systemSource,
  topicHeadline,
  topicName,
  type ReadingFact,
  type TopicReading,
} from '@/core/reading';
import { Reveal, useResumedOnly } from '@/core/ui';
import {
  DashedBorder,
  insightSourceMarkColor,
  OrtusCard,
  OrtusColors,
  OrtusGlowCard,
  OrtusRadii,
  OrtusSpacing,
  OrtusText,
  SectionLabel,
} from '@/designsystem';
import { useT } from '@/i18n';
import { goBack } from '@/navigation/routes';

import { ReadingsPage } from './ReadingsCommon';
import { trioShared, type ReadingsUiState } from './readingsModel';
import { useReadingsModel } from './useReadingsModel';

/** "My trio", wired to its model and the app's navigation. */
export function TrioScreen() {
  const model = useReadingsModel();
  const onBack = useResumedOnly(goBack);
  return <TrioContent state={model.state} onBack={onBack} />;
}

/** S05-03: the topics where at least two systems agree, strongest first, with each system's basis. */
export function TrioContent({ state, onBack }: { state: ReadingsUiState; onBack: () => void }) {
  const { tf } = useT();
  return (
    <ReadingsPage title={tf('readings_trio_title')} state={state} onBack={onBack}>
      {(ready) => <TrioBody readings={ready.readings} />}
    </ReadingsPage>
  );
}

function TrioBody({ readings }: { readings: readonly TopicReading[] }) {
  const { tf } = useT();
  const shared = useMemo(() => trioShared(readings), [readings]);
  const anyDiffers = shared.some((r) => r.facts.some((it) => it.tone !== r.tone));
  return (
    <>
      <Reveal index={0}>
        <OrtusText variant="body" color={OrtusColors.textSecondary}>
          {tf('readings_trio_intro')}
        </OrtusText>
      </Reveal>
      {shared.length === 0 ? (
        <Reveal index={1}>
          <OrtusText variant="callout" color={OrtusColors.textMuted}>
            {tf('readings_trio_empty')}
          </OrtusText>
        </Reveal>
      ) : null}
      {shared.map((reading, i) => (
        <Reveal key={reading.topic} index={i + 1}>
          <TrioCard reading={reading} featured={i === 0} />
        </Reveal>
      ))}
      {anyDiffers ? (
        <Reveal index={shared.length + 1}>
          <OrtusText variant="captionSmall" color={OrtusColors.textMuted}>
            {tf('readings_trio_legend')}
          </OrtusText>
        </Reveal>
      ) : null}
    </>
  );
}

function TrioCard({ reading, featured }: { reading: TopicReading; featured: boolean }) {
  const t = useT();
  const content: ReactNode = (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <SectionLabel text={topicName(t, reading.topic)} style={styles.flex} />
        <AgreementTag reading={reading} />
      </View>
      <OrtusText variant="headerTitle" color={OrtusColors.textPrimary}>
        {topicHeadline(t, reading.topic, reading.tone)}
      </OrtusText>
      {/* Equal-height cells side by side, one per system, so the agreement reads at a glance. */}
      <View style={styles.cells}>
        {reading.facts.map((fact) => (
          <TrioCell key={fact.system} fact={fact} agrees={fact.tone === reading.tone} onGlow={featured} />
        ))}
      </View>
    </View>
  );
  // The strongest agreement leads as the screen's one glow card.
  return featured ? <OrtusGlowCard showStar={false}>{content}</OrtusGlowCard> : <OrtusCard>{content}</OrtusCard>;
}

/**
 * One system's cell: its name in the system's colour, then the chart detail. A system reading the
 * topic another way gets a dashed outline instead of a fill, and says how it differs.
 */
function TrioCell({ fact, agrees, onGlow }: { fact: ReadingFact; agrees: boolean; onGlow: boolean }) {
  const t = useT();
  const label = factLabel(t, fact);
  const fill = !agrees ? null : onGlow ? styles.onGlow : styles.raised;
  return (
    <View style={[styles.cell, fill]}>
      <OrtusText
        variant="microStrong"
        color={agrees ? insightSourceMarkColor(systemSource(fact.system)) : OrtusColors.textMuted}
      >
        {systemName(t, fact.system).toLocaleUpperCase(t.language)}
      </OrtusText>
      <OrtusText variant="captionSmall" color={agrees ? OrtusColors.textPrimary : OrtusColors.textSecondary}>
        {agrees ? label : t.tf('readings_trio_differs', label)}
      </OrtusText>
      {!agrees ? <DashedBorder color={OrtusColors.outline} radius={OrtusRadii.tile} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: OrtusSpacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.xs },
  cells: { flexDirection: 'row', alignItems: 'stretch', gap: OrtusSpacing.tight },
  cell: { flex: 1, padding: OrtusSpacing.xs, gap: OrtusSpacing.xxs, borderRadius: OrtusRadii.tile, overflow: 'hidden' },
  onGlow: { backgroundColor: OrtusColors.insetContainer },
  raised: { backgroundColor: OrtusColors.surfaceRaised },
});
