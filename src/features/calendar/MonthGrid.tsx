import { memo, useMemo } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { WeekStart } from "@/core/model";
import {
  fullDateText,
  lunarDateText,
  visibleFestivals,
  weekdayHeadings,
} from "@/core/ui";
import {
  OrtusAlpha,
  OrtusColors as c,
  OrtusGradients,
  OrtusPressable,
  OrtusRadii,
  OrtusShapes,
  OrtusSizes,
  OrtusSpacing,
  OrtusText,
  TRANSPARENT,
} from "@/designsystem";
import {
  type CivilDate,
  type DayAlmanac,
  isoDate,
  type LunarDate,
} from "@/engine";
import { useT } from "@/i18n";
import {
  DAYS_PER_WEEK,
  GRID_WEEKS,
  isSundayCell,
  type MonthCell,
  type MonthPage,
  SUNDAY,
  weekdayOrder,
} from "./calendarMonth";

const FULL_MOON_DAY = 15;
const FIRST_DAY = 1;
const OPAQUE = 1;

export function WeekdayHeader({
  weekStart,
  style,
}: {
  weekStart: WeekStart;
  style?: StyleProp<ViewStyle>;
}) {
  const { language } = useT();
  const order = useMemo(() => weekdayOrder(weekStart), [weekStart]);
  const headings = useMemo(
    () => weekdayHeadings(order, language),
    [order, language],
  );
  return (
    <View style={[styles.row, style]}>
      {headings.map((name, i) => (
        <OrtusText
          key={order[i]}
          variant="footnote"
          color={order[i] === SUNDAY ? c.inauspicious.content : c.textSecondary}
          style={styles.heading}
        >
          {name}
        </OrtusText>
      ))}
    </View>
  );
}

export type MonthGridProps = {
  page: MonthPage | undefined;
  showLunar: boolean;
  onOpenDay: (date: CivilDate) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Six weeks of day cells; an unloaded month keeps the same height so the pager never jumps.
 * Memoised: pages and cells keep their identity, so swiping only draws the month that changed.
 */
export const MonthGrid = memo(function MonthGrid({
  page,
  showLunar,
  onOpenDay,
  style,
}: MonthGridProps) {
  if (!page) return <View style={[styles.empty, style]} />;
  const weeks = Array.from({ length: GRID_WEEKS }, (_, w) =>
    page.cells.slice(w * DAYS_PER_WEEK, (w + 1) * DAYS_PER_WEEK),
  );
  return (
    <View style={style}>
      {weeks.map((week, w) => (
        <View key={w} style={styles.row}>
          {week.map((cell) => (
            <DayCell
              key={isoDate(cell.day.date)}
              cell={cell}
              showLunar={showLunar}
              onOpenDay={onOpenDay}
            />
          ))}
        </View>
      ))}
    </View>
  );
});

const DayCell = memo(function DayCell({
  cell,
  showLunar,
  onOpenDay,
}: {
  cell: MonthCell;
  showLunar: boolean;
  onOpenDay: (date: CivilDate) => void;
}) {
  const t = useT();
  const day = cell.day;
  const solar = fullDateText(day.date, t.language);
  const description = showLunar
    ? t.tf("calendar_cell_description", solar, lunarDateText(t, day.lunar))
    : solar;
  const dot = dotColor(day, cell.isToday, t.language);
  const dayColor = cell.isToday
    ? c.onAccent
    : isSundayCell(cell)
      ? c.inauspicious.content
      : c.textPrimary;
  return (
    <View style={styles.cellBox}>
      <OrtusPressable
        onPress={() => onOpenDay(day.date)}
        accessibilityLabel={description}
        outerStyle={styles.flex}
        style={[
          styles.cell,
          cell.isToday && styles.today,
          { opacity: cell.inMonth ? OPAQUE : OrtusAlpha.DIMMED },
        ]}
      >
        <View
          style={styles.cellContent}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <OrtusText
            variant={cell.isToday ? "calendarDayStrong" : "calendarDay"}
            color={dayColor}
          >
            {String(day.date.day)}
          </OrtusText>
          {showLunar ? (
            <LunarLabel lunar={day.lunar} onGold={cell.isToday} />
          ) : null}
        </View>
        {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      </OrtusPressable>
    </View>
  );
});

/** Gold for a festival or a new solar term, green for a Hoàng đạo day. */
function dotColor(
  day: DayAlmanac,
  isToday: boolean,
  language: string,
): string | null {
  const hasEvent =
    day.isTermStart || visibleFestivals(day.festivals, language).length > 0;
  if (isToday && (hasEvent || day.isAuspiciousDay)) return c.onAccent;
  if (hasEvent) return c.accent;
  if (day.isAuspiciousDay) return c.auspicious.content;
  return null;
}

/** The lunar day under the solar one: the first shows its month, the fifteenth sits in a gold cell. */
export function LunarLabel({
  lunar,
  onGold = false,
}: {
  lunar: LunarDate;
  onGold?: boolean;
}) {
  const t = useT();
  const strong = onGold ? c.onAccent : c.accent;
  if (lunar.day === FIRST_DAY) {
    return (
      <OrtusText variant="microStrong" color={strong}>
        {t.tf("calendar_lunar_month_start", lunar.day, lunar.month)}
      </OrtusText>
    );
  }
  if (lunar.day === FULL_MOON_DAY) {
    return (
      <OrtusText
        variant="microStrong"
        color={strong}
        style={[styles.fullMoon, onGold && styles.fullMoonOnGold]}
      >
        {String(lunar.day)}
      </OrtusText>
    );
  }
  return (
    <OrtusText variant="micro" color={onGold ? c.onAccentMuted : c.textMuted}>
      {String(lunar.day)}
    </OrtusText>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  heading: { flex: 1, paddingVertical: OrtusSpacing.xs, textAlign: "center" },
  empty: { height: OrtusSizes.calendarCell * GRID_WEEKS },
  flex: { flex: 1 },
  cellBox: {
    flex: 1,
    height: OrtusSizes.calendarCell,
    padding: OrtusSpacing.hair,
  },
  cell: {
    flex: 1,
    ...OrtusShapes.cell,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  today: { backgroundImage: OrtusGradients.gold },
  cellContent: { alignItems: "center" },
  dot: {
    position: "absolute",
    bottom: OrtusSpacing.xxs,
    alignSelf: "center",
    width: OrtusSizes.dotSmall,
    height: OrtusSizes.dotSmall,
    borderRadius: OrtusSizes.dotSmall / 2,
  },
  fullMoon: {
    backgroundColor: c.goldCell.container,
    borderRadius: OrtusRadii.tag,
    paddingHorizontal: OrtusSpacing.xxs,
    overflow: "hidden",
  },
  fullMoonOnGold: { backgroundColor: TRANSPARENT },
});
