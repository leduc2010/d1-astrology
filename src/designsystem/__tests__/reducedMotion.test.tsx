import { AccessibilityInfo, Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';

import { DesignSystemProvider, useReducedMotion } from '../theme/DesignSystemProvider';
import { OrtusMotion } from '../theme/motion';

function Probe() {
  return <Text>{useReducedMotion() ? 'reduced' : 'full'}</Text>;
}

describe('reduced motion', () => {
  afterEach(() => jest.restoreAllMocks());

  test('defaults to full motion without a provider', async () => {
    await render(<Probe />);
    expect(screen.getByText('full')).toBeTruthy();
  });

  test('the in-app setting turns motion down', async () => {
    await render(
      <DesignSystemProvider reducedMotion>
        <Probe />
      </DesignSystemProvider>,
    );
    expect(screen.getByText('reduced')).toBeTruthy();
  });

  test('the system setting turns motion down too', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    await render(
      <DesignSystemProvider>
        <Probe />
      </DesignSystemProvider>,
    );
    await act(async () => {});
    expect(screen.getByText('reduced')).toBeTruthy();
  });

  test('motion specs snap when reduced', () => {
    for (const spec of [OrtusMotion.standard, OrtusMotion.emphasized, OrtusMotion.ceremonial, OrtusMotion.quick]) {
      expect(spec(true)).toEqual({ duration: 0 });
      expect(spec(false).duration).toBeGreaterThan(0);
    }
    expect(OrtusMotion.standard().duration).toBe(OrtusMotion.STANDARD);
    expect(OrtusMotion.emphasized().duration).toBe(OrtusMotion.EMPHASIZED);
    expect(OrtusMotion.ceremonial().duration).toBe(OrtusMotion.CEREMONIAL);
    expect(OrtusMotion.quick().duration).toBe(OrtusMotion.QUICK);
  });
});
