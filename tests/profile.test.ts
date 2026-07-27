import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS } from '../src/core/params';
import {
  baseProfile,
  buildRings,
  polygonArea,
  polygonPerimeter,
  resampleByArcLength,
  superellipse,
} from '../src/core/profile';

/** Segment lengths of a closed flat contour. */
function segmentLengths(pts: Float64Array): number[] {
  const n = pts.length / 2;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    out.push(Math.hypot(pts[j * 2]! - pts[i * 2]!, pts[j * 2 + 1]! - pts[i * 2 + 1]!));
  }
  return out;
}

describe('superellipse', () => {
  it('stays inside the bounding square and touches its middles', () => {
    const pts = superellipse(45, 10);
    let maxX = 0;
    for (let i = 0; i < pts.length; i += 2) {
      maxX = Math.max(maxX, Math.abs(pts[i]!), Math.abs(pts[i + 1]!));
    }
    expect(maxX).toBeCloseTo(45, 9);
  });

  it('is 4-fold symmetric', () => {
    const n = 720;
    const pts = superellipse(45, 10, n);
    // Tolerance is 0.02 mm, not float noise: the exponent 2/k < 1 amplifies
    // the ~6e-17 residue of cos(pi/2) into ~1e-2 mm on the axis samples. It is
    // a property of the parametrisation, not an error -- the resampling pass
    // moves the points off the axis anyway.
    for (let i = 0; i < n / 4; i++) {
      const j = i + n / 4;
      // rotating by 90 deg maps (x, y) -> (-y, x)
      expect(Math.abs(pts[j * 2]! + pts[i * 2 + 1]!)).toBeLessThan(0.02);
      expect(Math.abs(pts[j * 2 + 1]! - pts[i * 2]!)).toBeLessThan(0.02);
    }
  });

  it('gets squarer as the corner radius shrinks', () => {
    const round = polygonArea(superellipse(45, 40));
    const square = polygonArea(superellipse(45, 2));
    expect(square).toBeGreaterThan(round);
    expect(square).toBeLessThanOrEqual(90 * 90);
  });
});

describe('resampleByArcLength', () => {
  it('spreads segment lengths within 1 %', () => {
    const pts = resampleByArcLength(superellipse(45, 10), 256);
    const lens = segmentLengths(pts);
    const min = Math.min(...lens);
    const max = Math.max(...lens);
    expect((max - min) / max).toBeLessThan(0.01);
  });

  it('is what fixes the clustering — raw sampling is far worse', () => {
    const raw = segmentLengths(superellipse(45, 10, 256));
    const spread = (Math.max(...raw) - Math.min(...raw)) / Math.max(...raw);
    expect(spread).toBeGreaterThan(0.5);
  });

  it('preserves perimeter and area to a fraction of a percent', () => {
    const dense = superellipse(45, 10);
    const even = resampleByArcLength(dense, 256);
    expect(polygonPerimeter(even) / polygonPerimeter(dense)).toBeCloseTo(1, 3);
    expect(polygonArea(even) / polygonArea(dense)).toBeCloseTo(1, 3);
  });

  it('returns exactly the requested number of points', () => {
    for (const m of [64, 100, 256, 1024]) {
      expect(resampleByArcLength(superellipse(45, 10), m).length).toBe(m * 2);
    }
  });
});

describe('baseProfile', () => {
  it('returns the plain section when fluting is off', () => {
    const plain = baseProfile(45, 10, 0, 1.1, 128);
    const zeroAmp = baseProfile(45, 10, 32, 0, 128);
    expect(Array.from(plain)).toEqual(Array.from(zeroAmp));
  });

  it('keeps 4-fold symmetry when the wave count is a multiple of four', () => {
    const seg = 256;
    const pts = baseProfile(45, 10, 32, 1.1, seg);
    for (let i = 0; i < seg / 4; i++) {
      const j = i + seg / 4;
      expect(pts[j * 2]!).toBeCloseTo(-pts[i * 2 + 1]!, 6);
      expect(pts[j * 2 + 1]!).toBeCloseTo(pts[i * 2]!, 6);
    }
  });

  it('loses that symmetry when it is not — which is why the step is 4', () => {
    const seg = 256;
    const pts = baseProfile(45, 10, 30, 1.1, seg);
    let worst = 0;
    for (let i = 0; i < seg / 4; i++) {
      const j = i + seg / 4;
      worst = Math.max(worst, Math.abs(pts[j * 2]! + pts[i * 2 + 1]!));
    }
    expect(worst).toBeGreaterThan(0.1);
  });

  it('offsets by at most the amplitude', () => {
    const plain = baseProfile(45, 10, 0, 0, 256);
    const fluted = baseProfile(45, 10, 32, 1.1, 256);
    for (let i = 0; i < plain.length; i += 2) {
      const d = Math.hypot(fluted[i]! - plain[i]!, fluted[i + 1]! - plain[i + 1]!);
      expect(d).toBeLessThanOrEqual(1.1 + 1e-9);
    }
  });
});

describe('buildRings', () => {
  it('starts at z = 0 and ends at the requested height', () => {
    const rings = buildRings(DEFAULT_PARAMS);
    expect(rings[0]!.z).toBe(0);
    expect(rings[rings.length - 1]!.z).toBeCloseTo(DEFAULT_PARAMS.height, 12);
  });

  it('tapers: every ring is wider than the one below it', () => {
    const rings = buildRings({ ...DEFAULT_PARAMS, flutes: 0, rimH: 0 });
    let prev = 0;
    for (const ring of rings) {
      const area = polygonArea(ring.pts);
      expect(area).toBeGreaterThan(prev);
      prev = area;
    }
  });

  it('flares the rim outward over the last rimH mm only', () => {
    const flared = buildRings(DEFAULT_PARAMS);
    const straight = buildRings({ ...DEFAULT_PARAMS, rimFlare: 0 });
    const belowRim = flared.findIndex((r) => r.z > DEFAULT_PARAMS.height - DEFAULT_PARAMS.rimH) - 1;
    expect(polygonArea(flared[belowRim]!.pts)).toBeCloseTo(polygonArea(straight[belowRim]!.pts), 9);
    const top = flared.length - 1;
    expect(polygonArea(flared[top]!.pts)).toBeGreaterThan(polygonArea(straight[top]!.pts));
  });

  it('twists rings proportionally to height', () => {
    const twist = 1;
    const rings = buildRings({ ...DEFAULT_PARAMS, twist, flutes: 0 });
    const top = rings[rings.length - 1]!;
    const plain = buildRings({ ...DEFAULT_PARAMS, twist: 0, flutes: 0 });
    const topPlain = plain[plain.length - 1]!;
    const angle = (Math.PI / 180) * twist * top.z;
    expect(top.pts[0]!).toBeCloseTo(
      topPlain.pts[0]! * Math.cos(angle) - topPlain.pts[1]! * Math.sin(angle),
      9,
    );
  });

  it('honours the dz sampling step', () => {
    expect(buildRings({ ...DEFAULT_PARAMS, height: 100, dz: 0.5 }).length).toBe(201);
    expect(buildRings({ ...DEFAULT_PARAMS, height: 100, dz: 2 }).length).toBe(51);
  });
});
