import { fixedOffsetZone, searchPlaces } from '@/core/data';
import { birthPlace } from '@/core/model';
import { MAX_LATITUDE, MAX_LONGITUDE, parseCoordinate, parseUtcOffset, typedOffsetText } from '../coordinates';

describe('parseCoordinate', () => {
  test('accepts a dot or a comma', () => {
    expect(parseCoordinate('20.97', MAX_LATITUDE)).toBe(20.97);
    expect(parseCoordinate(' -33,87 ', MAX_LATITUDE)).toBe(-33.87);
  });

  test('rejects text and values out of range', () => {
    expect(parseCoordinate('north', MAX_LATITUDE)).toBeNull();
    expect(parseCoordinate('91', MAX_LATITUDE)).toBeNull();
    expect(parseCoordinate('NaN', MAX_LONGITUDE)).toBeNull();
  });

  test('reads utc offsets in hours or hours and minutes', () => {
    expect(parseUtcOffset('+7')).toBe(420);
    expect(parseUtcOffset('7')).toBe(420);
    expect(parseUtcOffset('−3')).toBe(-180);
    expect(parseUtcOffset('UTC+05:30')).toBe(330);
    expect(parseUtcOffset(' -9:30 ')).toBe(-570);
    expect(parseUtcOffset('+14')).toBe(840);
  });

  test('rejects blank, odd minutes and out of range offsets', () => {
    expect(parseUtcOffset('')).toBeNull();
    expect(parseUtcOffset('+5:20')).toBeNull();
    expect(parseUtcOffset('+15')).toBeNull();
    expect(parseUtcOffset('-13')).toBeNull();
    expect(parseUtcOffset('seven')).toBeNull();
  });

  test('reopening the sheet shows only an offset the user typed', () => {
    const kashgar = birthPlace('39.47°N, 75.99°E', '', 39.47, 75.99, fixedOffsetZone(8 * 60));
    expect(typedOffsetText(kashgar)).toBe('+08:00');
    expect(typedOffsetText({ ...kashgar, zoneId: fixedOffsetZone(-210) })).toBe('-03:30');
    expect(typedOffsetText({ ...kashgar, longitude: 120 })).toBe(''); // +8 is just the guess at 120°E
    expect(typedOffsetText(searchPlaces('Hà Nội')[0])).toBe('');
    expect(typedOffsetText(null)).toBe('');
  });
});
