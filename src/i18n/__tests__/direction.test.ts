import { applyLayoutDirection, type DirectionManager } from '../direction';

function manager(isRTL: boolean): DirectionManager & { forced: boolean | null } {
  return {
    isRTL,
    forced: null,
    allowRTL: jest.fn(),
    forceRTL(force: boolean) {
      this.forced = force;
    },
  };
}

describe('layout direction', () => {
  it('forces right-to-left for Arabic and asks for a reload from a left-to-right start', () => {
    const m = manager(false);
    expect(applyLayoutDirection('ar', m)).toBe(true);
    expect(m.forced).toBe(true);
    expect(m.allowRTL).toHaveBeenCalledWith(true);
  });

  it('needs no reload when the direction already matches', () => {
    expect(applyLayoutDirection('ar', manager(true))).toBe(false);
    expect(applyLayoutDirection('vi', manager(false))).toBe(false);
  });

  it('turns right-to-left off again when leaving Arabic', () => {
    const m = manager(true);
    expect(applyLayoutDirection('en', m)).toBe(true);
    expect(m.forced).toBe(false);
    expect(m.allowRTL).toHaveBeenCalledWith(false);
  });
});
