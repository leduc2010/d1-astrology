import { standaloneMonthNames } from "@/core/ui";
import type { CalendarMonth } from "./calendarMonth";

/** "November" / "Tháng 11" (Kotlin `DateText.kt`; the other date helpers live in core/ui). */
export const monthTitle = (month: CalendarMonth, language: string): string =>
  standaloneMonthNames(language)[month.month - 1] ?? "";
