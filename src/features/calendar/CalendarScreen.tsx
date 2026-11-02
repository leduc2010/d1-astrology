import { type ReactNode, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { FlatList, type FlatListProps, type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { AdPlacement } from '@/core/model';
import { OrtusScreen, Reveal, SampleNativeAd, stemBranchName, useResumedOnly } from '@/core/ui';
import {
  ButtonSize,
  ButtonStyle,
  ColorDot,
  OrtusButton,
  OrtusCard,
  OrtusColors as c,
  OrtusRootHeader,
  OrtusSizes,
  OrtusSpacing,
  OrtusText,
  useReducedMotion,
} from '@/designsystem';
import { type CivilDate, lunarDate, yearPillar } from '@/engine';
import { useT } from '@/i18n';
import { navigateToDay } from '@/navigation/routes';
import { GRID_WEEKS, MonthIndex } from './calendarMonth';
import type { CalendarUiState } from './calendarModel';
import { monthTitle } from './dateText';
import { LunarLabel, MonthGrid, WeekdayHeader } from './MonthGrid';
import { UpcomingList } from './UpcomingList';
import { useCalendarModel } from './useCalendarModel';

const LEGEND_MONTH_START = lunarDate(2026, 9, 1);
const LEGEND_FULL_MOON = lunarDate(2026, 9, 15);

type OnViewable = NonNullable<FlatListProps<number>['onViewableItemsChanged']>;

const MONTH_INDEXES: readonly number[] = Array.from({ length: MonthIndex.COUNT }, (_, i) => i);
/** A month counts as shown once more than half of it is on screen, like the Compose pager's current page. */
const VIEWABILITY = { itemVisiblePercentThreshold: 51 };
/** Months drawn around the visible one: itself and one on each side. */
const PAGER_WINDOW = 3;

/** The Calendar tab, wired to its model and the app's navigation. */
export function CalendarScreen() {
  const { state, onMonthShown } = useCalendarModel();
  const openDay = useResumedOnly(navigateToDay);
  return <CalendarContent state={state} onMonthShown={onMonthShown} onOpenDay={openDay} />;
}

export type CalendarContentProps = {
  state: CalendarUiState;
  onMonthShown: (index: number) => void;
  onOpenDay: (date: CivilDate) => void;
};

export function CalendarContent({ state, onMonthShown, onOpenDay }: CalendarContentProps) {
  const t = useT();
  const reduced = useReducedMotion();
  const pager = useRef<FlatList<number>>(null);
  const [current, setCurrent] = useState(state.todayIndex);
  const [width, setWidth] = useState(0);
  const month = MonthIndex.month(current);

  const latestShown = useRef(onMonthShown);
  useLayoutEffect(() => {
    latestShown.current = onMonthShown;
  });
  // FlatList requires this callback to keep its identity for the list's lifetime.
  const onViewable = useCallback<OnViewable>(({ viewableItems }) => {
    const index: unknown = viewableItems[0]?.item;
    if (typeof index !== 'number') return;
    setCurrent(index);
    latestShown.current(index);
  }, []);

  const goToToday = () => pager.current?.scrollToIndex({ index: state.todayIndex, animated: !reduced });
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const getItemLayout = useCallback(
    (_: ArrayLike<number> | null | undefined, index: number) => ({ length: width, offset: width * index, index }),
    [width],
  );

  return (
    <OrtusScreen
      header={
        <OrtusRootHeader
          label={t.tf('calendar_year_label', month.year, stemBranchName(t, yearPillar(month.year)))}
          title={monthTitle(month, t.language)}
          actions={
            <OrtusButton
              text={t.tf('calendar_today')}
              onPress={goToToday}
              variant={ButtonStyle.Outline}
              size={ButtonSize.Small}
            />
          }
        />
      }
    >
      <Reveal index={0}>
        <OrtusCard contentPadding={OrtusSpacing.xs}>
          <WeekdayHeader weekStart={state.weekStart} />
          <View onLayout={onLayout} style={styles.pager}>
            {width > 0 ? (
              <FlatList
                ref={pager}
                data={MONTH_INDEXES}
                keyExtractor={String}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={state.todayIndex}
                getItemLayout={getItemLayout}
                extraData={state}
                windowSize={PAGER_WINDOW}
                initialNumToRender={1}
                maxToRenderPerBatch={1}
                viewabilityConfig={VIEWABILITY}
                onViewableItemsChanged={onViewable}
                renderItem={({ item }) => (
                  <MonthGrid
                    page={state.pages[item]}
                    showLunar={state.showLunar}
                    onOpenDay={onOpenDay}
                    style={{ width }}
                  />
                )}
              />
            ) : null}
          </View>
        </OrtusCard>
      </Reveal>
      <Reveal index={1}>
        <Legend showLunar={state.showLunar} />
      </Reveal>
      <Reveal index={2}>
        <UpcomingList days={state.upcoming} onOpenDay={onOpenDay} />
      </Reveal>
      <Reveal index={3}>
        <SampleNativeAd placement={AdPlacement.CALENDAR_NATIVE} />
      </Reveal>
    </OrtusScreen>
  );
}

function Legend({ showLunar }: { showLunar: boolean }) {
  const t = useT();
  return (
    <View style={styles.legend}>
      <LegendItem text={t.tf('calendar_legend_good')}>
        <ColorDot color={c.auspicious.content} size={OrtusSizes.dotSmall} />
      </LegendItem>
      <LegendItem text={t.tf('calendar_legend_event')}>
        <ColorDot color={c.accent} size={OrtusSizes.dotSmall} />
      </LegendItem>
      {showLunar ? (
        <>
          <LegendItem text={t.tf('calendar_legend_month_start')}>
            <LunarLabel lunar={LEGEND_MONTH_START} />
          </LegendItem>
          <LegendItem text={t.tf('calendar_legend_full_moon')}>
            <LunarLabel lunar={LEGEND_FULL_MOON} />
          </LegendItem>
        </>
      ) : null}
    </View>
  );
}

function LegendItem({ text, children }: { text: string; children: ReactNode }) {
  return (
    <View style={styles.legendItem}>
      <View style={styles.marker}>{children}</View>
      <OrtusText variant="footnote" color={c.textSecondary}>
        {text}
      </OrtusText>
    </View>
  );
}

const styles = StyleSheet.create({
  pager: { height: OrtusSizes.calendarCell * GRID_WEEKS },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: OrtusSpacing.md, rowGap: OrtusSpacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: OrtusSpacing.tight },
  marker: { alignItems: 'center', justifyContent: 'center' },
});
