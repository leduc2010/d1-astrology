import { natalChart, zodiacPosition, type NatalChart } from '../../../engine/astro/natal';
import { Planet, planetLongitude } from '../../../engine/astro/planets';
import { sunApparentLongitude } from '../../../engine/astro/sun';
import {
  birthMoment,
  dayPillar,
  hourBranch as branchOfHour,
  hourStem,
  luckStartYears,
  pillars as fourPillars,
  type BirthMoment,
} from '../../../engine/bazi/bazi';
import { strengthOf, type DayMasterStrength } from '../../../engine/bazi/strength';
import { stemBranch, type Branch, type StemBranch } from '../../../engine/ganzhi/ganzhi';
import { yearPillar, type LunarDate } from '../../../engine/lunar/lunarCalendar';
import { vietnamToLunar } from '../../../engine/lunar/vietnamLunar';
import { civilDate, type CivilDate } from '../../../engine/time/civilDate';
import { dayNumber, julianDate, toCivil } from '../../../engine/time/julianDay';
import { trueSolarMinutes } from '../../../engine/time/solarTime';
import { mod } from '../../../engine/util';
import { ziWeiChart, ziWeiInput, type ZiWeiChart } from '../../../engine/ziwei/ziwei';
import { Gender, minutesOfDay, type BirthProfile } from '../../model';
import { isSouthVietnam, utcOffsetMinutes } from '../place/birthZones';

const NOON = 12;
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * 60;
const SIGNS = 12;
/** The Tý hour starts one hour before midnight. */
const ZI_HOUR_LEAD = 60;

/** Bát Tự pillars; [hour] is null when the birth time is unknown (a three-pillar chart). */
export interface BirthPillars {
  readonly year: StemBranch;
  readonly month: StemBranch;
  readonly day: StemBranch;
  readonly hour: StemBranch | null;
}

/**
 * A birth profile with everything the charts need worked out once: the civil UTC offset in force
 * at the place and date, the lunar date and the true solar time that decides the Chinese hour.
 * The charts are pure functions of these fields, so each is computed on first use and kept.
 */
export class ResolvedBirth {
  private readonly cache = new Map<string, unknown>();

  constructor(
    readonly profile: BirthProfile,
    readonly solarDate: CivilDate,
    readonly lunarDate: LunarDate,
    readonly utcOffsetMinutes: number,
    /** Minutes after midnight by the Sun at the birth place; null when the birth time is unknown. */
    readonly trueSolarMinutes: number | null,
  ) {
    Object.freeze(this);
  }

  private cached<T>(key: string, compute: () => T): T {
    if (!this.cache.has(key)) this.cache.set(key, compute());
    return this.cache.get(key) as T;
  }

  private get isMale(): boolean {
    return this.profile.gender === Gender.MALE;
  }

  /** The Chinese double hour by true solar time; null when the birth time is unknown. */
  get hourBranch(): Branch | null {
    const tsm = this.trueSolarMinutes;
    return tsm === null ? null : branchOfHour(Math.trunc(mod(tsm, MINUTES_PER_DAY) / MINUTES_PER_HOUR));
  }

  get lunarYearPillar(): StemBranch {
    return yearPillar(this.lunarDate.year);
  }

  /**
   * Days from the civil date to the chart day. The chart day turns at 23:00 true solar time (the
   * start of the Tý hour), so a late-evening clock reading can belong to the next day, and an
   * early one at a place far west of its zone meridian to the same day it shows. Zero without a time.
   */
  get chartDayShift(): number {
    const tsm = this.trueSolarMinutes;
    return tsm === null ? 0 : Math.floor((tsm + ZI_HOUR_LEAD) / MINUTES_PER_DAY);
  }

  /** The solar date the day pillar and the Tử Vi chart are counted from. */
  get chartDate(): CivilDate {
    return toCivil(dayNumber(this.solarDate) + this.chartDayShift);
  }

  /** Lunar date of [chartDate]: a birth after 23:00 on lunar New Year's Eve counts in the new year. */
  get chartLunarDate(): LunarDate {
    return this.chartDayShift === 0 ? this.lunarDate : vietnamToLunar(this.chartDate, isSouthVietnam(this.profile.place));
  }

  /**
   * Year and month pillars from the civil moment (solar terms depend on the real instant); day
   * and hour pillars from true solar time, so both agree on when the day turns.
   */
  pillars(): BirthPillars {
    return this.cached('pillars', () => {
      const civil = fourPillars(this.moment());
      const day = dayPillar(dayNumber(this.chartDate));
      const hb = this.hourBranch;
      const hour = hb === null ? null : stemBranch(hourStem(day.stem, hb), hb);
      return Object.freeze({ year: civil.year, month: civil.month, day, hour });
    });
  }

  /**
   * Tử Vi chart, or null when the birth time is unknown (the hour places the Life palace).
   * Counted from the lunar date of [chartDate]; a leap month counts as the month it repeats.
   */
  ziWei(): ZiWeiChart | null {
    return this.cached('ziWei', () => {
      const hour = this.hourBranch;
      if (hour === null) return null;
      const lunar = this.chartLunarDate;
      return ziWeiChart(ziWeiInput(yearPillar(lunar.year).stem, lunar.month, lunar.day, hour, this.isMale));
    });
  }

  /** The civil birth instant (noon when the time is unknown) as the Bát Tự engine takes it. */
  moment(): BirthMoment {
    const clock = this.profile.clock;
    return birthMoment(this.solarDate, clock?.hour ?? NOON, clock?.minute ?? 0, this.utcOffsetMinutes / MINUTES_PER_HOUR);
  }

  /** Years from birth to the first 10-year luck pillar (Đại vận). */
  luckStartYears(): number {
    return this.cached('luck', () => luckStartYears(this.moment(), this.isMale));
  }

  /**
   * Western natal chart. Houses and the ascendant need the birth time, so without one the
   * planets are placed for noon and the angles are left out.
   */
  natal(): NatalChart {
    return this.cached('natal', () => {
      const { latitude, longitude } = this.profile.place;
      return natalChart(this.birthJulianDate(), this.profile.clock ? { latitude, longitude } : null);
    });
  }

  /**
   * Signs (0 Aries … 11 Pisces) the Moon can be in. With a birth time that is one sign; without
   * one, every sign it passes through over the local birth day, in order (one or two).
   */
  moonSigns(): number[] {
    const signs = this.cached('moonSigns', (): readonly number[] => {
      if (this.profile.clock) {
        const moon = this.natal().planets.get(Planet.MOON);
        if (!moon) throw new Error('natal chart has no Moon');
        return Object.freeze([moon.sign]);
      }
      const first = this.moonSignAt(0);
      const last = this.moonSignAt(MINUTES_PER_DAY - 1);
      const count = mod(last - first, SIGNS) + 1;
      return Object.freeze(Array.from({ length: count }, (_, i) => (first + i) % SIGNS));
    });
    return [...signs];
  }

  /** Apparent ecliptic longitude of the Sun at birth in degrees (noon when the time is unknown). */
  sunLongitude(): number {
    return sunApparentLongitude(this.birthJulianDate());
  }

  private moonSignAt(clockMinutes: number): number {
    const hourUt = (clockMinutes - this.utcOffsetMinutes) / MINUTES_PER_HOUR;
    return zodiacPosition(planetLongitude(Planet.MOON, julianDate(this.solarDate, hourUt))).sign;
  }

  private birthJulianDate(): number {
    const clock = this.profile.clock;
    const clockMinutes = clock ? minutesOfDay(clock) : NOON * MINUTES_PER_HOUR;
    return julianDate(this.solarDate, (clockMinutes - this.utcOffsetMinutes) / MINUTES_PER_HOUR);
  }
}

/** Works out the zone offset, lunar date and true solar time of [profile]. Throws on an impossible date. */
export function resolveBirth(profile: BirthProfile): ResolvedBirth {
  const { date, clock, place } = profile;
  const solar = civilDate(date.year, date.month, date.day);
  const offset = utcOffsetMinutes(place.zoneId, place.latitude, place.longitude, date, clock);
  return new ResolvedBirth(
    profile,
    solar,
    vietnamToLunar(solar, isSouthVietnam(place)),
    offset,
    clock ? trueSolarMinutes(solar, minutesOfDay(clock), offset, place.longitude) : null,
  );
}

/** How strong the day master stands over these pillars, and the elements that balance it. */
export function pillarsStrength(p: BirthPillars): DayMasterStrength {
  return strengthOf(p.year, p.month, p.day, p.hour);
}

export const birthStrength = (birth: ResolvedBirth): DayMasterStrength => pillarsStrength(birth.pillars());
