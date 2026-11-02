import { resolveBirth } from "@/core/data";
import type { BirthProfile } from "@/core/model";
import type { CivilDate, StemBranch } from "@/engine";

/**
 * What the Me pages show of one person. [lunarYear] and [sunLongitude] are null when the birth
 * date is outside the supported calendar range.
 */
export interface PersonSummary {
  readonly name: string;
  readonly birthDate: CivilDate;
  readonly hasBirthTime: boolean;
  readonly lunarYear: StemBranch | null;
  readonly sunLongitude: number | null;
}

type Resolved = { lunarYear: StemBranch; sunLongitude: number };

/** The lunar year and the Sun's longitude, or null when the date can't be resolved. */
function resolved(profile: BirthProfile): Resolved | null {
  try {
    const birth = resolveBirth(profile);
    return {
      lunarYear: birth.lunarYearPillar,
      sunLongitude: birth.sunLongitude(),
    };
  } catch {
    // Outside the calendar range: the person still shows, without year or sign.
    return null;
  }
}

export function personSummary(profile: BirthProfile): PersonSummary {
  const birth = resolved(profile);
  const { year, month, day } = profile.date;
  return Object.freeze({
    name: profile.name,
    birthDate: Object.freeze({ year, month, day }),
    hasBirthTime: profile.clock !== null,
    lunarYear: birth?.lunarYear ?? null,
    sunLongitude: birth?.sunLongitude ?? null,
  });
}
