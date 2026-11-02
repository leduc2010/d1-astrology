import { birthClock, type BirthDate, type BirthPlace } from '../../model';
import { BirthZones } from '../place/birthZones';
import { PlaceCatalog } from '../place/placeCatalog';

// Port of PlacesTest.
const first = (query: string): BirthPlace => {
  const place = PlaceCatalog.search(query)[0];
  if (!place) throw new Error(`nothing found for ${query}`);
  return place;
};

const date = (year: number, month: number, day: number): BirthDate => ({ year, month, day });

describe('Places', () => {
  test('search ignores case and Vietnamese diacritics', () => {
    expect(first('ha dong').name).toBe('Hà Đông');
    expect(first('ĐÀ LẠT').name).toBe('Đà Lạt');
    expect(first('ho chi minh').name).toBe('Sài Gòn');
  });

  test('name prefix matches rank before region matches', () => {
    const names = PlaceCatalog.search('ha').map((it) => it.name);
    expect(names[0]!.startsWith('H')).toBe(true);
    expect(names.length).toBeLessThanOrEqual(6);
  });

  test('blank query finds nothing', () => {
    expect(PlaceCatalog.search('   ')).toEqual([]);
  });

  test('typed coordinates in vietnam get its zone but hainan does not', () => {
    expect(BirthZones.zoneForCoordinates(21.03, 105.85)).toBe(BirthZones.VIETNAM);
    expect(BirthZones.zoneForCoordinates(10.82, 106.63)).toBe(BirthZones.VIETNAM);
    expect(BirthZones.zoneForCoordinates(20.04, 110.32)).toBe('+07:00');
    expect(BirthZones.zoneForCoordinates(22.82, 108.32)).toBe('+07:00');
  });

  test('catalog coordinates and zones are valid', () => {
    for (const place of PlaceCatalog.places) {
      const offset = BirthZones.utcOffsetMinutes(place.zoneId, place.latitude, place.longitude, date(2000, 6, 1), null);
      expect({ place: place.name, inRange: offset >= -12 * 60 && offset <= 14 * 60 }).toEqual({
        place: place.name,
        inRange: true,
      });
    }
  });

  test('vietnam offsets follow north and south history', () => {
    const saigon = first('sai gon');
    const hanoi = first('ha noi');
    const d = date(1968, 2, 1);
    expect(BirthZones.utcOffsetMinutes(saigon.zoneId, saigon.latitude, saigon.longitude, d, null)).toBe(8 * 60);
    expect(BirthZones.utcOffsetMinutes(hanoi.zoneId, hanoi.latitude, hanoi.longitude, d, null)).toBe(7 * 60);
  });

  test('world zones apply daylight saving at the birth time', () => {
    const ny = first('new york');
    const at = (d: BirthDate) => BirthZones.utcOffsetMinutes(ny.zoneId, ny.latitude, ny.longitude, d, birthClock(9, 0));
    expect(at(date(1990, 7, 4))).toBe(-4 * 60);
    expect(at(date(1990, 1, 4))).toBe(-5 * 60);
  });

  test('typed coordinates get a zone', () => {
    expect(BirthZones.zoneForCoordinates(16.0, 108.0)).toBe(BirthZones.VIETNAM);
    expect(BirthZones.zoneForCoordinates(35.0, 135.0)).toBe('+09:00');
    expect(BirthZones.utcOffsetMinutes('-05:00', 40.0, -75.0, date(2000, 1, 1), null)).toBe(-5 * 60);
    // A corrupt zone id falls back to the meridian offset instead of crashing.
    expect(BirthZones.utcOffsetMinutes('Not/AZone', 13.0, 104.0, date(2000, 1, 1), null)).toBe(7 * 60);
  });
});
