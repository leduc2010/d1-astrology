import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AgreementTag, factFor, topicHeadline, topicName, type TopicReading } from '@/core/reading';
import { Reveal, usePremiumOffered, useResumedOnly } from '@/core/ui';
import {
  CalloutTone,
  IconBox,
  OrtusBottomSheet,
  OrtusCallout,
  OrtusCard,
  OrtusCardRow,
  OrtusColors,
  OrtusIcons,
  OrtusListRow,
  OrtusSegmentedControl,
  OrtusSpacing,
  OrtusText,
  OrtusWideButton,
  PremiumTag,
  RowTrailing,
  SectionLabel,
} from '@/designsystem';
import { useT } from '@/i18n';
import { goBack, navigateToReading, navigateToTrio } from '@/navigation/routes';

import { ReadingsPage, topicIcon, ZiWeiMissingNotice } from './ReadingsCommon';
import { hasZiWei, READING_LENSES, ReadingLens, lensSystem, topicKey, type ReadingsReady, type ReadingsUiState } from './readingsModel';
import { useReadingsModel } from './useReadingsModel';

const GRID_COLUMNS = 2;
const HEADLINE_LINES = 3;

/** The readings hub, wired to its model and the app's navigation. */
export function ReadingsHubScreen() {
  const model = useReadingsModel();
  const openReading = useResumedOnly((topic: TopicReading['topic'], lens: ReadingLens) =>
    navigateToReading(topicKey(topic), lens),
  );
  const openTrio = useResumedOnly(navigateToTrio);
  const onBack = useResumedOnly(goBack);
  return (
    <ReadingsHubContent
      state={model.state}
      onSelectLens={model.onSelectLens}
      onOpenReading={openReading}
      onOpenTrio={openTrio}
      onBack={onBack}
    />
  );
}

export type ReadingsHubContentProps = {
  state: ReadingsUiState;
  onSelectLens: (lens: ReadingLens) => void;
  onOpenReading: (topic: TopicReading['topic'], lens: ReadingLens) => void;
  onOpenTrio: () => void;
  onBack: () => void;
};

/** S05-01: lens switch, the six topic cards, "my trio" and the premium deep dives. */
export function ReadingsHubContent({ state, onSelectLens, onOpenReading, onOpenTrio, onBack }: ReadingsHubContentProps) {
  const t = useT();
  const premiumOffered = usePremiumOffered();
  const [showPremium, setShowPremium] = useState(false);
  return (
    <>
      <ReadingsPage title={t.tf('readings_title')} state={state} onBack={onBack}>
        {(ready) => (
          <>
            <Reveal index={0}>
              <OrtusSegmentedControl
                options={t.ta('readings_lenses')}
                selectedIndex={READING_LENSES.indexOf(ready.lens)}
                onSelect={(i) => onSelectLens(READING_LENSES[i] ?? ReadingLens.COMBINED)}
                compact
              />
            </Reveal>
            {!hasZiWei(ready) ? (
              <Reveal index={1}>
                <OrtusCallout text={t.tf('readings_no_time_note')} tone={CalloutTone.Info} />
              </Reveal>
            ) : null}
            {ready.lens === ReadingLens.ZIWEI && !hasZiWei(ready) ? (
              <ZiWeiMissingNotice />
            ) : (
              <Reveal index={2}>
                <TopicGrid ready={ready} onOpenReading={onOpenReading} />
              </Reveal>
            )}
            <Reveal index={3}>
              <OrtusCard contentPadding={OrtusSpacing.none}>
                <OrtusListRow
                  title={t.tf('readings_trio_title')}
                  subtitle={t.tf('readings_trio_subtitle')}
                  icon={OrtusIcons.Sparkle}
                  onPress={onOpenTrio}
                />
              </OrtusCard>
            </Reveal>
            {/* Deep dives are Premium-only; a build that sells no Premium does not tease them. */}
            {premiumOffered ? (
              <Reveal index={4}>
                <DeepDives onOpen={() => setShowPremium(true)} />
              </Reveal>
            ) : null}
          </>
        )}
      </ReadingsPage>
      {showPremium ? <PremiumSheet onDismiss={() => setShowPremium(false)} /> : null}
    </>
  );
}

type TopicGridProps = {
  ready: ReadingsReady;
  onOpenReading: (topic: TopicReading['topic'], lens: ReadingLens) => void;
};

function TopicGrid({ ready, onOpenReading }: TopicGridProps) {
  const { tf } = useT();
  const rows: TopicReading[][] = [];
  ready.readings.forEach((reading, i) => {
    if (i % GRID_COLUMNS === 0) rows.push([]);
    rows[rows.length - 1]?.push(reading);
  });
  return (
    <View style={styles.grid}>
      <SectionLabel text={tf('readings_topics_label')} />
      {rows.map((row) => (
        <OrtusCardRow key={row.map((it) => it.topic).join('-')}>
          {row.map((reading) => (
            <TopicCard
              key={reading.topic}
              reading={reading}
              lens={ready.lens}
              onOpen={() => onOpenReading(reading.topic, ready.lens)}
            />
          ))}
        </OrtusCardRow>
      ))}
    </View>
  );
}

type TopicCardProps = { reading: TopicReading; lens: ReadingLens; onOpen: () => void };

/** One topic: its icon, how many systems agree (combined lens only), the name and the headline. */
function TopicCard({ reading, lens, onOpen }: TopicCardProps) {
  const t = useT();
  const system = lensSystem(lens);
  const tone = system === null ? reading.tone : factFor(reading, system)?.tone;
  return (
    <OrtusCard onPress={tone === undefined ? undefined : onOpen} style={styles.cell}>
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <IconBox icon={topicIcon(reading.topic)} />
          {system === null ? <AgreementTag reading={reading} /> : null}
        </View>
        <OrtusText variant="title" color={OrtusColors.textPrimary}>
          {topicName(t, reading.topic)}
        </OrtusText>
        <OrtusText
          variant="caption"
          color={tone === undefined ? OrtusColors.textMuted : OrtusColors.textSecondary}
          numberOfLines={HEADLINE_LINES}
          ellipsizeMode="tail"
        >
          {tone === undefined ? t.tf('readings_needs_time') : topicHeadline(t, reading.topic, tone)}
        </OrtusText>
      </View>
    </OrtusCard>
  );
}

function DeepDives({ onOpen }: { onOpen: () => void }) {
  const { tf, ta } = useT();
  const titles = ta('readings_deep_titles');
  const meta = ta('readings_deep_meta');
  return (
    <View style={styles.grid}>
      <SectionLabel text={tf('readings_deep_label')} />
      <OrtusCard contentPadding={OrtusSpacing.none}>
        {titles.map((title, i) => (
          <OrtusListRow
            key={title}
            title={title}
            subtitle={meta[i]}
            leading={<PremiumTag text={tf('readings_premium')} />}
            showDivider={i < titles.length - 1}
            trailing={RowTrailing.Chevron}
            onPress={onOpen}
          />
        ))}
      </OrtusCard>
    </View>
  );
}

function PremiumSheet({ onDismiss }: { onDismiss: () => void }) {
  const { tf } = useT();
  return (
    <OrtusBottomSheet
      onDismiss={onDismiss}
      title={tf('readings_premium_sheet_title')}
      subtitle={tf('readings_premium_sheet_body')}
    >
      {(close) => <OrtusWideButton text={tf('readings_premium_sheet_ok')} onPress={close} />}
    </OrtusBottomSheet>
  );
}

const styles = StyleSheet.create({
  grid: { alignSelf: 'stretch', gap: OrtusSpacing.cardGap },
  cell: { flex: 1 },
  card: { gap: OrtusSpacing.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
