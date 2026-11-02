import { resolveBirth } from '../../data/chart/resolvedBirth';
import { TestProfiles } from '../../testing/testProfiles';
import { branchOfRole, mainStarsIn, PALACE_ROLES, type ZiWeiChart } from '../../../engine';
import { factFor, readingCharts, Readings } from '../reading';
import { MAX_DETAILS } from '../readingDetails';
import { READING_SYSTEMS, ReadingSystem, TOPICS } from '../readingEnums';

// Ported from Kotlin ReadingsTest: Lan, 1990-05-15 12:00, Hà Nội, with and without the time.
const withTime = TestProfiles.owner;
const withoutTime = { ...withTime, clock: null };

const chartsWithTime = readingCharts(resolveBirth(withTime));
const chartsWithoutTime = readingCharts(resolveBirth(withoutTime));

function ziWeiOf(profile: typeof withTime): ZiWeiChart {
  const chart = resolveBirth(profile).ziWei();
  if (!chart) throw new Error('expected a Tu Vi chart for a known birth time');
  return chart;
}

const ownStarsEmpty = (chart: ZiWeiChart, role: Parameters<typeof branchOfRole>[1]): boolean =>
  mainStarsIn(chart, branchOfRole(chart, role)).length === 0;

describe('Readings', () => {
  it('reads every topic from all three systems when the birth time is known', () => {
    const readings = Readings.all(chartsWithTime);

    expect(readings.map((r) => r.topic)).toEqual(TOPICS);
    readings.forEach((reading) => {
      expect(reading.facts.map((f) => f.system)).toEqual(READING_SYSTEMS);
      expect(reading.agreement).toBeGreaterThanOrEqual(1);
      expect(reading.agreement).toBeLessThanOrEqual(reading.available);
      expect(reading.dissenting).toHaveLength(reading.available - reading.agreement);
      expect(reading.facts.some((f) => f.tone === reading.tone)).toBe(true);
    });
  });

  it('leaves Tu Vi out without a birth time and falls back from houses to planets', () => {
    Readings.all(chartsWithoutTime).forEach((reading) => {
      expect(reading.available).toBe(2);
      expect(factFor(reading, ReadingSystem.ZIWEI)).toBeNull();
      expect(factFor(reading, ReadingSystem.WESTERN)?.kind).toBe('PlanetSign');
    });
  });

  it("borrows the opposite palace's stars when a palace is empty", () => {
    const chart = ziWeiOf(withTime);

    PALACE_ROLES.forEach((role) => {
      const fact = Readings.palaceFact(chart, role);
      expect(fact).not.toBeNull();
      expect(fact?.borrowed).toBe(ownStarsEmpty(chart, role));
      expect(fact?.stars.length).toBeGreaterThan(0);
    });
  });

  it('gives every topic three to five details from more than one system', () => {
    Readings.all(chartsWithTime).forEach((reading) => {
      expect(reading.details.length).toBeGreaterThanOrEqual(3);
      expect(reading.details.length).toBeLessThanOrEqual(MAX_DETAILS);
      expect(new Set(reading.details.map((d) => d.system)).size).toBeGreaterThan(1);
    });
  });

  it('needs a birth time for star, house and rising details', () => {
    const kinds = Readings.all(chartsWithoutTime).flatMap((r) => r.details.map((d) => d.kind));
    expect(kinds).not.toContain('StarInPalace');
    expect(kinds).not.toContain('PlanetInHouse');
    expect(kinds).not.toContain('Rising');
  });

  it('borrows star details exactly when the palace is empty', () => {
    const chart = ziWeiOf(withTime);
    const stars = Readings.all(chartsWithTime)
      .flatMap((r) => r.details)
      .flatMap((d) => (d.kind === 'StarInPalace' ? [d] : []));

    expect(stars.length).toBeGreaterThan(0);
    stars.forEach((detail) => expect(detail.borrowed).toBe(ownStarsEmpty(chart, detail.role)));
  });

  it('gives ties to the system listed first', () => {
    Readings.all(chartsWithoutTime)
      .filter((r) => r.agreement === 1)
      .forEach((reading) => expect(reading.tone).toBe(reading.facts[0]?.tone));
  });
});
