import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { AdPlacement } from "@/core/model";
import {
  capitalized,
  datePattern,
  daySpiritText,
  festivalName,
  HoursSection,
  listText,
  lunarDateText,
  OrtusScreen,
  ReadingDisclaimer,
  Reveal,
  SampleNativeAd,
  useResumedOnly,
  visibleFestivals,
  weekdayText,
} from "@/core/ui";
import {
  OrtusCard,
  OrtusColors as c,
  OrtusIconButton,
  OrtusIcons,
  OrtusMotion,
  OrtusSpacing,
  OrtusTag,
  OrtusText,
  OrtusTopBar,
  TagTone,
  useReducedMotion,
} from "@/designsystem";
import { type CivilDate, isoDate } from "@/engine";
import { useT } from "@/i18n";
import { goBack } from "@/navigation/routes";
import type { DayUiState } from "./dayModel";
import { ClashCard, DayAdvice, DayFacts, PillarRow } from "./DaySections";
import { useDayModel } from "./useDayModel";

/** One day in full, opened from Today or the calendar; [start] null opens today. */
export function DayScreen({ start }: { start: CivilDate | null }) {
  const { state, onShift } = useDayModel(start);
  const back = useResumedOnly(goBack);
  return <DayContent state={state} onShift={onShift} onBack={back} />;
}

export type DayContentProps = {
  state: DayUiState;
  onShift: (days: number) => void;
  onBack: () => void;
};

export function DayContent({ state, onShift, onBack }: DayContentProps) {
  const t = useT();
  return (
    <OrtusScreen
      header={
        <OrtusTopBar
          title={weekdayText(state.day.date, t.language)}
          onBack={onBack}
          backAccessibilityLabel={t.tf("day_back")}
        />
      }
    >
      <Reveal index={0}>
        <DayHero state={state} onShift={onShift} />
      </Reveal>
      <Reveal index={1}>
        <PillarRow state={state} />
      </Reveal>
      <Reveal index={2}>
        <OrtusCard>
          <HoursSection
            auspicious={state.day.auspiciousHours}
            now={state.nowHour}
          />
        </OrtusCard>
      </Reveal>
      <Reveal index={3}>
        <SampleNativeAd placement={AdPlacement.DAY_NATIVE} />
      </Reveal>
      <Reveal index={4}>
        <DayFacts state={state} />
      </Reveal>
      <Reveal index={5}>
        <DayAdvice day={state.day} />
      </Reveal>
      <Reveal index={6}>
        <ClashCard day={state.day} />
      </Reveal>
      <Reveal index={7}>
        <ReadingDisclaimer />
      </Reveal>
    </OrtusScreen>
  );
}

/** Big solar date between day arrows, then the lunar date and the day spirit; fades in on each step. */
function DayHero({
  state,
  onShift,
  style,
}: {
  state: DayUiState;
  onShift: (days: number) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useT();
  const reduced = useReducedMotion();
  const entering = reduced
    ? undefined
    : FadeIn.duration(OrtusMotion.STANDARD).easing(OrtusMotion.settle);
  const key = isoDate(state.day.date);
  return (
    <View style={[styles.hero, style]}>
      {/* Arrows sit level with the numeral, not with the whole block. */}
      <View style={styles.numberRow}>
        <OrtusIconButton
          icon={OrtusIcons.Back}
          accessibilityLabel={t.tf("day_previous")}
          onPress={() => onShift(-1)}
          tint={c.textSecondary}
          enabled={state.hasPrevious}
        />
        <Animated.View key={`n-${key}`} entering={entering}>
          <OrtusText variant="dayHero" color={c.accentLight}>
            {String(state.day.date.day)}
          </OrtusText>
        </Animated.View>
        <OrtusIconButton
          icon={OrtusIcons.ChevronRight}
          accessibilityLabel={t.tf("day_next")}
          onPress={() => onShift(1)}
          tint={c.textSecondary}
          enabled={state.hasNext}
        />
      </View>
      <Animated.View
        key={`t-${key}`}
        entering={entering}
        style={styles.heroText}
      >
        <HeroText state={state} />
      </Animated.View>
    </View>
  );
}

function HeroText({ state }: { state: DayUiState }) {
  const t = useT();
  const day = state.day;
  const festivals = visibleFestivals(day.festivals, t.language);
  return (
    <>
      <OrtusText variant="caption" color={c.textSecondary}>
        {capitalized(
          datePattern(t, "date_month_year_pattern", day.date),
          t.language,
        )}
      </OrtusText>
      <OrtusText variant="h2" color={c.textPrimary} style={styles.center}>
        {lunarDateText(t, day.lunar)}
      </OrtusText>
      <OrtusTag
        text={daySpiritText(t, day.daySpirit)}
        tone={day.isAuspiciousDay ? TagTone.Auspicious : TagTone.Inauspicious}
        style={styles.tag}
      />
      {festivals.length > 0 ? (
        <OrtusText
          variant="captionStrong"
          color={c.accent}
          style={styles.center}
        >
          {listText(
            t,
            festivals.map((f) => festivalName(t, f)),
          )}
        </OrtusText>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center" },
  numberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: OrtusSpacing.lg,
  },
  heroText: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: OrtusSpacing.xs,
  },
  center: { textAlign: "center" },
  tag: { alignSelf: "center" },
});
