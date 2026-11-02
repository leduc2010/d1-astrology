import { IconBox, OrtusIcons, type OrtusTypeVariant } from "@/designsystem";
import { WeekStart } from "@/core/model";
import {
  capitalized,
  patternDateText,
  solarDateText,
  stemBranchName,
  YearSeal,
  zodiacSignName,
  type UiText,
} from "@/core/ui";
import type { CivilDate } from "@/engine";
import type { PersonSummary } from "./personSummary";

export type PersonSealProps = {
  person: PersonSummary;
  size: number;
  variant?: OrtusTypeVariant;
};

/** The person's year seal, or a plain person icon when their date is outside the calendar range. */
export function PersonSeal({ person, size, variant = "han" }: PersonSealProps) {
  const year = person.lunarYear;
  if (year === null)
    return (
      <IconBox icon={OrtusIcons.Me} style={{ width: size, height: size }} />
    );
  return <YearSeal branch={year.branch} size={size} variant={variant} />;
}

const DETAIL_SEPARATOR = " · ";

/** "15 Aug 1995 · Yi Hai · Leo", dropping the parts a date out of range can't give. */
export function personDetail(t: UiText, person: PersonSummary): string {
  const parts = [solarDateText(person.birthDate, t.language, "medium")];
  if (person.lunarYear !== null)
    parts.push(stemBranchName(t, person.lunarYear));
  if (person.sunLongitude !== null)
    parts.push(zodiacSignName(t, person.sunLongitude));
  return parts.join(DETAIL_SEPARATOR);
}

/** A known Monday and Sunday, only to name the weekday in the app's language. */
const SAMPLE_DAY: Readonly<Record<WeekStart, CivilDate>> = Object.freeze({
  [WeekStart.MONDAY]: Object.freeze({ year: 2001, month: 1, day: 1 }),
  [WeekStart.SUNDAY]: Object.freeze({ year: 2000, month: 12, day: 31 }),
});

/** "Monday" / "Thứ Hai", in the app's language. */
export function weekStartName(language: string, weekStart: WeekStart): string {
  return capitalized(
    patternDateText(SAMPLE_DAY[weekStart], "EEEE", language),
    language,
  );
}
