import { Branch, branchClash, branchPlus, Stem } from '../ganzhi/ganzhi';
import { TenGod } from '../ganzhi/tenGod';
import { HoangOc, hoangOcOf, KimLau, kimLauOf, NineStar, nineStarOf } from '../yearly/folkYear';
import { TaiSuiBond, taiSui, tamTaiYear, yearOutlook } from '../yearly/yearOutlook';
import { Brightness, brightnessIn } from '../ziwei/brightness';
import { MainStar } from '../ziwei/ziwei';

const trineMates = (b: Branch) => [b, branchPlus(b, 4), branchPlus(b, 8)];

describe('YearOutlook', () => {
  test("tam tai runs three years from the clash of the trine's growth branch", () => {
    const runs: [Branch, Branch[]][] = [
      [Branch.ZI, [Branch.YIN, Branch.MAO, Branch.CHEN]],
      [Branch.WU, [Branch.SHEN, Branch.YOU, Branch.XU]],
      [Branch.MAO, [Branch.SI, Branch.WU, Branch.WEI]],
      [Branch.YOU, [Branch.HAI, Branch.ZI, Branch.CHOU]],
    ];
    for (const [birth, years] of runs) {
      for (const mate of trineMates(birth)) {
        years.forEach((year, i) => expect(tamTaiYear(mate, year)).toBe(i + 1));
      }
      expect(tamTaiYear(birth, branchPlus(branchClash(birth), 4))).toBeNull();
    }
  });

  test('tai sui names same, clash, punishment and harm', () => {
    expect(taiSui(Branch.WU, Branch.WU)).toBe(TaiSuiBond.SAME);
    expect(taiSui(Branch.ZI, Branch.WU)).toBe(TaiSuiBond.CLASH);
    expect(taiSui(Branch.MAO, Branch.ZI)).toBe(TaiSuiBond.PUNISHMENT);
    expect(taiSui(Branch.YIN, Branch.SI)).toBe(TaiSuiBond.PUNISHMENT);
    expect(taiSui(Branch.CHOU, Branch.WU)).toBe(TaiSuiBond.HARM);
    expect(taiSui(Branch.YIN, Branch.WU)).toBe(TaiSuiBond.NONE);
  });

  test('2026 is Binh Ngo, read for someone born in 1990', () => {
    const outlook = yearOutlook(2026, 1990, true, Stem.JIA, null);
    expect(outlook.pillar.stem).toBe(Stem.BING);
    expect(outlook.pillar.branch).toBe(Branch.WU);
    expect(outlook.folkAge).toBe(37);
    // 1990 is Canh Ngọ: its own year comes round again.
    expect(outlook.taiSui).toBe(TaiSuiBond.SAME);
    expect(outlook.theme).toBe(TenGod.EATING_GOD);
    expect(outlook.nineStar).toBe(NineStar.LA_HAU);
    expect(outlook.kimLau).toBe(KimLau.SELF);
    expect(outlook.hoangOc).toBe(HoangOc.TU_TAN_TAI);
  });

  test('wedding and building customs are left out before adulthood', () => {
    // Folk age 10 would be Kim Lâu (remainder 1) and Hoang Ốc Nhất Cát for an adult.
    const child = yearOutlook(2026, 2017, false, null, null);
    expect(child.folkAge).toBe(10);
    expect(child.customsApply).toBe(false);
    expect(child.kimLau).toBeNull();
    expect(child.hoangOc).toBeNull();
    expect(yearOutlook(2026, 2009, false, null, null).customsApply).toBe(true);
  });

  test('tai sui also names the six breaks', () => {
    expect(taiSui(Branch.MAO, Branch.WU)).toBe(TaiSuiBond.BREAK);
    expect(taiSui(Branch.HAI, Branch.YIN)).toBe(TaiSuiBond.BREAK);
  });

  test('nine stars match the published 2026 table', () => {
    // Born 1972 (folk age 55) and 1985 (folk age 42).
    expect(nineStarOf(55, true)).toBe(NineStar.LA_HAU);
    expect(nineStarOf(55, false)).toBe(NineStar.KE_DO);
    expect(nineStarOf(42, true)).toBe(NineStar.VAN_HON);
    expect(nineStarOf(42, false)).toBe(NineStar.LA_HAU);
    expect(nineStarOf(18, true)).toBe(NineStar.MOC_DUC);
  });

  test('kim lau falls on remainders one three six and eight', () => {
    expect(kimLauOf(37)).toBe(KimLau.SELF);
    expect(kimLauOf(33)).toBe(KimLau.CHILDREN);
    expect(kimLauOf(26)).toBe(KimLau.LIVESTOCK);
    expect(kimLauOf(30)).toBe(KimLau.SPOUSE);
    expect(kimLauOf(32)).toBeNull();
  });

  test('hoang oc counts decades then years', () => {
    const expected: [number, HoangOc][] = [
      [25, HoangOc.NHAT_CAT], [37, HoangOc.TU_TAN_TAI], [44, HoangOc.NHI_NGHI], [52, HoangOc.NHAT_CAT],
      [61, HoangOc.NHAT_CAT], [21, HoangOc.TAM_DIA_SAT], [35, HoangOc.NHI_NGHI], [47, HoangOc.NGU_THO_TU],
      [60, HoangOc.LUC_HOANG_OC], [10, HoangOc.NHAT_CAT], [70, HoangOc.NHAT_CAT],
    ];
    for (const [age, palace] of expected) expect([age, hoangOcOf(age)]).toEqual([age, palace]);
    expect(hoangOcOf(9)).toBeNull();
  });

  test('main star brightness follows the table', () => {
    for (const b of [Branch.YIN, Branch.SI, Branch.WU, Branch.SHEN]) {
      expect(brightnessIn(MainStar.ZI_WEI, b)).toBe(Brightness.TEMPLE);
    }
    expect(brightnessIn(MainStar.TAI_YANG, Branch.ZI)).toBe(Brightness.DIM);
    expect(brightnessIn(MainStar.TAI_YIN, Branch.HAI)).toBe(Brightness.TEMPLE);
    expect(brightnessIn(MainStar.PO_JUN, Branch.CHOU)).toBe(Brightness.PROSPEROUS);
    expect(brightnessIn(MainStar.TIAN_FU, Branch.CHOU)).toBe(Brightness.NEUTRAL);
  });
});
