import { vi } from '../__testutils__/vietNames';
import { almanacDay, HourSpirit, notableDays, SolarTerm, termStart } from '../almanac/almanac';
import { Direction, joyDirection } from '../almanac/direction';
import { Festival, festivalFallsOn } from '../almanac/festival';
import { MoonPhase, moonPhaseOf } from '../almanac/moonPhase';
import { Branch, branchClash, controls, Element, generatedBy, generates, Stem } from '../ganzhi/ganzhi';
import { TenGod, TenGodGroup, tenGodGroup, tenGodOf } from '../ganzhi/tenGod';
import { lunarDate, monthPillar, VIETNAM_OFFSET } from '../lunar/lunarCalendar';
import { civilDate } from '../time/civilDate';

describe('DayDetail', () => {
  test('day page values for 31 October 2026', () => {
    const day = almanacDay(civilDate(2026, 10, 31), VIETNAM_OFFSET);
    expect(day.lunar).toEqual(lunarDate(2026, 9, 22));
    expect(vi(day.monthPillar)).toBe('Mậu Tuất');
    expect(day.daySpirit).toBe(HourSpirit.LIFE_CONTROLLER);
    expect(day.isAuspiciousDay).toBe(true);
    expect(day.moonPhase).toBe(MoonPhase.LAST_QUARTER);
    expect(day.isTermStart).toBe(false);
    expect(termStart(day.date, VIETNAM_OFFSET)).toEqual(civilDate(2026, 10, 23));
  });

  test('start of winter 2026 opens on 7 November', () => {
    const day = almanacDay(civilDate(2026, 11, 7), VIETNAM_OFFSET);
    expect(day.isTermStart).toBe(true);
    expect(day.solarTerm).toBe(SolarTerm.START_OF_WINTER);
    expect(termStart(day.date, VIETNAM_OFFSET)).toEqual(day.date);
  });

  test('lunar and solar festivals', () => {
    expect(almanacDay(civilDate(2026, 2, 17), VIETNAM_OFFSET).festivals).toEqual([Festival.LUNAR_NEW_YEAR]);
    expect(almanacDay(civilDate(2026, 9, 25), VIETNAM_OFFSET).festivals).toEqual([Festival.MID_AUTUMN]);
    expect(almanacDay(civilDate(2026, 12, 25), VIETNAM_OFFSET).festivals).toEqual([Festival.CHRISTMAS]);
  });

  test('festivals skip the leap month', () => {
    // 2025 repeats the sixth month; Vu Lan stays in the regular seventh.
    expect(festivalFallsOn(Festival.GHOST_FESTIVAL, civilDate(2025, 8, 8), lunarDate(2025, 7, 15, true))).toBe(false);
    expect(festivalFallsOn(Festival.GHOST_FESTIVAL, civilDate(2025, 9, 6), lunarDate(2025, 7, 15))).toBe(true);
  });

  test('notable days list term starts and festivals in order', () => {
    const days = notableDays(civilDate(2026, 11, 1), 30, VIETNAM_OFFSET);
    expect(days.map((d) => d.date)).toEqual([civilDate(2026, 11, 7), civilDate(2026, 11, 20), civilDate(2026, 11, 22)]);
  });

  test('lunar month pillar follows the year stem', () => {
    expect(vi(monthPillar(lunarDate(2024, 1, 1)))).toBe('Bính Dần');
    expect(vi(monthPillar(lunarDate(2026, 1, 1)))).toBe('Canh Dần');
    expect(vi(monthPillar(lunarDate(2026, 12, 1)))).toBe('Tân Sửu');
  });

  test('moon phase from the lunar day', () => {
    expect(moonPhaseOf(1)).toBe(MoonPhase.NEW_MOON);
    expect(moonPhaseOf(8)).toBe(MoonPhase.FIRST_QUARTER);
    expect(moonPhaseOf(15)).toBe(MoonPhase.FULL_MOON);
    expect(moonPhaseOf(30)).toBe(MoonPhase.WANING_CRESCENT);
  });

  test('ten gods by phase and polarity', () => {
    expect(tenGodOf(Stem.WU, Stem.WU)).toBe(TenGod.FRIEND);
    expect(tenGodOf(Stem.WU, Stem.JI)).toBe(TenGod.ROB_WEALTH);
    expect(tenGodOf(Stem.JIA, Stem.BING)).toBe(TenGod.EATING_GOD);
    expect(tenGodOf(Stem.JIA, Stem.JI)).toBe(TenGod.DIRECT_WEALTH);
    expect(tenGodOf(Stem.JIA, Stem.GENG)).toBe(TenGod.SEVEN_KILLINGS);
    expect(tenGodOf(Stem.JIA, Stem.XIN)).toBe(TenGod.DIRECT_OFFICER);
    expect(tenGodOf(Stem.JIA, Stem.GUI)).toBe(TenGod.DIRECT_RESOURCE);
    expect(tenGodGroup(TenGod.INDIRECT_WEALTH)).toBe(TenGodGroup.WEALTH);
  });

  test('element cycles, clash and joy direction', () => {
    expect(generates(Element.WOOD)).toBe(Element.FIRE);
    expect(generatedBy(Element.WOOD)).toBe(Element.WATER);
    expect(controls(Element.WATER)).toBe(Element.FIRE);
    expect(branchClash(Branch.YIN)).toBe(Branch.SHEN);
    expect(branchClash(Branch.WU)).toBe(Branch.ZI);
    expect(joyDirection(Stem.WU)).toBe(Direction.SOUTH_EAST);
    expect(joyDirection(Stem.JI)).toBe(Direction.NORTH_EAST);
  });
});
