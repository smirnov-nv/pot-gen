import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS, BUILTIN_PRESETS } from '../src/core/params';
import { buildRings } from '../src/core/profile';
import { STACK_LIMIT_MM, computeMetrics, effectiveWall, nestingPitch } from '../src/core/metrics';

describe('computeMetrics', () => {
  const m = computeMetrics(DEFAULT_PARAMS);

  it('lands in the ballpark of a real P9 pot', () => {
    // A P9 holds roughly half a litre and costs ~30 g of PETG.
    expect(m.usableVolumeL).toBeGreaterThan(0.3);
    expect(m.usableVolumeL).toBeLessThan(0.7);
    expect(m.grams).toBeGreaterThan(15);
    expect(m.grams).toBeLessThan(60);
  });

  it('derives cost from mass and price', () => {
    expect(m.cost).toBeCloseTo(m.grams * DEFAULT_PARAMS.pricePerGram, 9);
    const free = computeMetrics({ ...DEFAULT_PARAMS, pricePerGram: 0 });
    expect(free.cost).toBe(0);
  });

  it('counts layers as height / layerH', () => {
    expect(m.layers).toBe(Math.floor(DEFAULT_PARAMS.height / DEFAULT_PARAMS.layerH));
  });

  it('scales print time inversely with speed', () => {
    const fast = computeMetrics({ ...DEFAULT_PARAMS, speed: 140 });
    expect(fast.minutes).toBeCloseTo(m.minutes / 2, 6);
  });

  it('measures the wall angle from vertical', () => {
    const straight = computeMetrics({ ...DEFAULT_PARAMS, bottomSize: DEFAULT_PARAMS.topSize });
    expect(straight.wallAngleDeg).toBeCloseTo(0, 9);
    const p = { ...DEFAULT_PARAMS, topSize: 100, bottomSize: 0 + 40, height: 30 };
    expect(computeMetrics(p).wallAngleDeg).toBeCloseTo((Math.atan2(30, 30) * 180) / Math.PI, 6);
  });

  it('reports the fluting wavelength, and Infinity when smooth', () => {
    // Measured on the smooth rim contour: the fluted perimeter is longer and
    // would flatter a wave that is in fact too tight for the nozzle.
    expect(m.flutePeriod).toBeLessThan(m.rimPerimeter / DEFAULT_PARAMS.flutes);
    expect(m.flutePeriod).toBeGreaterThan(8);
    expect(computeMetrics({ ...DEFAULT_PARAMS, flutes: 0 }).flutePeriod).toBe(Infinity);
  });

  it('halves the flute period when the wave count doubles', () => {
    const dense = computeMetrics({ ...DEFAULT_PARAMS, flutes: 64 });
    expect(dense.flutePeriod).toBeCloseTo(m.flutePeriod / 2, 9);
  });

  it('uses the extrusion width in vase mode and the wall thickness in shell mode', () => {
    expect(effectiveWall(DEFAULT_PARAMS)).toBe(DEFAULT_PARAMS.wallWidth);
    const s = { ...DEFAULT_PARAMS, mode: 'shell' as const };
    expect(effectiveWall(s)).toBe(s.wallThickness);
    expect(computeMetrics(s).grams).toBeGreaterThan(m.grams);
  });

  it('gives more substrate for a bigger pot', () => {
    const big = computeMetrics({ ...DEFAULT_PARAMS, topSize: 140, bottomSize: 110, height: 140 });
    expect(big.usableVolumeL).toBeGreaterThan(m.usableVolumeL);
  });

  it('drops filament mass when drainage removes bottom material', () => {
    const shell = { ...DEFAULT_PARAMS, mode: 'shell' as const, drainHoles: 0 };
    const drained = { ...shell, drainHoles: 6, drainDia: 8 };
    expect(computeMetrics(drained).grams).toBeLessThan(computeMetrics(shell).grams);
  });

  it('computes for both built-in presets', () => {
    for (const preset of BUILTIN_PRESETS) {
      const pm = computeMetrics(preset.params);
      expect(Number.isFinite(pm.grams), preset.id).toBe(true);
      expect(pm.usableVolumeL, preset.id).toBeGreaterThan(0.2);
    }
  });
});

describe('nestingPitch', () => {
  it('is much smaller than the pot height for a tapered pot', () => {
    const m = computeMetrics(DEFAULT_PARAMS);
    expect(m.nestingPitch).toBeGreaterThan(0);
    expect(m.nestingPitch).toBeLessThan(DEFAULT_PARAMS.height / 2);
    expect(m.nestingCount).toBeGreaterThan(3);
  });

  it('degenerates to the full height when the pot cannot nest', () => {
    const straight = { ...DEFAULT_PARAMS, bottomSize: DEFAULT_PARAMS.topSize, rimFlare: 0 };
    const rings = buildRings(straight);
    expect(nestingPitch(rings, straight.wallWidth)).toBe(straight.height);
  });

  it('shrinks as the taper steepens — steeper walls nest deeper', () => {
    const gentle = computeMetrics({ ...DEFAULT_PARAMS, bottomSize: 84 });
    const steep = computeMetrics({ ...DEFAULT_PARAMS, bottomSize: 50 });
    expect(steep.nestingPitch).toBeLessThan(gentle.nestingPitch);
  });

  it('grows with wall thickness — a thick wall keeps the pots apart', () => {
    const thin = computeMetrics({ ...DEFAULT_PARAMS, mode: 'shell', wallThickness: 0.8 });
    const thick = computeMetrics({ ...DEFAULT_PARAMS, mode: 'shell', wallThickness: 3 });
    expect(thick.nestingPitch).toBeGreaterThan(thin.nestingPitch);
  });

  it('never claims a stack taller than the printer', () => {
    const m = computeMetrics(DEFAULT_PARAMS);
    const stack = DEFAULT_PARAMS.height + (m.nestingCount - 1) * m.nestingPitch;
    expect(stack).toBeLessThanOrEqual(STACK_LIMIT_MM + 1e-9);
  });
});
