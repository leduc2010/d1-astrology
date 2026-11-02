import { vi, viBranch } from '../__testutils__/vietNames';
import { elementBalance, hiddenStems, LifeStage, lifeStageOf, luckPillars, luckRunsForward } from '../bazi/baziDetails';
import {
  Branch,
  BRANCHES,
  branchElement,
  cycleIndex,
  Element,
  napAm,
  naYinIndex,
  Stem,
  stemBranch,
  stemBranchPlus,
  stemElement,
  STEMS,
} from '../ganzhi/ganzhi';
import {
  branchOfRole,
  cutBranches,
  decadeStartAge,
  MainStar,
  mainStarRef,
  mainStarsIn,
  MinorStar,
  PalaceRole,
  roleOf,
  Transformation,
  transformations,
  trine,
  voidBranches,
  ziWeiChart,
  ziWeiInput,
} from '../ziwei/ziwei';

const pair = stemBranch;

describe('ChartDetails', () => {
  test('hidden stems put the main qi first', () => {
    expect(hiddenStems(Branch.YIN)).toEqual([Stem.JIA, Stem.BING, Stem.WU]);
    expect(hiddenStems(Branch.ZI)).toEqual([Stem.GUI]);
    expect(hiddenStems(Branch.XU)).toEqual([Stem.WU, Stem.XIN, Stem.DING]);
    expect(BRANCHES.every((b) => stemElement(hiddenStems(b)[0]!) === branchElement(b))).toBe(true);
  });

  test('life stages walk forward for yang stems and backward for yin', () => {
    expect(lifeStageOf(Stem.JIA, Branch.HAI)).toBe(LifeStage.BIRTH);
    expect(lifeStageOf(Stem.JIA, Branch.MAO)).toBe(LifeStage.PEAK);
    expect(lifeStageOf(Stem.YI, Branch.WU)).toBe(LifeStage.BIRTH);
    expect(lifeStageOf(Stem.YI, Branch.YIN)).toBe(LifeStage.PEAK);
    expect(lifeStageOf(Stem.WU, Branch.WU)).toBe(LifeStage.PEAK);
    expect(lifeStageOf(Stem.REN, Branch.CHEN)).toBe(LifeStage.TOMB);
  });

  test('cycle index and nap am sound', () => {
    expect(cycleIndex(pair(Stem.JIA, Branch.ZI))).toBe(0);
    expect(cycleIndex(pair(Stem.GUI, Branch.HAI))).toBe(59);
    expect(cycleIndex(pair(Stem.YI, Branch.HAI))).toBe(11);
    // Ất Hợi shares Sơn Đầu Hỏa (the 6th sound) with Giáp Tuất.
    expect(naYinIndex(pair(Stem.YI, Branch.HAI))).toBe(5);
    expect(napAm(pair(Stem.YI, Branch.HAI))).toBe(Element.FIRE);
    expect(stemBranchPlus(pair(Stem.GUI, Branch.HAI), 1)).toEqual(pair(Stem.JIA, Branch.ZI));
  });

  test('luck pillars step from the month pillar', () => {
    const month = pair(Stem.XIN, Branch.SI);
    expect(luckRunsForward(Stem.YI, false)).toBe(true);
    const forward = luckPillars(month, true, 6, 3);
    expect(forward.map((l) => vi(l.pillar))).toEqual(['Nhâm Ngọ', 'Quý Mùi', 'Giáp Thân']);
    expect(forward.map((l) => l.startAge)).toEqual([6, 16, 26]);
    expect(forward[0]!.endAge).toBe(15);
    expect(vi(luckPillars(month, false, 5)[0]!.pillar)).toBe('Canh Thìn');
  });

  test('element balance counts all eight characters', () => {
    const pillars = [pair(Stem.YI, Branch.HAI), pair(Stem.XIN, Branch.SI), pair(Stem.XIN, Branch.HAI), pair(Stem.XIN, Branch.MAO)];
    const expected = new Map([
      [Element.WOOD, 2],
      [Element.FIRE, 1],
      [Element.EARTH, 0],
      [Element.METAL, 3],
      [Element.WATER, 2],
    ]);
    expect(new Map(elementBalance(pillars))).toEqual(expected);
  });

  test('zi wei palaces, minor stars and transformations', () => {
    const chart = ziWeiChart(ziWeiInput(Stem.GENG, 7, 17, Branch.YIN, false));

    expect(roleOf(chart, Branch.WU)).toBe(PalaceRole.LIFE);
    expect(roleOf(chart, Branch.SI)).toBe(PalaceRole.SIBLINGS);
    expect(branchOfRole(chart, PalaceRole.CAREER)).toBe(Branch.XU);
    expect(decadeStartAge(chart, Branch.WU)).toBe(3);
    expect(decadeStartAge(chart, Branch.CHEN)).toBe(23);
    expect(mainStarsIn(chart, Branch.WU)).toEqual([MainStar.ZI_WEI]);

    const minor = (s: MinorStar) => viBranch(chart.minorStars.get(s)!);
    expect(minor(MinorStar.LEFT_ASSISTANT)).toBe('Tuất');
    expect(minor(MinorStar.RIGHT_ASSISTANT)).toBe('Thìn');
    expect(minor(MinorStar.LITERARY_STAR)).toBe('Thân');
    expect(minor(MinorStar.LITERARY_ART)).toBe('Ngọ');
    expect(minor(MinorStar.PROSPERITY)).toBe('Thân');
    expect(minor(MinorStar.SHEEP_BLADE)).toBe('Dậu');
    expect(minor(MinorStar.SPINNING_TOP)).toBe('Mùi');
    expect(minor(MinorStar.HEAVENLY_LEADER)).toBe('Ngọ');
    expect(minor(MinorStar.HEAVENLY_HONOR)).toBe('Dần');
    expect(minor(MinorStar.EARTH_VOID)).toBe('Dậu');
    expect(minor(MinorStar.EARTH_ROBBERY)).toBe('Sửu');

    expect(chart.transformations.get(mainStarRef(MainStar.TAI_YANG))).toBe(Transformation.PROSPERITY);
    expect(chart.transformations.get(mainStarRef(MainStar.TIAN_TONG))).toBe(Transformation.OBSTACLE);
    expect(chart.transformations.size).toBe(4);
  });

  test('every year stem transforms four different stars', () => {
    expect(STEMS.every((s) => transformations(s).size === 4)).toBe(true);
  });

  test('void and cut branches', () => {
    expect(voidBranches(pair(Stem.JIA, Branch.ZI))).toEqual([Branch.XU, Branch.HAI]);
    expect(voidBranches(pair(Stem.YI, Branch.HAI))).toEqual([Branch.SHEN, Branch.YOU]);
    expect(cutBranches(Stem.JI)).toEqual([Branch.SHEN, Branch.YOU]);
    expect(cutBranches(Stem.REN)).toEqual([Branch.YIN, Branch.MAO]);
    expect(cutBranches(Stem.GUI)).toEqual([Branch.ZI, Branch.CHOU]);
    expect(trine(Branch.YIN)).toEqual([Branch.WU, Branch.XU]);
  });
});
