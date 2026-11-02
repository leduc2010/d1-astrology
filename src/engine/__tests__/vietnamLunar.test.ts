import { CHINA_OFFSET, lunarDate, VIETNAM_OFFSET } from '../lunar/lunarCalendar';
import { vietnamOffsetFor, vietnamToLunar, vietnamToSolar } from '../lunar/vietnamLunar';
import { civilDate } from '../time/civilDate';
import { dayNumber, plusDays } from '../time/julianDay';

describe('VietnamLunar', () => {
  test('calendar follows Beijing time before 1968 and in the South until 1976', () => {
    expect(vietnamOffsetFor(civilDate(1967, 12, 31))).toBe(CHINA_OFFSET);
    expect(vietnamOffsetFor(civilDate(1968, 1, 1))).toBe(VIETNAM_OFFSET);
    expect(vietnamOffsetFor(civilDate(1975, 12, 31), true)).toBe(CHINA_OFFSET);
    expect(vietnamOffsetFor(civilDate(1976, 1, 1), true)).toBe(VIETNAM_OFFSET);
  });

  test('Tet Mau Than fell a day apart in Ha Noi and Sai Gon', () => {
    const tetNorth = civilDate(1968, 1, 29);
    expect(vietnamToLunar(tetNorth)).toEqual(lunarDate(1968, 1, 1));
    expect(vietnamToLunar(tetNorth, true)).toEqual(lunarDate(1967, 12, 30));
    expect(vietnamToLunar(civilDate(1968, 1, 30), true)).toEqual(lunarDate(1968, 1, 1));
    expect(vietnamToSolar(lunarDate(1968, 1, 1))).toEqual(tetNorth);
    expect(vietnamToSolar(lunarDate(1968, 1, 1), true)).toEqual(civilDate(1968, 1, 30));
  });

  test('solar and lunar round trip in the calendar of the time', () => {
    for (const south of [false, true]) {
      let date = civilDate(1960, 1, 1);
      while (date.year < 1980) {
        const back = vietnamToSolar(vietnamToLunar(date, south), south);
        if (back === null || dayNumber(back) !== dayNumber(date)) throw new Error(`${JSON.stringify(date)} south=${south}`);
        date = plusDays(date, 1);
      }
    }
  });
});
