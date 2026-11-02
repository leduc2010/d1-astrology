import { expectNear, vi, viBranch } from '../__testutils__/vietNames';
import { sunCrossing } from '../astro/sun';
import { birthMoment, luckStartYears, pillars, ZiHourMode } from '../bazi/bazi';
import { Branch, Stem } from '../ganzhi/ganzhi';
import { civilDate } from '../time/civilDate';
import { julianDate } from '../time/julianDay';
import { mod } from '../util';
import { Bureau, decadePalace, MainStar, MAIN_STARS, ziWeiChart, ziWeiInput, ziWeiPosition } from '../ziwei/ziwei';

function pillarsText(y: number, m: number, d: number, h: number, min: number, tz: number): string {
  const p = pillars(birthMoment(civilDate(y, m, d), h, min, tz));
  return [p.year, p.month, p.day, p.hour].map(vi).join(' ');
}

const decadeText = (chart: ReturnType<typeof ziWeiChart>, age: number) => {
  const p = decadePalace(chart, age);
  return p === null ? null : vi(p);
};

describe('Destiny', () => {
  test('four pillars match the spec vectors', () => {
    expect(pillarsText(2000, 1, 1, 12, 0, 8.0)).toBe('Kỷ Mão Bính Tý Mậu Ngọ Mậu Ngọ');
    expect(pillarsText(1893, 12, 26, 8, 0, 8.0)).toBe('Quý Tỵ Giáp Tý Đinh Dậu Giáp Thìn');
    expect(pillarsText(1940, 11, 27, 7, 12, -8.0)).toBe('Canh Thìn Đinh Hợi Giáp Tuất Mậu Thìn');
    expect(pillarsText(2024, 2, 4, 10, 0, 7.0)).toBe('Quý Mão Ất Sửu Mậu Tuất Đinh Tỵ');
    expect(pillarsText(2024, 2, 4, 18, 0, 7.0)).toBe('Giáp Thìn Bính Dần Mậu Tuất Tân Dậu');
    expect(pillarsText(1995, 5, 20, 6, 10, 7.0)).toBe('Ất Hợi Tân Tỵ Tân Hợi Tân Mão');
  });

  test('zi hour mode decides the day pillar at 23h30', () => {
    const moment = birthMoment(civilDate(1990, 8, 15), 23, 30, 7.0);
    expect(vi(pillars(moment, ZiHourMode.DAY_CHANGES_AT_23).day)).toBe('Quý Sửu');
    const split = pillars(moment, ZiHourMode.SPLIT_EARLY_LATE);
    expect(vi(split.day)).toBe('Nhâm Tý');
    // Late Zi takes the next day's hour stem: Quý day → Nhâm Tý hour.
    expect(vi(split.hour)).toBe('Nhâm Tý');
  });

  test('luck pillars start age by sex', () => {
    const moment = birthMoment(civilDate(1995, 5, 20), 6, 10, 7.0);
    expectNear(luckStartYears(moment, true), 4.66, 0.02);
    expectNear(luckStartYears(moment, false), 5.73, 0.02);
  });

  test('luck start counts the full gap to a distant term', () => {
    // Born the day after Lập hạ 1995 (≈ 6 May): a yin-year female runs forward ~30 days to Mang chủng.
    const moment = birthMoment(civilDate(1995, 5, 7), 12, 0, 7.0);
    expectNear(luckStartYears(moment, false), 10.0, 0.4);
    // A male in the same yin year runs backward one day to Lập hạ.
    expectNear(luckStartYears(moment, true), 0.3, 0.3);
  });

  test('birth moment rejects impossible utc offsets', () => {
    expect(() => birthMoment(civilDate(2000, 1, 1), 0, 0, -13.0)).toThrow(RangeError);
  });

  test('start of spring 2024 falls at 15h27 Vietnam time', () => {
    const jd = sunCrossing(315.0, julianDate(civilDate(2024, 2, 4), 0.0), true);
    const localHours = ((jd + 0.5 + 7.0 / 24) % 1) * 24;
    // Simplified Meeus is ~0.01° off (≈15 min), hence the wide tolerance.
    expectNear(localHours, 15.45, 0.25);
  });

  test('zi wei example 1', () => {
    const chart = ziWeiChart(ziWeiInput(Stem.GENG, 7, 17, Branch.YIN, false));
    expect(vi(chart.lifePalace)).toBe('Nhâm Ngọ');
    expect(viBranch(chart.bodyPalace)).toBe('Tuất');
    expect(chart.bureau).toBe(Bureau.WOOD_3);
    expect(viBranch(chart.mainStars.get(MainStar.ZI_WEI)!)).toBe('Ngọ');
    expect(decadeText(chart, 3)).toBe('Nhâm Ngọ');
    expect(decadeText(chart, 24)).toBe('Canh Thìn');
    expect(decadePalace(chart, 2)).toBeNull();
  });

  test('zi wei example 2 places all 14 main stars', () => {
    const chart = ziWeiChart(ziWeiInput(Stem.XIN, 1, 21, Branch.WU, false));
    expect(vi(chart.lifePalace)).toBe('Bính Thân');
    expect(viBranch(chart.bodyPalace)).toBe('Thân');
    expect(chart.bureau).toBe(Bureau.FIRE_6);
    const expected = [
      'Dần', 'Sửu', 'Hợi', 'Tuất', 'Dậu', 'Ngọ', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Tý',
    ];
    expect(MAIN_STARS.map((s) => viBranch(chart.mainStars.get(s)!))).toEqual(expected);
    expect(decadeText(chart, 35)).toBe('Mậu Tuất');
  });

  test('zi wei position for sample days', () => {
    const got = [
      ziWeiPosition(27, Bureau.WOOD_3),
      ziWeiPosition(13, Bureau.FIRE_6),
      ziWeiPosition(6, Bureau.EARTH_5),
      ziWeiPosition(17, Bureau.FIRE_6),
    ];
    expect(got.map(viBranch)).toEqual(['Tuất', 'Hợi', 'Mùi', 'Mão']);
  });

  test('zi wei and tian fu mirror across the Dan Than axis for every day and month', () => {
    for (let month = 1; month <= 12; month++) {
      for (let day = 1; day <= 30; day++) {
        const stars = ziWeiChart(ziWeiInput(Stem.JIA, month, day, Branch.ZI, true)).mainStars;
        const sum = stars.get(MainStar.ZI_WEI)! + stars.get(MainStar.TIAN_FU)!;
        if (mod(sum, 12) !== 4) throw new Error(`month ${month} day ${day}`);
      }
    }
  });
});
