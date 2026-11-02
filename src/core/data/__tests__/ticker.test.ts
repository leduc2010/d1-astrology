import { delay } from '../time/delay';
import { minuteTicks } from '../time/ticker';

describe('minuteTicks', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 1, 9, 15, 40));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('ticks now, then on each minute boundary until stopped', () => {
    const ticks: number[] = [];
    const stop = minuteTicks((now) => ticks.push(now.getMinutes()));
    expect(ticks).toEqual([15]);

    jest.advanceTimersByTime(19_999);
    expect(ticks).toEqual([15]);
    jest.advanceTimersByTime(1);
    expect(ticks).toEqual([15, 16]);
    jest.advanceTimersByTime(60_000);
    expect(ticks).toEqual([15, 16, 17]);

    stop();
    jest.advanceTimersByTime(180_000);
    expect(ticks).toEqual([15, 16, 17]);
  });

  test('delay of zero or less resolves without a timer', async () => {
    await expect(delay(0)).resolves.toBeUndefined();
    expect(jest.getTimerCount()).toBe(0);
  });
});
