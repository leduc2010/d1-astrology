import { lifeTrigram, Trigram, TRIGRAMS } from '../almanac/almanac';
import { AspectKind, aspectBetween, type NatalChart, zodiacPosition } from '../astro/natal';
import { Planet } from '../astro/planets';
import { Branch, BRANCHES, Element, napAm, Stem, stemBranch } from '../ganzhi/ganzhi';
import { BaZiCriterion, baziCriteria, MatchMark, type MatchPillars } from '../match/baziMatch';
import {
  BranchBond,
  branchBondOf,
  ElementBond,
  elementBondOf,
  HouseMansion,
  houseMansionOf,
  isEastGroup,
  isFavorableMansion,
  naYinBondOf,
  stemBondOf,
  trineGroup,
} from '../match/folk';
import { AxisLevel, axisLevel, SynastryAxis, synastryAxes } from '../match/synastry';

function chart(...planets: [Planet, number][]): NatalChart {
  return {
    planets: new Map(planets.map(([p, lon]) => [p, zodiacPosition(lon)] as const)),
    ascendant: null,
    midheaven: null,
    aspects: [],
  };
}

describe('Match', () => {
  test('branch bonds follow the classic pairs', () => {
    expect(branchBondOf(Branch.HAI, Branch.XU)).toBe(BranchBond.NEUTRAL);
    expect(branchBondOf(Branch.HAI, Branch.MAO)).toBe(BranchBond.TRINE);
    expect(branchBondOf(Branch.ZI, Branch.CHOU)).toBe(BranchBond.HARMONY);
    expect(branchBondOf(Branch.WU, Branch.WEI)).toBe(BranchBond.HARMONY);
    expect(branchBondOf(Branch.ZI, Branch.WU)).toBe(BranchBond.CLASH);
    expect(branchBondOf(Branch.ZI, Branch.WEI)).toBe(BranchBond.HARM);
    expect(branchBondOf(Branch.YOU, Branch.XU)).toBe(BranchBond.HARM);
    for (const a of BRANCHES) for (const b of BRANCHES) expect(branchBondOf(a, b)).toBe(branchBondOf(b, a));
  });

  test('trine groups start at their growth branch', () => {
    expect(trineGroup(Branch.WEI)).toEqual([Branch.HAI, Branch.MAO, Branch.WEI]);
    expect(trineGroup(Branch.XU)).toEqual([Branch.YIN, Branch.WU, Branch.XU]);
    expect(trineGroup(Branch.ZI)).toEqual([Branch.SHEN, Branch.ZI, Branch.CHEN]);
    expect(trineGroup(Branch.CHOU)).toEqual([Branch.SI, Branch.YOU, Branch.CHOU]);
  });

  test('stems combine five apart and otherwise meet by element', () => {
    expect(stemBondOf(Stem.YI, Stem.JIA)).toEqual({ combines: false, elements: ElementBond.SAME });
    expect(stemBondOf(Stem.JIA, Stem.JI).combines).toBe(true);
    expect(stemBondOf(Stem.GUI, Stem.WU).combines).toBe(true);
    expect(elementBondOf(Element.WOOD, Element.EARTH)).toBe(ElementBond.CONTROLS);
    expect(elementBondOf(Element.FIRE, Element.WOOD)).toBe(ElementBond.GENERATED_BY);
  });

  test('pig and dog years of 1995 and 1994 share the same mountain fire sound', () => {
    const yiHai = stemBranch(Stem.YI, Branch.HAI);
    const jiaXu = stemBranch(Stem.JIA, Branch.XU);
    expect(naYinBondOf(yiHai, jiaXu)).toEqual({ sameSound: true, elements: ElementBond.SAME });
    expect(napAm(yiHai)).toBe(Element.FIRE);
  });

  test('life trigrams pair into mansions', () => {
    const woman1995 = lifeTrigram(1995, false);
    const man1994 = lifeTrigram(1994, true);
    expect([woman1995, man1994]).toEqual([Trigram.KAN, Trigram.QIAN]);
    expect(houseMansionOf(woman1995, man1994)).toBe(HouseMansion.LIU_SHA);
    expect(isEastGroup(woman1995)).toBe(true);
    expect(isEastGroup(man1994)).toBe(false);
    for (const a of TRIGRAMS) {
      expect(houseMansionOf(a, a)).toBe(HouseMansion.FU_WEI);
      for (const b of TRIGRAMS) {
        const mansion = houseMansionOf(a, b);
        expect(houseMansionOf(b, a)).toBe(mansion);
        expect(isFavorableMansion(mansion)).toBe(isEastGroup(a) === isEastGroup(b));
      }
    }
  });

  test('aspect between picks the tightest major aspect', () => {
    expect(aspectBetween(10.0, 132.0)).toEqual({ kind: AspectKind.TRINE, orb: 2.0 });
    expect(aspectBetween(359.0, 180.0)).toEqual({ kind: AspectKind.OPPOSITION, orb: 1.0 });
    expect(aspectBetween(0.0, 40.0)).toBeNull();
  });

  test('synastry axes read harmony and tension', () => {
    const a = chart([Planet.VENUS, 10.0], [Planet.MERCURY, 0.0], [Planet.MARS, 200.0]);
    const b = chart([Planet.MOON, 130.0], [Planet.MERCURY, 90.0], [Planet.VENUS, 300.0]);
    const axes = new Map(synastryAxes(a, b).map((r) => [r.axis, r]));
    expect(axes.get(SynastryAxis.AFFECTION)!.level).toBe(AxisLevel.WARM);
    expect(axes.get(SynastryAxis.COMMUNICATION)!.level).toBe(AxisLevel.NEEDS_CARE);
    expect(axes.get(SynastryAxis.STABILITY)!.level).toBe(AxisLevel.QUIET);
    expect(axisLevel([])).toBe(AxisLevel.QUIET);
  });

  test('bazi criteria are marked one by one', () => {
    const a: MatchPillars = {
      year: stemBranch(Stem.YI, Branch.HAI),
      day: stemBranch(Stem.JIA, Branch.ZI),
      balance: new Map([[Element.WOOD, 3], [Element.FIRE, 0], [Element.EARTH, 2], [Element.METAL, 1], [Element.WATER, 2]]),
    };
    const b: MatchPillars = {
      year: stemBranch(Stem.JIA, Branch.XU),
      day: stemBranch(Stem.JI, Branch.WEI),
      balance: new Map([[Element.WOOD, 1], [Element.FIRE, 4], [Element.EARTH, 1], [Element.METAL, 1], [Element.WATER, 1]]),
    };
    const marks = new Map(baziCriteria(a, b).map((c) => [c.criterion, c.mark]));
    expect(marks.get(BaZiCriterion.YEAR_STEMS)).toBe(MatchMark.NEUTRAL);
    expect(marks.get(BaZiCriterion.ELEMENT_SUPPORT)).toBe(MatchMark.GOOD);
    expect(marks.get(BaZiCriterion.YEAR_BRANCHES)).toBe(MatchMark.NEUTRAL);
    // Giáp–Kỷ combine while Tý–Mùi harm: the two cancel out.
    expect(marks.get(BaZiCriterion.DAY_PILLARS)).toBe(MatchMark.NEUTRAL);
  });
});
