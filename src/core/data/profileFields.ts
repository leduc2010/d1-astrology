import { birthClock, birthPlace, Gender, type BirthDate, type BirthProfile } from '../model';
import { readBoolean, readDouble, readInteger, readString, writeBoolean, writeDouble, writeInteger, writeString } from './storage/codec';
import type { MutablePrefs, Prefs } from './storage/preferencesFile';

const GENDERS: readonly Gender[] = [Gender.MALE, Gender.FEMALE];

/**
 * Preference keys for one birth profile. [prefix] lets several profiles share a store (the
 * owner's store uses none, matching the Kotlin file layout).
 */
export class ProfileFields {
  private readonly name: string;
  private readonly gender: string;
  private readonly year: string;
  private readonly month: string;
  private readonly day: string;
  private readonly hour: string;
  private readonly minute: string;
  private readonly placeName: string;
  private readonly placeRegion: string;
  private readonly latitude: string;
  private readonly longitude: string;
  private readonly zone: string;
  private readonly enteredAsLunar: string;
  private readonly all: readonly string[];

  constructor(prefix = '') {
    this.name = `${prefix}name`;
    this.gender = `${prefix}gender`;
    this.year = `${prefix}birth_year`;
    this.month = `${prefix}birth_month`;
    this.day = `${prefix}birth_day`;
    this.hour = `${prefix}birth_hour`;
    this.minute = `${prefix}birth_minute`;
    this.placeName = `${prefix}place_name`;
    this.placeRegion = `${prefix}place_region`;
    this.latitude = `${prefix}place_latitude`;
    this.longitude = `${prefix}place_longitude`;
    this.zone = `${prefix}place_zone`;
    this.enteredAsLunar = `${prefix}entered_as_lunar`;
    this.all = Object.freeze([
      this.name, this.gender, this.year, this.month, this.day, this.hour, this.minute,
      this.placeName, this.placeRegion, this.latitude, this.longitude, this.zone, this.enteredAsLunar,
    ]);
  }

  write(prefs: MutablePrefs, profile: BirthProfile): void {
    this.remove(prefs);
    writeString(prefs, this.name, profile.name);
    writeString(prefs, this.gender, profile.gender);
    writeInteger(prefs, this.year, profile.date.year);
    writeInteger(prefs, this.month, profile.date.month);
    writeInteger(prefs, this.day, profile.date.day);
    if (profile.clock) {
      writeInteger(prefs, this.hour, profile.clock.hour);
      writeInteger(prefs, this.minute, profile.clock.minute);
    }
    writeString(prefs, this.placeName, profile.place.name);
    writeString(prefs, this.placeRegion, profile.place.region);
    writeDouble(prefs, this.latitude, profile.place.latitude);
    writeDouble(prefs, this.longitude, profile.place.longitude);
    writeString(prefs, this.zone, profile.place.zoneId);
    writeBoolean(prefs, this.enteredAsLunar, profile.enteredAsLunar);
  }

  remove(prefs: MutablePrefs): void {
    for (const key of this.all) prefs.delete(key);
  }

  /** Null when any field is missing or out of range, so a half-written profile is never shown. */
  read(prefs: Prefs): BirthProfile | null {
    try {
      return this.readOrNull(prefs);
    } catch (error) {
      // The model factories reject out-of-range values with RangeError (Kotlin's require).
      if (error instanceof RangeError) return null;
      throw error;
    }
  }

  private readOrNull(prefs: Prefs): BirthProfile | null {
    const name = readString(prefs, this.name);
    const genderName = readString(prefs, this.gender);
    const gender = GENDERS.find((g) => g === genderName);
    const date = this.readDate(prefs);
    const placeName = readString(prefs, this.placeName);
    const region = readString(prefs, this.placeRegion);
    const latitude = readDouble(prefs, this.latitude);
    const longitude = readDouble(prefs, this.longitude);
    const zoneId = readString(prefs, this.zone);
    if (name === null || gender === undefined || date === null) return null;
    if (placeName === null || region === null || latitude === null || longitude === null || zoneId === null) return null;
    const hour = readInteger(prefs, this.hour);
    const minute = readInteger(prefs, this.minute);
    return Object.freeze({
      name,
      gender,
      date,
      clock: hour !== null && minute !== null ? birthClock(hour, minute) : null,
      place: birthPlace(placeName, region, latitude, longitude, zoneId),
      enteredAsLunar: readBoolean(prefs, this.enteredAsLunar) ?? false,
    });
  }

  // Like the Kotlin BirthDate, the stored date is not range-checked here.
  private readDate(prefs: Prefs): BirthDate | null {
    const year = readInteger(prefs, this.year);
    const month = readInteger(prefs, this.month);
    const day = readInteger(prefs, this.day);
    if (year === null || month === null || day === null) return null;
    return Object.freeze({ year, month, day });
  }
}
