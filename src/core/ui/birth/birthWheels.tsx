import { useMemo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { OrtusColors, OrtusText, OrtusWheelPicker, OrtusWheelRow } from '../../../designsystem';
import { useT } from '../../../i18n';
import type { BirthClock } from '../../model';
import { standaloneMonthNames } from '../dateText';
import type { UiText } from '../uiText';
import { CalendarMode, type DateInput } from './birthDates';

/* Wheels for entering a birth date and time, shared by onboarding and adding a partner. */

const MONTHS = 12;
const MONTH_WHEEL_WEIGHT = 1.6;
const LAST_HOUR = 23;
const LAST_MINUTE = 59;
const PADDED_DIGITS = 2;

/** `from`..`to` inclusive in the language's digits ("1", "2"…), `pad` to two digits for clocks. */
export function numberItems(from: number, to: number, language: string, pad = false): string[] {
  const format = new Intl.NumberFormat(language, {
    useGrouping: false,
    minimumIntegerDigits: pad ? PADDED_DIGITS : 1,
  });
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => format.format(from + i));
}

/** Month names for the solar wheel, or "Month 1"… for the lunar one. */
export function monthItems(t: UiText, mode: CalendarMode): string[] {
  if (mode === CalendarMode.Solar) return standaloneMonthNames(t.language);
  return numberItems(1, MONTHS, t.language).map((month) => t.tf('birth_lunar_month', month));
}

export type BirthDateWheelsProps = {
  date: DateInput;
  /** Years on the wheel, oldest first (`BirthDates.firstYear`..`lastYear`). */
  firstYear: number;
  lastYear: number;
  daysInMonth: number;
  onDayChange: (day: number) => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  style?: StyleProp<ViewStyle>;
};

/** Day, month and year wheels for [date]; the year span and month length come from `BirthDates`. */
export function BirthDateWheels({
  date,
  firstYear,
  lastYear,
  daysInMonth,
  onDayChange,
  onMonthChange,
  onYearChange,
  style,
}: BirthDateWheelsProps) {
  const t = useT();
  const days = useMemo(() => numberItems(1, daysInMonth, t.language), [daysInMonth, t.language]);
  const years = useMemo(() => numberItems(firstYear, lastYear, t.language), [firstYear, lastYear, t.language]);
  const months = useMemo(() => monthItems(t, date.mode), [t, date.mode]);
  return (
    <OrtusWheelRow style={style}>
      <OrtusWheelPicker
        items={days}
        selectedIndex={date.day - 1}
        onSelect={(i) => onDayChange(i + 1)}
        label={t.tf('birth_day')}
        style={styles.wheel}
      />
      <OrtusWheelPicker
        items={months}
        selectedIndex={date.month - 1}
        onSelect={(i) => onMonthChange(i + 1)}
        label={t.tf('birth_month')}
        style={styles.monthWheel}
      />
      <OrtusWheelPicker
        items={years}
        selectedIndex={date.year - firstYear}
        onSelect={(i) => onYearChange(firstYear + i)}
        label={t.tf('birth_year')}
        style={styles.wheel}
      />
    </OrtusWheelRow>
  );
}

export type BirthTimeWheelsProps = {
  clock: BirthClock;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  /** The onboarding size, where time is the whole step. */
  large?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Hour and minute wheels (24-hour). */
export function BirthTimeWheels({ clock, onHourChange, onMinuteChange, large = false, style }: BirthTimeWheelsProps) {
  const t = useT();
  const hours = useMemo(() => numberItems(0, LAST_HOUR, t.language, true), [t.language]);
  const minutes = useMemo(() => numberItems(0, LAST_MINUTE, t.language, true), [t.language]);
  return (
    <OrtusWheelRow style={style}>
      <OrtusWheelPicker
        items={hours}
        selectedIndex={clock.hour}
        onSelect={onHourChange}
        label={t.tf('birth_hour')}
        large={large}
        style={styles.wheel}
      />
      {/* Decorative separator: each wheel already announces its own name. */}
      <OrtusText
        variant={large ? 'wheelSelectedLarge' : 'wheelSelected'}
        color={OrtusColors.textMuted}
        importantForAccessibility="no"
        accessibilityElementsHidden
      >
        :
      </OrtusText>
      <OrtusWheelPicker
        items={minutes}
        selectedIndex={clock.minute}
        onSelect={onMinuteChange}
        label={t.tf('birth_minute')}
        large={large}
        style={styles.wheel}
      />
    </OrtusWheelRow>
  );
}

const styles = StyleSheet.create({
  wheel: { flex: 1 },
  monthWheel: { flex: MONTH_WHEEL_WEIGHT },
});
