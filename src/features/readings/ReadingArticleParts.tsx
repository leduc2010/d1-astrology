import { StyleSheet, View } from 'react-native';

import {
  basedOn,
  detailBody,
  detailLabel,
  factLabel,
  systemName,
  systemSource,
  toneLine,
  toneSentence,
  topicBody,
  topicHeadline,
  type ReadingDetail,
  type ReadingFact,
  type Tone,
  type Topic,
  type TopicReading,
} from '@/core/reading';
import { Reveal } from '@/core/ui';
import { OrtusCard, OrtusColors, OrtusSpacing, OrtusText, SectionLabel, SourceChip } from '@/designsystem';
import { useT } from '@/i18n';

export function CombinedArticle({ reading }: { reading: TopicReading }) {
  const { tf } = useT();
  return (
    <>
      <Reveal index={0}>
        <ArticleHeader label={tf('reading_label_combined', reading.available)} topic={reading.topic} tone={reading.tone} />
      </Reveal>
      <Reveal index={1}>
        <SystemsSection facts={reading.facts} />
      </Reveal>
      {reading.dissenting.length > 0 ? (
        <Reveal index={2}>
          <DifferCard reading={reading} />
        </Reveal>
      ) : null}
      <Reveal index={3}>
        <DetailsSection details={reading.details} />
      </Reveal>
    </>
  );
}

export function SingleArticle({ reading, focus }: { reading: TopicReading; focus: ReadingFact }) {
  const t = useT();
  const agreeing = reading.facts.filter((it) => it.tone === focus.tone).length;
  return (
    <>
      <Reveal index={0}>
        <ArticleHeader
          label={t.tf('reading_label_single', systemName(t, focus.system))}
          topic={reading.topic}
          tone={focus.tone}
        />
      </Reveal>
      <Reveal index={1}>
        <SystemsSection facts={[focus]} />
      </Reveal>
      <Reveal index={2}>
        <OrtusText variant="footnote" color={OrtusColors.textMuted}>
          {t.tf('reading_single_agreement', agreeing, reading.available)}
        </OrtusText>
      </Reveal>
      <Reveal index={3}>
        <DetailsSection details={reading.details.filter((it) => it.system === focus.system)} />
      </Reveal>
    </>
  );
}

function ArticleHeader({ label, topic, tone }: { label: string; topic: Topic; tone: Tone }) {
  const t = useT();
  return (
    <View style={styles.header}>
      <SectionLabel text={label} />
      <OrtusText variant="h1" color={OrtusColors.textPrimary}>
        {topicHeadline(t, topic, tone)}
      </OrtusText>
      <OrtusText variant="body" color={OrtusColors.textSecondary}>
        {topicBody(t, topic, tone)}
      </OrtusText>
    </View>
  );
}

function SystemsSection({ facts }: { facts: readonly ReadingFact[] }) {
  const { tf } = useT();
  return (
    <View style={styles.section}>
      <SectionLabel text={tf('reading_systems_section')} />
      {facts.map((fact) => (
        <FactCard key={fact.system} fact={fact} />
      ))}
    </View>
  );
}

/** What one system sees: its source chip, the chart detail behind it, and the direction it points. */
function FactCard({ fact }: { fact: ReadingFact }) {
  const t = useT();
  return (
    <OrtusCard gap={OrtusSpacing.xs}>
      <SourceChip text={basedOn(t, fact.system)} source={systemSource(fact.system)} />
      <OrtusText variant="title" color={OrtusColors.textPrimary}>
        {factLabel(t, fact)}
      </OrtusText>
      <OrtusText variant="caption" color={OrtusColors.textSecondary}>
        {toneSentence(t, fact.tone)}
      </OrtusText>
    </OrtusCard>
  );
}

/** The supporting signals, each with its chart label and its own reading. Nothing when there are none. */
function DetailsSection({ details }: { details: readonly ReadingDetail[] }) {
  const t = useT();
  if (details.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionLabel text={t.tf('reading_details_section')} />
      <OrtusCard gap={OrtusSpacing.md}>
        {details.map((detail, i) => (
          // Details have no id; their order is fixed per reading.
          <View key={`${detail.kind}-${i}`} style={styles.detail}>
            <SourceChip text={basedOn(t, detail.system)} source={systemSource(detail.system)} />
            <OrtusText variant="captionStrong" color={OrtusColors.textPrimary}>
              {detailLabel(t, detail)}
            </OrtusText>
            <OrtusText variant="body" color={OrtusColors.textSecondary}>
              {detailBody(t, detail)}
            </OrtusText>
          </View>
        ))}
      </OrtusCard>
    </View>
  );
}

/** Where a system reads the topic another way, said plainly rather than averaged away. */
function DifferCard({ reading }: { reading: TopicReading }) {
  const t = useT();
  return (
    <OrtusCard gap={OrtusSpacing.xs}>
      <OrtusText variant="title" color={OrtusColors.textPrimary}>
        {t.tf('reading_differ_title')}
      </OrtusText>
      {reading.dissenting.map((fact) => (
        <View key={fact.system} style={styles.differ}>
          <OrtusText variant="body" color={OrtusColors.textSecondary}>
            {t.tf('reading_differ_line', systemName(t, fact.system), toneLine(t, fact.tone))}
          </OrtusText>
          <OrtusText variant="caption" color={OrtusColors.textMuted}>
            {topicHeadline(t, reading.topic, fact.tone)}
          </OrtusText>
        </View>
      ))}
    </OrtusCard>
  );
}

const styles = StyleSheet.create({
  header: { gap: OrtusSpacing.sm },
  section: { alignSelf: 'stretch', gap: OrtusSpacing.cardGap },
  detail: { gap: OrtusSpacing.xxs },
  differ: { gap: OrtusSpacing.xs },
});
