import { BirthZones } from '../place/birthZones';
import { offsetId, offsetSecondsAt, parseOffsetSeconds, ZoneError } from '../place/zoneOffset';

const at = (year: number, month: number, day: number, hour: number, minute: number) => ({
  year,
  month,
  day,
  hour,
  minute,
  second: 0,
});

describe('zone offsets', () => {
  test('offset text parses like ZoneOffset.of', () => {
    expect(parseOffsetSeconds('Z')).toBe(0);
    expect(parseOffsetSeconds('+7')).toBe(7 * 3_600);
    expect(parseOffsetSeconds('-05:00')).toBe(-5 * 3_600);
    expect(parseOffsetSeconds('+0530')).toBe(5 * 3_600 + 30 * 60);
    expect(parseOffsetSeconds('+05:30:15')).toBe(5 * 3_600 + 30 * 60 + 15);
    expect(() => parseOffsetSeconds('+19:00')).toThrow(ZoneError);
    expect(() => parseOffsetSeconds('+05:60')).toThrow(ZoneError);
    expect(() => parseOffsetSeconds('07:00')).toThrow(ZoneError);
  });

  test('offset ids are written like ZoneOffset ids', () => {
    expect(offsetId(0)).toBe('Z');
    expect(offsetId(8 * 3_600)).toBe('+08:00');
    expect(offsetId(-(3 * 3_600 + 30 * 60))).toBe('-03:30');
    expect(offsetId(3_661)).toBe('+01:01:01');
    expect(() => offsetId(19 * 3_600)).toThrow(ZoneError);
  });

  test('UTC and GMT prefixes resolve to fixed offsets', () => {
    const noon = at(2000, 1, 1, 12, 0);
    expect(offsetSecondsAt('UTC', noon)).toBe(0);
    expect(offsetSecondsAt('GMT+7', noon)).toBe(7 * 3_600);
    expect(offsetSecondsAt('UT-03:30', noon)).toBe(-(3 * 3_600 + 30 * 60));
    expect(() => offsetSecondsAt('Not a zone!', noon)).toThrow(ZoneError);
  });

  test('a gap takes the offset before it and an overlap the earlier one', () => {
    // New York clocks skipped 02:00-03:00 on 2021-03-14 and repeated 01:00-02:00 on 2021-11-07.
    expect(offsetSecondsAt('America/New_York', at(2021, 3, 14, 2, 30))).toBe(-5 * 3_600);
    expect(offsetSecondsAt('America/New_York', at(2021, 11, 7, 1, 30))).toBe(-4 * 3_600);
  });

  test('fixed zones for typed places', () => {
    expect(BirthZones.fixedOffsetZone(0)).toBe('Z');
    expect(BirthZones.fixedOffsetZone(-150)).toBe('-02:30');
    expect(() => BirthZones.fixedOffsetZone(19 * 60)).toThrow(RangeError);
  });
});
