import kotlin from './kotlinTokens.fixture.json';
import { KotlinRandom } from '../component/kotlinRandom';
import { skyStars } from '../component/StarfieldBackground';
import { OrtusAlpha } from '../theme/alpha';
import { OrtusGlow, OrtusSizes, OrtusSpacing, OrtusStroke } from '../theme/dimens';
import { OrtusEasingCurves, OrtusMotion } from '../theme/motion';
import { Palette, withAlpha } from '../theme/palette';
import { OrtusRadii } from '../theme/shapes';

// The fixture is extracted from the Kotlin sources (Dimens.kt, Color.kt), so a value changed on
// either side shows up here.
const groups: [string, Record<string, unknown>, Record<string, number | string>][] = [
  ['OrtusSpacing', OrtusSpacing, kotlin.OrtusSpacing],
  ['OrtusSizes', OrtusSizes, kotlin.OrtusSizes],
  ['OrtusGlow', OrtusGlow, kotlin.OrtusGlow],
  ['OrtusStroke', OrtusStroke, kotlin.OrtusStroke],
  ['OrtusShapes', OrtusRadii, kotlin.OrtusShapes],
  ['OrtusAlpha', OrtusAlpha, kotlin.OrtusAlpha],
  ['Palette', Palette, kotlin.Palette],
];

describe('design tokens match Kotlin', () => {
  test.each(groups)('%s has every Kotlin value', (_name, actual, expected) => {
    for (const [key, value] of Object.entries(expected)) {
      expect({ key, value: actual[key] }).toEqual({ key, value });
    }
  });

  test('motion durations and scales', () => {
    expect(OrtusMotion.QUICK).toBe(160);
    expect(OrtusMotion.STANDARD).toBe(320);
    expect(OrtusMotion.EMPHASIZED).toBe(520);
    expect(OrtusMotion.CEREMONIAL).toBe(1200);
    expect(OrtusMotion.AMBIENT).toBe(6000);
    expect(OrtusMotion.STAGGER).toBe(60);
    expect(OrtusMotion.PRESSED_SCALE).toBe(0.97);
    expect(OrtusMotion.ENTER_SCALE).toBe(0.98);
    expect(OrtusMotion.revealRise).toBe(14);
  });

  test('easing curves', () => {
    expect(OrtusEasingCurves.settle).toEqual([0.22, 1, 0.36, 1]);
    expect(OrtusEasingCurves.glide).toEqual([0.45, 0, 0.55, 1]);
    expect(OrtusEasingCurves.exit).toEqual([0.4, 0, 1, 1]);
  });

  test('withAlpha builds rgba and rejects bad input', () => {
    expect(withAlpha('#D8B46A', 0.5)).toBe('rgba(216, 180, 106, 0.5)');
    expect(() => withAlpha('gold', 0.5)).toThrow();
  });
});

describe('KotlinRandom matches kotlin.random.Random(seed)', () => {
  // Reference values printed by kotlin-stdlib 2.0.21 on the JVM.
  test.each([
    [0x0d7a, [0.21698862, 0.3286131, 0.89683896, 0.48927844, 0.1293503]],
    [0x0d7b, [0.6195865, 0.6456855, 0.9247272, 0.27015895, 0.40667498]],
    [-5, [0.38695252, 0.46636927, 0.9038157, 0.92416316, 0.24090463]],
  ])('seed %d', (seed, expected) => {
    const random = new KotlinRandom(seed);
    for (const value of expected) expect(random.nextFloat()).toBeCloseTo(value, 6);
  });

  test('sky stars stay inside the unit square with Kotlin ranges', () => {
    const stars = skyStars(34, 0x0d7a);
    expect(stars).toHaveLength(34);
    expect(stars[0].x).toBeCloseTo(0.21698862, 6);
    for (const star of stars) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThan(1);
      expect(star.radius).toBeGreaterThanOrEqual(0.6);
      expect(star.radius).toBeLessThan(1.5);
      expect(star.alpha).toBeGreaterThanOrEqual(0.25);
      expect(star.alpha).toBeLessThan(0.8);
    }
  });
});
