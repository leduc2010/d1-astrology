import type { ReactNode } from 'react';
import { I18nManager, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { elementColors, palaceRoleName, stemBranchName, transformationColors, transformationShortName } from '@/core/ui';
import {
  OrtusColors as c,
  OrtusGradients,
  OrtusMotion,
  OrtusPressable,
  OrtusShapes,
  OrtusSizes,
  OrtusSpacing,
  OrtusStroke,
  OrtusText,
  useReducedMotion,
} from '@/designsystem';
import { Branch, mainStarElement, PalaceRole } from '@/engine';
import { useT } from '@/i18n';

import { starName } from '../chartsText';
import { oppositeOf, palaceOf, trineOf, type PalaceView, type StarMark, type ZiWeiView } from '../model/chartViews';

/* The classic square Tử Vi board: twelve palaces round the edge, Tỵ top-left, Dần bottom-left, in every language. */

const TOP_ROW = [Branch.SI, Branch.WU, Branch.WEI, Branch.SHEN] as const;
const BOTTOM_ROW = [Branch.YIN, Branch.CHOU, Branch.ZI, Branch.HAI] as const;
const LEFT_SIDE = [Branch.CHEN, Branch.MAO] as const;
const RIGHT_SIDE = [Branch.YOU, Branch.XU] as const;
const CENTRE_SPAN = 2;

/** Text inside the board keeps the reading direction, though the board itself never mirrors. */
const TEXT_DIRECTION = I18nManager.isRTL ? 'rtl' : 'ltr';

/** How a palace relates to the one picked: itself, a trine or the opposite palace, or none. */
type Link = 'selected' | 'related' | 'none';

export type PalaceGridProps = {
  ziWei: ZiWeiView;
  selected: Branch | null;
  onSelect: (branch: Branch) => void;
  centre: ReactNode;
};

export function PalaceGrid({ ziWei, selected, onSelect, centre }: PalaceGridProps) {
  const related = new Set(
    selected === null ? [] : [...trineOf(ziWei, selected), oppositeOf(ziWei, selected)].map((p) => p.branch),
  );
  const linkOf = (branch: Branch): Link => (branch === selected ? 'selected' : related.has(branch) ? 'related' : 'none');
  const cell = (branch: Branch, style: ViewStyle = styles.weighted) => (
    <PalaceCell
      key={branch}
      palace={palaceOf(ziWei, branch)}
      isCurrentDecade={ziWei.currentDecade === branch}
      link={linkOf(branch)}
      onPress={() => onSelect(branch)}
      style={style}
    />
  );
  return (
    <View style={styles.board}>
      <View style={styles.row}>{TOP_ROW.map((b) => cell(b))}</View>
      <View style={styles.row}>
        <View style={styles.side}>{LEFT_SIDE.map((b) => cell(b, styles.full))}</View>
        <View style={styles.centre}>{centre}</View>
        <View style={styles.side}>{RIGHT_SIDE.map((b) => cell(b, styles.full))}</View>
      </View>
      <View style={styles.row}>{BOTTOM_ROW.map((b) => cell(b))}</View>
    </View>
  );
}

type PalaceCellProps = {
  palace: PalaceView;
  isCurrentDecade: boolean;
  link: Link;
  onPress: () => void;
  style: ViewStyle;
};

const BORDERS: Record<Link, string> = {
  selected: c.chart.selectedBorder,
  related: c.glowBorder,
  none: c.chart.gridLine,
};

function PalaceCell({ palace, isCurrentDecade, link, onPress, style }: PalaceCellProps) {
  const t = useT();
  const reduced = useReducedMotion();
  const target = BORDERS[link];
  const border = useAnimatedStyle(() => ({ borderColor: withTiming(target, OrtusMotion.standard(reduced)) }));
  const isSelected = link === 'selected';
  return (
    <OrtusPressable
      onPress={onPress}
      cue={null}
      accessibilityState={{ selected: isSelected }}
      outerStyle={style}
      style={[styles.cellFrame, isSelected ? styles.cellSelected : styles.cellIdle]}
    >
      <Animated.View style={[styles.cell, border]}>
        {/* Stars take what room is left above the footer; a crowded palace clips rather than spill. */}
        <View style={styles.stars}>
          <OrtusText
            variant="microStrong"
            color={palace.role === PalaceRole.LIFE ? c.accent : c.textPrimary}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {palaceRoleName(t, palace.role)}
          </OrtusText>
          {palace.mainStars.map((mark) => (
            <StarLine
              key={`${mark.star.kind}-${mark.star.star}`}
              mark={mark}
              color={mark.star.kind === 'main' ? elementColors(mainStarElement(mark.star.star)).content : c.textBody}
            />
          ))}
          {palace.luckyStars.map((mark) => (
            <StarLine key={`${mark.star.kind}-${mark.star.star}`} mark={mark} color={c.chart.luckyStar} />
          ))}
          {palace.maleficStars.map((mark) => (
            <StarLine key={`${mark.star.kind}-${mark.star.star}`} mark={mark} color={c.chart.maleficStar} />
          ))}
        </View>
        <CellFooter palace={palace} isCurrentDecade={isCurrentDecade} />
      </Animated.View>
    </OrtusPressable>
  );
}

/** A star in its colour, with its transformation badge if the year gives it one. */
function StarLine({ mark, color }: { mark: StarMark; color: string }) {
  const t = useT();
  const tr = mark.transformation;
  return (
    <View style={styles.starLine}>
      <OrtusText variant="microStrong" color={color} numberOfLines={1} ellipsizeMode="tail" style={styles.shrink}>
        {starName(t, mark.star)}
      </OrtusText>
      {tr !== null ? (
        <OrtusText
          variant="nano"
          color={transformationColors(tr).content}
          numberOfLines={1}
          style={[styles.badge, { backgroundColor: transformationColors(tr).container }]}
        >
          {transformationShortName(t, tr)}
        </OrtusText>
      ) : null}
    </View>
  );
}

/** Palace pillar and decade ages, with Thân / Tuần / Triệt marks when they fall here. */
function CellFooter({ palace, isCurrentDecade }: { palace: PalaceView; isCurrentDecade: boolean }) {
  const t = useT();
  const marks = [
    palace.isBody ? t.tf('charts_mark_body') : null,
    palace.isVoid ? t.tf('charts_mark_void') : null,
    palace.isCut ? t.tf('charts_mark_cut') : null,
  ].filter((m): m is string => m !== null);
  return (
    <View>
      {marks.length > 0 ? (
        <OrtusText variant="nano" color={c.mysticLight} numberOfLines={1}>
          {marks.join(t.tf('charts_dot_separator'))}
        </OrtusText>
      ) : null}
      <View style={styles.footerRow}>
        <OrtusText variant="nano" color={c.textMuted} numberOfLines={1} ellipsizeMode="tail" style={styles.flex}>
          {stemBranchName(t, palace.pillar)}
        </OrtusText>
        <OrtusText
          variant="nano"
          color={isCurrentDecade ? c.onAccent : c.textSecondary}
          style={isCurrentDecade ? styles.decadeNow : undefined}
        >
          {t.tf('charts_decade_start', palace.decadeStartAge)}
        </OrtusText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The board is a fixed chart, so it never mirrors.
  board: { direction: 'ltr', gap: OrtusSpacing.hair },
  row: { flexDirection: 'row', gap: OrtusSpacing.hair },
  weighted: { flex: 1 },
  full: { alignSelf: 'stretch' },
  side: { flex: 1, gap: OrtusSpacing.hair },
  centre: {
    flex: CENTRE_SPAN,
    height: OrtusSizes.palaceCellHeight * 2 + OrtusSpacing.hair,
    ...OrtusShapes.cell,
    overflow: 'hidden',
    backgroundColor: c.insetContainer,
    padding: OrtusSpacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    direction: TEXT_DIRECTION,
  },
  cellFrame: { height: OrtusSizes.palaceCellHeight, ...OrtusShapes.cell },
  cellSelected: { backgroundImage: OrtusGradients.selectedCell },
  cellIdle: { backgroundColor: c.surface },
  cell: {
    flex: 1,
    ...OrtusShapes.cell,
    borderWidth: OrtusStroke.hairline,
    padding: OrtusSpacing.xxs,
    direction: TEXT_DIRECTION,
  },
  stars: { flex: 1, overflow: 'hidden' },
  starLine: { flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.hair },
  shrink: { flexShrink: 1 },
  badge: { ...OrtusShapes.tag, overflow: 'hidden', paddingHorizontal: OrtusSpacing.hair },
  footerRow: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  decadeNow: {
    ...OrtusShapes.tag,
    overflow: 'hidden',
    backgroundColor: c.accent,
    paddingHorizontal: OrtusSpacing.hair,
  },
});
