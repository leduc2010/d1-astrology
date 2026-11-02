import { expectNear } from '../__testutils__/vietNames';
import { birthMoment, pillars } from '../bazi/bazi';
import { StrengthLevel, strengthOf } from '../bazi/strength';
import { Branch, controlledBy, controls, Element, ELEMENTS, generates, Stem, stemBranch } from '../ganzhi/ganzhi';
import { TEN_GOD_GROUPS } from '../ganzhi/tenGod';
import { civilDate } from '../time/civilDate';

const pair = stemBranch;

describe('Strength', () => {
  test('controlled by is the inverse of controls', () => {
    for (const e of ELEMENTS) expect(controls(controlledBy(e))).toBe(e);
    expect(controlledBy(Element.WOOD)).toBe(Element.METAL);
  });

  test('wood among wood is strong and uses metal', () => {
    const s = strengthOf(pair(Stem.JIA, Branch.YIN), pair(Stem.BING, Branch.YIN), pair(Stem.JIA, Branch.YIN), pair(Stem.JIA, Branch.YIN));
    // Companions 5.3 + resource 0 out of 8.5 points.
    expectNear(s.support, 5.3 / 8.5, 1e-9);
    expect(s.level).toBe(StrengthLevel.STRONG);
    expect(s.useful).toBe(Element.METAL);
    expect(s.favorable).toBe(Element.EARTH);
    expect(s.unfavorable).toBe(Element.FIRE);
  });

  test('wood fed by heavy water uses earth to break the resource', () => {
    const s = strengthOf(pair(Stem.REN, Branch.ZI), pair(Stem.GUI, Branch.HAI), pair(Stem.JIA, Branch.ZI), pair(Stem.REN, Branch.ZI));
    expect(s.level).toBe(StrengthLevel.VERY_STRONG);
    expect(s.useful).toBe(Element.EARTH);
  });

  test('wood surrounded by earth is very weak and uses its own element', () => {
    const s = strengthOf(pair(Stem.WU, Branch.CHEN), pair(Stem.JI, Branch.WEI), pair(Stem.JIA, Branch.XU), pair(Stem.WU, Branch.XU));
    expect(s.level).toBe(StrengthLevel.VERY_WEAK);
    expect(s.useful).toBe(Element.WOOD);
    expect(s.favorable).toBe(Element.WATER);
    expect(s.unfavorable).toBe(Element.METAL);
  });

  test('wood cut by heavy metal is very weak and uses water', () => {
    const s = strengthOf(pair(Stem.GENG, Branch.SHEN), pair(Stem.XIN, Branch.YOU), pair(Stem.JIA, Branch.SHEN), pair(Stem.GENG, Branch.SHEN));
    expect(s.level).toBe(StrengthLevel.VERY_WEAK);
    expect(s.useful).toBe(Element.WATER);
  });

  test('month branch weighs more than any other branch', () => {
    const inMonth = strengthOf(pair(Stem.WU, Branch.XU), pair(Stem.WU, Branch.YIN), pair(Stem.JIA, Branch.XU), null);
    const inYear = strengthOf(pair(Stem.WU, Branch.YIN), pair(Stem.WU, Branch.XU), pair(Stem.JIA, Branch.XU), null);
    expect(inMonth.support).toBeGreaterThan(inYear.support);
  });

  test('an unknown hour leaves out the hour pillar', () => {
    const s = strengthOf(pair(Stem.JIA, Branch.YIN), pair(Stem.BING, Branch.YIN), pair(Stem.JIA, Branch.YIN), null);
    // Two stems, two plain branches and the month branch.
    expectNear([...s.points.values()].reduce((a, b) => a + b, 0), 6.5, 1e-9);
    expect(new Set(s.points.keys())).toEqual(new Set(TEN_GOD_GROUPS));
  });

  test('helpers always feed and restrain the useful element across real charts', () => {
    for (let year = 1950; year <= 2030; year += 3) {
      for (let month = 1; month <= 12; month++) {
        const date = civilDate(year, month, 1 + ((year + month) % 28));
        const p = pillars(birthMoment(date, (year + month) % 24, 0, 7.0));
        const s = strengthOf(p.year, p.month, p.day, p.hour);
        if (!(s.support >= 0 && s.support <= 1)) throw new Error(`support ${s.support}`);
        if (generates(s.favorable) !== s.useful || controls(s.unfavorable) !== s.useful) {
          throw new Error(`${year}-${month}`);
        }
      }
    }
  });
});
