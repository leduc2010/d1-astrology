import { pillarsStrength, type ResolvedBirth } from '@/core/data';
import { Gender, minutesOfDay } from '@/core/model';
import {
  BRANCHES,
  cutBranches,
  decadePalace,
  decadeStartAge,
  elementBalance,
  isLuckyMinorStar,
  lifeStageOf,
  luckCovers,
  luckPillars,
  luckRunsForward,
  mainStarRef,
  mainStarsIn,
  minorStarRef,
  minorStarsIn,
  palaceAt,
  roleOf,
  tenGodOf,
  toLunar,
  voidBranches,
  yearPillar,
  type CivilDate,
  type StemBranch,
  type ZiWeiChart,
  type ZiWeiStar,
} from '@/engine';

import {
  PillarKind,
  type BaZiView,
  type BirthCharts,
  type PalaceView,
  type PillarColumn,
  type StarMark,
  type ZiWeiView,
} from './chartViews';

/** Builds every chart for this birth as seen on [today]. */
export function toCharts(birth: ResolvedBirth, today: CivilDate): BirthCharts {
  const { profile } = birth;
  const ziWei = birth.ziWei();
  return Object.freeze({
    name: profile.name,
    gender: profile.gender,
    solarDate: birth.solarDate,
    lunarDate: birth.lunarDate,
    clockMinutes: profile.clock ? minutesOfDay(profile.clock) : null,
    hourBranch: birth.hourBranch,
    baZi: baZiView(birth, today),
    ziWei: ziWei ? ziWeiView(birth, ziWei, today) : null,
    natal: Object.freeze({ chart: birth.natal(), hasTime: profile.clock !== null, moonSigns: birth.moonSigns() }),
  });
}

function baZiView(birth: ResolvedBirth, today: CivilDate): BaZiView {
  const pillars = birth.pillars();
  const master = pillars.day.stem;
  const column = (kind: PillarKind, pillar: StemBranch | null): PillarColumn =>
    Object.freeze({
      kind,
      pillar,
      tenGod: pillar && kind !== PillarKind.DAY ? tenGodOf(master, pillar.stem) : null,
      lifeStage: pillar ? lifeStageOf(master, pillar.branch) : null,
    });
  const forward = luckRunsForward(pillars.year.stem, birth.profile.gender === Gender.MALE);
  const startAge = Math.round(birth.luckStartYears());
  const luck = luckPillars(pillars.month, forward, startAge);
  const age = fullYears(birth.solarDate, today);
  const known = [pillars.year, pillars.month, pillars.day, pillars.hour].filter((p): p is StemBranch => p !== null);
  const balance = [...elementBalance(known)].sort((a, b) => b[1] - a[1]);
  const current = luck.findIndex((lp) => luckCovers(lp, age));
  return Object.freeze({
    columns: [
      column(PillarKind.HOUR, pillars.hour),
      column(PillarKind.DAY, pillars.day),
      column(PillarKind.MONTH, pillars.month),
      column(PillarKind.YEAR, pillars.year),
    ],
    dayMaster: master,
    balance,
    luckStartAge: startAge,
    luckForward: forward,
    luck,
    currentLuck: current >= 0 ? current : null,
    strength: pillarsStrength(pillars),
  });
}

function ziWeiView(birth: ResolvedBirth, chart: ZiWeiChart, today: CivilDate): ZiWeiView {
  // Tuần / Triệt follow the year the chart is counted in, the same one as the Tứ Hóa.
  const year = yearPillar(birth.chartLunarDate.year);
  const empty = new Set(voidBranches(year));
  const cut = new Set(cutBranches(year.stem));
  const marks = (stars: readonly ZiWeiStar[]): StarMark[] =>
    stars.map((star) => Object.freeze({ star, transformation: chart.transformations.get(star) ?? null }));
  const palaces = BRANCHES.map((branch): PalaceView => {
    const minors = minorStarsIn(chart, branch);
    return Object.freeze({
      branch,
      pillar: palaceAt(chart, branch),
      role: roleOf(chart, branch),
      decadeStartAge: decadeStartAge(chart, branch),
      mainStars: marks(mainStarsIn(chart, branch).map(mainStarRef)),
      luckyStars: marks(minors.filter(isLuckyMinorStar).map(minorStarRef)),
      maleficStars: marks(minors.filter((s) => !isLuckyMinorStar(s)).map(minorStarRef)),
      isBody: branch === chart.bodyPalace,
      isVoid: empty.has(branch),
      isCut: cut.has(branch),
    });
  });
  // Tử Vi counts age the East Asian way: one at birth, one more each lunar new year.
  const nominalAge = toLunar(today).year - birth.lunarDate.year + 1;
  return Object.freeze({
    palaces,
    lifeBranch: chart.lifePalace.branch,
    bodyBranch: chart.bodyPalace,
    bureau: chart.bureau,
    yearPillar: year,
    transformations: [...chart.transformations]
      .sort((a, b) => a[1] - b[1])
      .map(([star, tr]) => [tr, star] as const),
    currentDecade: decadePalace(chart, nominalAge)?.branch ?? null,
  });
}

/** Completed years between [birth] and [today]. */
export function fullYears(birth: CivilDate, today: CivilDate): number {
  const beforeBirthday = today.month < birth.month || (today.month === birth.month && today.day < birth.day);
  return today.year - birth.year - (beforeBirthday ? 1 : 0);
}
