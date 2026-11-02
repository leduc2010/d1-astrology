import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  branchName,
  bureauName,
  elementColors,
  elementName,
  hourName,
  listText,
  lunarDateShortText,
  palaceRoleName,
  solarDateText,
  transformationName,
  useWidestText,
} from '@/core/ui';
import {
  OrtusColors as c,
  ColorDot,
  OrtusCard,
  OrtusGlowCard,
  OrtusIcons,
  OrtusLinkButton,
  OrtusMotion,
  OrtusSectionCard,
  OrtusSpacing,
  OrtusText,
  SectionLabel,
  TagTone,
  useReducedMotion,
} from '@/designsystem';
import { ELEMENTS, type Branch, type Transformation, type ZiWeiStar } from '@/engine';
import { useT } from '@/i18n';

import { mainStarsText, polarityText, starName } from '../chartsText';
import { decadeEndAge, oppositeOf, palaceOf, trineOf, type BirthCharts, type ZiWeiView } from '../model/chartViews';
import { ChartFootnote } from './ChartFrame';
import { DetailLine, PalaceMarks, palacesText, TransformationTag } from './PalaceParts';

export function NeedsTimeNotice() {
  const { tf } = useT();
  return (
    <OrtusCard>
      <OrtusText variant="title" color={c.textPrimary}>
        {tf('charts_needs_time_title')}
      </OrtusText>
      <OrtusText variant="caption" color={c.textSecondary}>
        {tf('charts_needs_time_body')}
      </OrtusText>
    </OrtusCard>
  );
}

/** Middle of the board: who the chart is for and the birth details it rests on. */
export function BoardCentre({ charts, ziWei }: { charts: BirthCharts; ziWei: ZiWeiView }) {
  const t = useT();
  const details = [
    solarDateText(charts.solarDate, t.language, 'medium'),
    lunarDateShortText(t, charts.lunarDate),
    charts.hourBranch === null ? null : hourName(t, charts.hourBranch),
    bureauName(t, ziWei.bureau),
  ].filter((d): d is string => d !== null);
  return (
    <>
      <OrtusText variant="hanSmall" color={c.accent}>
        {t.tf('charts_ziwei_han')}
      </OrtusText>
      <OrtusText variant="title" color={c.textPrimary} numberOfLines={1} style={styles.centreText}>
        {charts.name}
      </OrtusText>
      <OrtusText variant="caption" color={c.textSecondary}>
        {polarityText(t, ziWei.yearPillar.stem, charts.gender)}
      </OrtusText>
      <View style={styles.details}>
        {details.map((d) => (
          <OrtusText key={d} variant="micro" color={c.textMuted} style={styles.centreText}>
            {d}
          </OrtusText>
        ))}
      </View>
    </>
  );
}

type SelectedPalaceCardProps = { ziWei: ZiWeiView; selected: Branch; onOpenDetails: () => void };

/** The picked palace in words: its stars, decade, and the palaces that bear on it. */
export function SelectedPalaceCard({ ziWei, selected, onOpenDetails }: SelectedPalaceCardProps) {
  const t = useT();
  const reduced = useReducedMotion();
  const palace = palaceOf(ziWei, selected);
  const entering = reduced ? undefined : FadeIn.duration(OrtusMotion.STANDARD).easing(OrtusMotion.settle);
  return (
    // Keyed by palace so each pick fades in afresh (Kotlin AnimatedContent).
    <Animated.View key={selected} entering={entering}>
      <OrtusGlowCard>
        <SectionLabel text={t.tf('charts_palace_label', palaceRoleName(t, palace.role), branchName(t, palace.branch))} />
        <OrtusText variant="h2" color={c.textPrimary}>
          {mainStarsText(t, palace)}
        </OrtusText>
        <PalaceMarks palace={palace} neutral={TagTone.NeutralOnGlow} />
        <DetailLine
          label={t.tf('charts_palace_decade')}
          value={t.tf('charts_luck_ages', palace.decadeStartAge, decadeEndAge(palace))}
        />
        <StarsLine label={t.tf('charts_palace_lucky')} stars={palace.luckyStars.map((m) => m.star)} />
        <StarsLine label={t.tf('charts_palace_malefic')} stars={palace.maleficStars.map((m) => m.star)} />
        <DetailLine label={t.tf('charts_palace_trine')} value={palacesText(t, trineOf(ziWei, palace.branch))} />
        <DetailLine label={t.tf('charts_palace_opposite')} value={palacesText(t, [oppositeOf(ziWei, palace.branch)])} />
        <OrtusLinkButton text={t.tf('charts_palace_details')} onPress={onOpenDetails} trailingIcon={OrtusIcons.ChevronRight} />
      </OrtusGlowCard>
    </Animated.View>
  );
}

function StarsLine({ label, stars }: { label: string; stars: readonly ZiWeiStar[] }) {
  const t = useT();
  if (stars.length === 0) return null;
  return <DetailLine label={label} value={listText(t, stars.map((s) => starName(t, s)))} />;
}

type Transformations = ZiWeiView['transformations'];

/** Tứ Hóa: which star the birth year turns to Lộc, Quyền, Khoa and Kỵ. */
export function TransformationsCard({ transformations }: { transformations: Transformations }) {
  const t = useT();
  const names = transformations.map(([tr]: readonly [Transformation, ZiWeiStar]) => transformationName(t, tr));
  // Every badge as wide as the widest, so the star names line up in one column.
  const { width, measurer } = useWidestText(names, 'tag');
  const badgeWidth = width > 0 ? width + OrtusSpacing.xs * 2 : undefined;
  return (
    <OrtusSectionCard title={t.tf('charts_transformations_label')}>
      {measurer}
      <View style={styles.transformations}>
        {transformations.map(([tr, star]) => (
          <View key={tr} style={styles.transformationRow}>
            <TransformationTag transformation={tr} style={{ width: badgeWidth }} />
            <OrtusText variant="body" color={c.textPrimary}>
              {starName(t, star)}
            </OrtusText>
          </View>
        ))}
      </View>
    </OrtusSectionCard>
  );
}

/** What the board's colours mean: main stars by element, then the picked / helpful / testing key. */
export function LegendCard() {
  const t = useT();
  return (
    <OrtusSectionCard title={t.tf('charts_palace_legend')}>
      <OrtusText variant="captionStrong" color={c.textSecondary}>
        {t.tf('charts_palace_legend_elements')}
      </OrtusText>
      <View style={styles.legend}>
        {ELEMENTS.map((element) => (
          <View key={element} style={styles.legendItem}>
            <ColorDot color={elementColors(element).content} />
            <OrtusText variant="footnote" color={c.textBody}>
              {elementName(t, element)}
            </OrtusText>
          </View>
        ))}
      </View>
      <ChartFootnote text={t.tf('charts_ziwei_footnote')} />
    </OrtusSectionCard>
  );
}

const styles = StyleSheet.create({
  centreText: { textAlign: 'center' },
  details: { paddingTop: OrtusSpacing.xs, alignItems: 'center' },
  transformations: { gap: OrtusSpacing.xs },
  transformationRow: { flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.sm },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: OrtusSpacing.md, rowGap: OrtusSpacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.tight },
});
