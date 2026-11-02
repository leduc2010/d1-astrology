import { resolveBirth } from '@/core/data';
import { MatchMark } from '@/engine';

import { matchReportOf } from '../matchReport';
import { OTHER, OWNER } from '../testing/matchTestData';

describe('MatchReport', () => {
  const report = matchReportOf(resolveBirth(OWNER), resolveBirth(OTHER));

  test('each side keeps its own name and year', () => {
    expect(report.first.name).toBe('Lan');
    expect(report.second.name).toBe('Minh');
    expect(report.first.lunarYear).toEqual(resolveBirth(OWNER).lunarYearPillar);
  });

  test('at most three strengths and three points of care', () => {
    expect(report.strengths.length).toBeLessThanOrEqual(3);
    expect(report.cares.length).toBeLessThanOrEqual(3);
  });

  test('strengths and points of care never overlap', () => {
    const cares = report.cares.map((it) => JSON.stringify(it));
    const overlap = report.strengths.filter((it) => cares.includes(JSON.stringify(it)));
    expect(overlap).toHaveLength(0);
  });

  test('criterion points carry the mark of their list', () => {
    const marksOf = (list: typeof report.strengths) =>
      list.flatMap((it) => (it.kind === 'Criterion' ? [it.mark] : []));
    marksOf(report.strengths).forEach((mark) => expect(mark).toBe(MatchMark.GOOD));
    marksOf(report.cares).forEach((mark) => expect(mark).toBe(MatchMark.CARE));
  });

  test('the same pair read twice gives the same report', () => {
    expect(matchReportOf(resolveBirth(OWNER), resolveBirth(OTHER))).toEqual(report);
  });
});
