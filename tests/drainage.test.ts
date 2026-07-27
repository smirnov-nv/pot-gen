import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS } from '../src/core/params';
import { drainPoints, drainRingRadius } from '../src/core/drainage';

describe('drainPoints', () => {
  it('places the requested number of holes', () => {
    expect(drainPoints(DEFAULT_PARAMS)).toHaveLength(4);
    expect(drainPoints({ ...DEFAULT_PARAMS, drainHoles: 6 })).toHaveLength(6);
    expect(drainPoints({ ...DEFAULT_PARAMS, drainHoles: 0 })).toHaveLength(0);
  });

  it('spaces them evenly on the drain ring', () => {
    const r = drainRingRadius(DEFAULT_PARAMS);
    for (const p of drainPoints(DEFAULT_PARAMS)) {
      expect(Math.hypot(p.x, p.y)).toBeCloseTo(r, 9);
    }
  });

  it('starts on the diagonal, away from the flattest span of the base', () => {
    const [first] = drainPoints(DEFAULT_PARAMS);
    expect(Math.abs(first!.x)).toBeCloseTo(Math.abs(first!.y), 9);
  });

  it('keeps the holes clear of the wall', () => {
    const r = drainRingRadius(DEFAULT_PARAMS);
    expect(r + DEFAULT_PARAMS.drainDia / 2).toBeLessThan(DEFAULT_PARAMS.bottomSize / 2);
  });
});
