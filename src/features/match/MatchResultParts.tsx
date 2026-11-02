import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { stemBranchName, YearSeal } from '@/core/ui';
import {
  InsightSource,
  insightSourceMarkColor,
  OrtusCard,
  OrtusColors,
  OrtusIcons,
  OrtusSizes,
  OrtusSpacing,
  OrtusStroke,
  OrtusTag,
  OrtusText,
  OrtusToneCard,
  SectionLabel,
  SourceChip,
  type ToneColors,
} from '@/designsystem';
import type { AxisReading, MatchMark } from '@/engine';
import { useT } from '@/i18n';

import { AxisBar } from './MatchCommon';
import { branchMark, mansionMark, naYinMark, type MatchPoint, type MatchReport, type MatchSide } from './matchReport';
import {
  axisName,
  branchBondText,
  criterionTitle,
  levelColor,
  levelName,
  mansionText,
  markName,
  markTone,
  naYinText,
  pointText,
} from './matchText';

type ReportProps = { report: MatchReport };

/** Both year seals, joined by a gold thread with a star at its centre. */
export function SealsHeader({ report }: ReportProps) {
  return (
    <View style={styles.row}>
      <SealWithName side={report.first} />
      <View style={[styles.row, styles.fill]}>
        <View style={styles.thread} />
        <OrtusIcons.Sparkle size={OrtusSizes.cardStar} color={OrtusColors.accent} />
        <View style={styles.thread} />
      </View>
      <SealWithName side={report.second} />
    </View>
  );
}

function SealWithName({ side }: { side: MatchSide }) {
  const t = useT();
  return (
    <View style={[styles.fill, styles.seal]}>
      <YearSeal branch={side.lunarYear.branch} />
      <OrtusText variant="title" color={OrtusColors.textPrimary} style={styles.center}>
        {side.name}
      </OrtusText>
      <OrtusText variant="caption" color={OrtusColors.textSecondary}>
        {stemBranchName(t, side.lunarYear)}
      </OrtusText>
    </View>
  );
}

/** The four synastry axes, each a word and a bar — a level to read, not a score. */
export function AstroCard({ report }: ReportProps) {
  const { tf } = useT();
  return (
    <SystemCard title={tf('match_systems_astro')} source={tf('match_source_astro')} insight={InsightSource.Astrology}>
      {report.axes.map((reading) => (
        <AxisRow key={reading.axis} reading={reading} />
      ))}
    </SystemCard>
  );
}

function AxisRow({ reading }: { reading: AxisReading }) {
  const t = useT();
  const name = axisName(t, reading.axis);
  const level = levelName(t, reading.level);
  return (
    <View style={styles.axis} accessible accessibilityLabel={t.tf('match_point', name, level)}>
      <View style={styles.spread}>
        <OrtusText variant="caption" color={OrtusColors.textBody}>
          {name}
        </OrtusText>
        <OrtusText variant="captionStrong" color={levelColor(reading.level)}>
          {level}
        </OrtusText>
      </View>
      <AxisBar level={reading.level} />
    </View>
  );
}

/** Bát Tự criteria, each marked on its own, with a note that nothing is totalled. */
export function BaZiCard({ report }: ReportProps) {
  const t = useT();
  return (
    <SystemCard title={t.tf('match_systems_bazi')} source={t.tf('match_source_bazi')} insight={InsightSource.BatTu}>
      {report.criteria.map((it) => (
        <MarkRow key={it.criterion} text={criterionTitle(t, it.criterion, report)} mark={it.mark} />
      ))}
      <OrtusText variant="footnote" color={OrtusColors.textMuted}>
        {t.tf('match_no_total')}
      </OrtusText>
    </SystemCard>
  );
}

/** Folk "hợp tuổi": the year branches, the nạp âm and the life-trigram mansion. */
export function FolkCard({ report }: ReportProps) {
  const t = useT();
  const folk = report.folk;
  return (
    <OrtusCard gap={OrtusSpacing.sm}>
      <SectionLabel text={t.tf('match_folk')} />
      <MarkRow text={branchBondText(t, folk.branches, report)} mark={branchMark(folk)} />
      <MarkRow text={naYinText(t, folk.naYin, report)} mark={naYinMark(folk)} />
      <MarkRow text={mansionText(t, folk.mansion)} mark={mansionMark(folk)} />
    </OrtusCard>
  );
}

/** A line of text with its mark as a tag at the end. */
function MarkRow({ text, mark }: { text: string; mark: MatchMark }) {
  const t = useT();
  return (
    <View style={styles.markRow}>
      <OrtusText variant="caption" color={OrtusColors.textBody} style={styles.fill}>
        {text}
      </OrtusText>
      <OrtusTag text={markName(t, mark)} tone={markTone(mark)} />
    </View>
  );
}

type SystemCardProps = { title: string; source: string; insight: InsightSource; children?: ReactNode };

function SystemCard({ title, source, insight, children }: SystemCardProps) {
  return (
    <OrtusCard gap={OrtusSpacing.sm}>
      <View style={styles.spreadCentered}>
        <SectionLabel text={title} color={insightSourceMarkColor(insight)} style={styles.fill} />
        <SourceChip text={source} source={insight} />
      </View>
      {children}
    </OrtusCard>
  );
}

type PointsCardProps = {
  label: string;
  points: readonly MatchPoint[];
  empty: string;
  tone: ToneColors;
  report: MatchReport;
};

export function PointsCard({ label, points, empty, tone, report }: PointsCardProps) {
  const t = useT();
  return (
    <OrtusToneCard label={label} tone={tone} style={styles.fill}>
      {points.length === 0 ? (
        <OrtusText variant="caption" color={OrtusColors.textMuted}>
          {empty}
        </OrtusText>
      ) : (
        points.map((point, index) => (
          <OrtusText key={`${point.kind}-${index}`} variant="caption" color={OrtusColors.textBody}>
            {pointText(t, point, report)}
          </OrtusText>
        ))
      )}
    </OrtusToneCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  fill: { flex: 1 },
  center: { textAlign: 'center' },
  seal: { alignItems: 'center', gap: OrtusSpacing.xs },
  thread: { flex: 1, height: OrtusStroke.hairline, backgroundColor: OrtusColors.accent },
  axis: { width: '100%', gap: OrtusSpacing.xxs },
  spread: { flexDirection: 'row', justifyContent: 'space-between' },
  spreadCentered: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  markRow: { flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.sm },
});
