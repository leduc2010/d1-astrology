import { ScrollView, StyleSheet, View } from 'react-native';

import {
  brightnessBody,
  brightnessName,
  elementColors,
  elementName,
  itemOf,
  mainStarName,
  palaceRoleName,
  ReadingDisclaimer,
  starInPalace,
  starNature,
  stemBranchName,
} from '@/core/ui';
import {
  OrtusColors as c,
  ColorDot,
  OrtusBottomSheet,
  OrtusShapes,
  OrtusSpacing,
  OrtusTag,
  OrtusText,
  SectionLabel,
  TagTone,
} from '@/designsystem';
import { brightnessIn, mainStarElement, type Brightness, type MainStar } from '@/engine';
import { useT } from '@/i18n';

import { starName } from '../chartsText';
import { decadeEndAge, oppositeOf, trineOf, type PalaceView, type StarMark, type ZiWeiView } from '../model/chartViews';
import { DetailLine, PalaceMarks, palacesText, TransformationTag } from './PalaceParts';

export type PalaceDetailSheetProps = { ziWei: ZiWeiView; palace: PalaceView; onDismiss: () => void };

/** S04-03: everything about one palace, its stars one per row, what it speaks to and its partners. */
export function PalaceDetailSheet({ ziWei, palace, onDismiss }: PalaceDetailSheetProps) {
  const t = useT();
  const subtitle = [
    stemBranchName(t, palace.pillar),
    t.tf('charts_palace_decade_value', palace.decadeStartAge, decadeEndAge(palace)),
  ].join(t.tf('charts_dot_separator'));
  return (
    <OrtusBottomSheet
      onDismiss={onDismiss}
      title={t.tf('charts_palace_title', palaceRoleName(t, palace.role))}
      subtitle={subtitle}
    >
      <ScrollView contentContainerStyle={styles.column}>
        <PalaceMarks palace={palace} />
        <StarList palace={palace} />
        <StarReadings ziWei={ziWei} palace={palace} />
        <View style={styles.section}>
          <SectionLabel text={t.tf('charts_palace_meaning')} />
          <OrtusText variant="body" color={c.textBody}>
            {itemOf(t.ta('charts_palace_meanings'), palace.role)}
          </OrtusText>
        </View>
        <View style={styles.lines}>
          <DetailLine label={t.tf('charts_palace_trine')} value={palacesText(t, trineOf(ziWei, palace.branch))} />
          <DetailLine label={t.tf('charts_palace_opposite')} value={palacesText(t, [oppositeOf(ziWei, palace.branch)])} />
        </View>
        <ReadingDisclaimer />
      </ScrollView>
    </OrtusBottomSheet>
  );
}

const mainOf = (mark: StarMark): MainStar | null => (mark.star.kind === 'main' ? mark.star.star : null);

/** Every star in the palace on its own row, main stars first, in an inset panel. */
function StarList({ palace }: { palace: PalaceView }) {
  const t = useT();
  const all = [...palace.mainStars, ...palace.luckyStars, ...palace.maleficStars];
  return (
    <View style={styles.panel}>
      <OrtusText variant="captionStrong" color={c.textSecondary}>
        {t.tf('charts_palace_stars')}
      </OrtusText>
      {palace.mainStars.length === 0 ? (
        <OrtusText variant="caption" color={c.textMuted}>
          {t.tf('charts_no_main_star')}
        </OrtusText>
      ) : null}
      {palace.mainStars.map((mark) => {
        const main = mainOf(mark);
        return (
          <StarRow
            key={starName(t, mark.star)}
            mark={mark}
            dot={main === null ? c.textBody : elementColors(mainStarElement(main)).content}
            kind={main === null ? '' : t.tf('charts_palace_star_main', elementName(t, mainStarElement(main)))}
            brightness={main === null ? null : brightnessIn(main, palace.branch)}
          />
        );
      })}
      {palace.luckyStars.map((mark) => (
        <StarRow key={starName(t, mark.star)} mark={mark} dot={c.chart.luckyStar} kind={t.tf('charts_palace_star_lucky')} />
      ))}
      {palace.maleficStars.map((mark) => (
        <StarRow key={starName(t, mark.star)} mark={mark} dot={c.chart.maleficStar} kind={t.tf('charts_palace_star_malefic')} />
      ))}
      {all.every((mark) => mark.transformation === null) ? (
        <OrtusText variant="footnote" color={c.textMuted}>
          {t.tf('charts_palace_no_transformation')}
        </OrtusText>
      ) : null}
    </View>
  );
}

/**
 * What each main star brings to this palace, its nature and how freely it works at its
 * brightness. An empty palace borrows the main stars of the palace facing it, as tradition reads
 * it, still at their own brightness.
 */
function StarReadings({ ziWei, palace }: { ziWei: ZiWeiView; palace: PalaceView }) {
  const t = useT();
  const opposite = oppositeOf(ziWei, palace.branch);
  const borrowed = palace.mainStars.length === 0;
  const source = borrowed ? opposite : palace;
  const stars = source.mainStars.map(mainOf).filter((s): s is MainStar => s !== null);
  if (stars.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionLabel text={t.tf('charts_star_readings')} />
      {borrowed ? (
        <OrtusText variant="caption" color={c.textSecondary}>
          {t.tf('palace_borrowed', palaceRoleName(t, opposite.role))}
        </OrtusText>
      ) : null}
      {stars.map((star) => {
        const brightness = brightnessIn(star, source.branch);
        return (
          <View key={star} style={styles.section}>
            <OrtusText variant="captionStrong" color={c.textPrimary}>
              {t.tf('charts_star_brightness', mainStarName(t, star), brightnessName(t, brightness))}
            </OrtusText>
            <OrtusText variant="body" color={c.textBody}>
              {starInPalace(t, star, palace.role)}
            </OrtusText>
            {/* Two texts rather than one joined string: sentence spacing differs by language. */}
            <OrtusText variant="caption" color={c.textSecondary}>
              {starNature(t, star)}
            </OrtusText>
            <OrtusText variant="caption" color={c.textSecondary}>
              {brightnessBody(t, brightness)}
            </OrtusText>
          </View>
        );
      })}
    </View>
  );
}

type StarRowProps = { mark: StarMark; dot: string; kind: string; brightness?: Brightness | null };

function StarRow({ mark, dot, kind, brightness = null }: StarRowProps) {
  const t = useT();
  return (
    <View style={styles.starRow}>
      <ColorDot color={dot} />
      <View style={styles.flex}>
        <OrtusText variant="body" color={c.textPrimary}>
          {starName(t, mark.star)}
        </OrtusText>
        {kind.length > 0 ? (
          <OrtusText variant="footnote" color={c.textSecondary}>
            {kind}
          </OrtusText>
        ) : null}
      </View>
      {brightness !== null ? <OrtusTag text={brightnessName(t, brightness)} tone={TagTone.Neutral} /> : null}
      {mark.transformation !== null ? <TransformationTag transformation={mark.transformation} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: OrtusSpacing.md },
  section: { gap: OrtusSpacing.xs },
  lines: { gap: OrtusSpacing.xxs },
  panel: {
    ...OrtusShapes.input,
    backgroundColor: c.surfaceRaised,
    padding: OrtusSpacing.md,
    gap: OrtusSpacing.sm,
  },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.sm },
  flex: { flex: 1 },
});
