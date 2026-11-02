import { DEFAULT_SETTINGS } from '../../model';
import {
  applyConsent,
  type Analytics,
  type CrashReporter,
  createTelemetry,
  DEFAULT_REMOTE_VALUES,
  DefaultRemoteSettings,
  screenNameOf,
  screenNameOfSegments,
  screenViewOf,
  scrub,
  ScrubbedError,
  scrubOrBare,
  stackFramesOf,
} from '..';

class ProfileError extends Error {}

describe('telemetry privacy', () => {
  test('screen names keep the route class and drop its arguments', () => {
    expect(screenNameOf('com.ortusdestiny.astrology.astra.feature.match.MatchResultRoute/{partnerId}')).toBe('match_result');
    expect(screenNameOf('com.ortusdestiny.astrology.astra.feature.calendar.DayRoute?date={date}')).toBe('day');
    expect(screenNameOf('com.ortusdestiny.astrology.astra.feature.today.TodayRoute')).toBe('today');
    expect(screenNameOf(null)).toBeNull();
    expect(screenNameOf('/{x}')).toBeNull();
  });

  test('router segments keep parameter names, never values', () => {
    expect(screenNameOfSegments(['(tabs)', 'calendar'])).toBe('calendar');
    expect(screenNameOfSegments(['match', '[id]'])).toBe('match_id');
    expect(screenNameOfSegments(['edit-birth'])).toBe('edit_birth');
    expect(screenNameOfSegments(['(tabs)'])).toBe('today');
  });

  test('a screen view carries only the screen name', () => {
    const event = screenViewOf('com.x.feature.ai.AiRoute');

    expect(event?.params).toEqual({ screen_name: 'ai' });
  });

  test('scrubbed crashes keep classes and stack frames but no messages', () => {
    const root = new TypeError('born 1990-05-15 in Ha Noi');
    const error = new ProfileError('profile Lan failed', { cause: root });

    const scrubbed = scrub(error);
    const cause = scrubbed.cause as ScrubbedError;

    expect(scrubbed.message).toBe('ProfileError');
    expect(stackFramesOf(scrubbed)).toEqual(stackFramesOf(error));
    expect(stackFramesOf(error).length).toBeGreaterThan(0);
    expect(cause).toBeInstanceOf(ScrubbedError);
    expect(cause.message).toBe('TypeError');
    expect(stackFramesOf(cause)).toEqual(stackFramesOf(root));
    expect(cause.cause).toBeUndefined();
    expect(scrubbed.stack).not.toContain('Lan');
    expect(cause.stack).not.toContain('1990');
  });

  test('scrubbing stops after a bounded number of causes', () => {
    let error = new Error('leaf');
    for (let i = 0; i < 50; i++) error = new Error(`level ${i}`, { cause: error });

    let depth = 0;
    let current: unknown = scrub(error);
    while (current !== undefined) {
      expect(current).toBeInstanceOf(ScrubbedError);
      depth++;
      current = (current as ScrubbedError).cause;
    }
    expect(depth).toBeGreaterThanOrEqual(2);
    expect(depth).toBeLessThanOrEqual(10);
  });

  test('anything thrown, even a string, is scrubbed', () => {
    expect(scrubOrBare('born in Hue').message).toBe('string');
  });

  test('without a backend the defaults never change', async () => {
    const remote = new DefaultRemoteSettings();
    const before = remote.getValues();
    const listener = jest.fn();
    const unsubscribe = remote.subscribe(listener);

    await remote.refresh();

    expect(remote.getValues()).toBe(before);
    expect(before).toEqual(DEFAULT_REMOTE_VALUES);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  test('analytics and crash reports follow consent, which defaults to off', () => {
    const analytics: Analytics = { setEnabled: jest.fn(), log: jest.fn() };
    const crash: CrashReporter = { setEnabled: jest.fn() };
    const telemetry = { ...createTelemetry(), analytics, crash };

    applyConsent(telemetry, DEFAULT_SETTINGS);
    applyConsent(telemetry, { analyticsConsent: true });

    expect(analytics.setEnabled).toHaveBeenNthCalledWith(1, false);
    expect(crash.setEnabled).toHaveBeenNthCalledWith(1, false);
    expect(analytics.setEnabled).toHaveBeenNthCalledWith(2, true);
    expect(crash.setEnabled).toHaveBeenNthCalledWith(2, true);
  });
});
