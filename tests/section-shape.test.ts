import { describe, expect, it } from 'vitest';
import { buildShellMesh } from '../src/core/shell';
import { buildVaseMesh, meshBounds, type Mesh } from '../src/core/mesh';
import { drainPoints } from '../src/core/drainage';
import { computeMetrics } from '../src/core/metrics';
import {
  DEFAULT_PARAMS,
  decodeParams,
  encodeParams,
  sanitizeParams,
  sectionSizes,
  stlFileName,
  type Params,
  type SectionShape,
} from '../src/core/params';
import {
  buildRings,
  polygonArea,
  polygonPerimeter,
  sectionOutline,
  superellipse,
} from '../src/core/profile';
import { validate } from '../src/core/validate';

/**
 * Non-square cross-sections: rectangle, circle and oval.
 *
 * The square case is covered by the golden fixtures — the point of most of
 * these tests is that the generalisation did not disturb it, and that the new
 * shapes come out with the dimensions that were actually asked for.
 */

/** Parameters with the section replaced, sizes given as full widths. */
function shaped(shape: SectionShape, x: number, y: number, patch: Partial<Params> = {}): Params {
  return {
    ...DEFAULT_PARAMS,
    shape,
    topSize: x,
    bottomSize: x - 22,
    topSizeY: y,
    bottomSizeY: y - 22,
    ...patch,
  };
}

/**
 * Manifold check: every directed edge occurs exactly once and its reverse
 * exists — a closed surface with consistent winding.
 */
function unmatchedEdges(mesh: Mesh): number {
  const p = mesh.positions;
  const ids = new Map<string, number>();
  const idOf = (i: number): number => {
    const key = `${p[i]!},${p[i + 1]!},${p[i + 2]!}`;
    let id = ids.get(key);
    if (id === undefined) {
      id = ids.size;
      ids.set(key, id);
    }
    return id;
  };

  const seen = new Set<string>();
  const edges: [number, number][] = [];
  for (let t = 0; t < p.length; t += 9) {
    const [a, b, c] = [idOf(t), idOf(t + 3), idOf(t + 6)];
    for (const [u, v] of [[a, b], [b, c], [c, a]] as [number, number][]) {
      seen.add(`${u}>${v}`);
      edges.push([u, v]);
    }
  }
  return edges.filter(([u, v]) => !seen.has(`${v}>${u}`)).length;
}

describe('sectionOutline', () => {
  it('reproduces the square sampling exactly', () => {
    // The golden fixtures live or die by this: the generalised sampler must be
    // bit-identical to the original one on the default shape.
    expect([...sectionOutline('square', 45, 45, 10)]).toEqual([...superellipse(45, 10)]);
  });

  it('draws a circle of the requested radius', () => {
    const pts = sectionOutline('circle', 45, 45, 10, 720);
    expect(polygonArea(pts)).toBeCloseTo(Math.PI * 45 * 45, 0);
    expect(polygonPerimeter(pts)).toBeCloseTo(2 * Math.PI * 45, 0);
  });

  it('draws an ellipse with the requested semi-axes', () => {
    const pts = sectionOutline('oval', 45, 30, 10, 720);
    expect(polygonArea(pts)).toBeCloseTo(Math.PI * 45 * 30, 0);
  });

  it('ignores the corner radius on round shapes', () => {
    const sharp = sectionOutline('circle', 45, 45, 2);
    const blunt = sectionOutline('circle', 45, 45, 40);
    expect([...sharp]).toEqual([...blunt]);
  });

  it('keeps a rounded rectangle inside its bounding box', () => {
    const pts = sectionOutline('rect', 70, 30, 8, 720);
    for (let i = 0; i < pts.length; i += 2) {
      expect(Math.abs(pts[i]!)).toBeLessThanOrEqual(70 + 1e-9);
      expect(Math.abs(pts[i + 1]!)).toBeLessThanOrEqual(30 + 1e-9);
    }
    // A rounded rectangle fills more of its box than the inscribed ellipse.
    expect(polygonArea(pts)).toBeGreaterThan(Math.PI * 70 * 30);
  });
});

describe('rings', () => {
  it('tapers both axes independently', () => {
    // Smooth wall: the fluting would add its amplitude on top of the taper.
    const p = shaped('rect', 140, 70, { flutes: 0, fluteAmp: 0 });
    const rings = buildRings(p);
    const bottom = rings[0]!.pts;
    const bx = Math.max(...[...bottom].filter((_, i) => i % 2 === 0));
    const by = Math.max(...[...bottom].filter((_, i) => i % 2 === 1));

    expect(bx).toBeCloseTo(118 / 2, 1);
    expect(by).toBeCloseTo(48 / 2, 1);
  });

  it('flares the rim by the same millimetres on both axes', () => {
    const p = shaped('rect', 140, 70, { flutes: 0, fluteAmp: 0 });
    const rings = buildRings(p);
    const rim = rings[rings.length - 1]!.pts;
    const rx = Math.max(...[...rim].filter((_, i) => i % 2 === 0));
    const ry = Math.max(...[...rim].filter((_, i) => i % 2 === 1));

    // rimFlare is an absolute offset: both axes grow by it, not by a ratio.
    expect(rx - 140 / 2).toBeCloseTo(p.rimFlare, 2);
    expect(ry - 70 / 2).toBeCloseTo(p.rimFlare, 2);
  });

  it('ignores the Y sizes on the linked shapes', () => {
    const linked = buildRings({ ...DEFAULT_PARAMS, shape: 'square', topSizeY: 200, bottomSizeY: 190 });
    const plain = buildRings(DEFAULT_PARAMS);
    expect([...linked[0]!.pts]).toEqual([...plain[0]!.pts]);
  });
});

describe('meshes', () => {
  const cases: [SectionShape, number, number][] = [
    ['square', 90, 90],
    ['rect', 140, 70],
    ['circle', 90, 90],
    ['oval', 140, 70],
  ];

  it.each(cases)('builds a closed vase mesh for %s', (shape, x, y) => {
    const mesh = buildVaseMesh(shaped(shape, x, y));
    expect(mesh.triangleCount).toBeGreaterThan(0);
    expect(unmatchedEdges(mesh)).toBe(0);
  });

  it.each(cases)('builds a closed shell mesh for %s', (shape, x, y) => {
    const mesh = buildShellMesh(shaped(shape, x, y, { mode: 'shell' }));
    expect(unmatchedEdges(mesh)).toBe(0);
  });

  it('lands on the requested footprint', () => {
    const b = meshBounds(buildVaseMesh(shaped('oval', 140, 70, { flutes: 0, fluteAmp: 0 })));
    // The rim flare is the widest point of the pot.
    expect(b.max[0]! - b.min[0]!).toBeCloseTo(140 + 2 * DEFAULT_PARAMS.rimFlare, 1);
    expect(b.max[1]! - b.min[1]!).toBeCloseTo(70 + 2 * DEFAULT_PARAMS.rimFlare, 1);
  });
});

describe('metrics', () => {
  it('measures the flute period on the actual outline', () => {
    // A circle is π/4 of the square's perimeter, so its waves are that much
    // shorter — measuring on the square would let an unprintable one through.
    const circle = computeMetrics(shaped('circle', 90, 90));
    const square = computeMetrics(shaped('square', 90, 90));
    expect(circle.flutePeriod).toBeLessThan(square.flutePeriod);
    expect(circle.flutePeriod / square.flutePeriod).toBeCloseTo(Math.PI / 4, 1);
  });

  it('reports the steeper of the two wall angles', () => {
    const p = shaped('rect', 140, 70, { bottomSize: 80, bottomSizeY: 66 });
    // X falls 30 mm per side, Y only 2 — the X wall is the one that overhangs.
    const expected = (Math.atan2(30, p.height) * 180) / Math.PI;
    expect(computeMetrics(p).wallAngleDeg).toBeCloseTo(expected, 3);
  });
});

describe('drainage', () => {
  it('stretches the hole ring with an elongated bottom', () => {
    const holes = drainPoints(shaped('oval', 160, 70, { drainHoles: 4 }));
    const xs = holes.map((h) => Math.abs(h.x));
    const ys = holes.map((h) => Math.abs(h.y));
    expect(Math.max(...xs)).toBeGreaterThan(Math.max(...ys));
  });
});

describe('validation', () => {
  it('catches an inverted taper on the Y axis alone', () => {
    const p = shaped('rect', 140, 70, { bottomSizeY: 90 });
    expect(validate(p).some((w) => w.id === 'inverted-taper' && w.level === 'error')).toBe(true);
  });

  it('warns about an extremely elongated section', () => {
    expect(validate(shaped('rect', 180, 50)).some((w) => w.id === 'aspect-extreme')).toBe(true);
    expect(validate(shaped('rect', 120, 90)).some((w) => w.id === 'aspect-extreme')).toBe(false);
  });

  it('does not blame the corner radius on a round section', () => {
    const patch = { cornerR: 40, bottomSize: 60, bottomSizeY: 60 };
    expect(validate(shaped('circle', 90, 90, patch)).some((w) => w.id === 'corner-collapse')).toBe(
      false,
    );
    expect(validate(shaped('square', 90, 90, patch)).some((w) => w.id === 'corner-collapse')).toBe(
      true,
    );
  });
});

describe('parameters', () => {
  it('links the Y sizes to X unless the shape is anisotropic', () => {
    const p = { ...DEFAULT_PARAMS, topSizeY: 150, bottomSizeY: 140 };
    expect(sectionSizes({ ...p, shape: 'square' }).topHalfY).toBe(p.topSize / 2);
    expect(sectionSizes({ ...p, shape: 'circle' }).topHalfY).toBe(p.topSize / 2);
    expect(sectionSizes({ ...p, shape: 'oval' }).topHalfY).toBe(75);
  });

  it('round-trips the shape through the URL hash', () => {
    const p = shaped('oval', 140, 70);
    const decoded = decodeParams(encodeParams(p));
    expect(decoded.shape).toBe('oval');
    expect(decoded.topSizeY).toBe(70);
    expect(encodeParams(DEFAULT_PARAMS)).not.toContain('shape=');
  });

  it('falls back to the default shape on garbage input', () => {
    expect(sanitizeParams({ shape: 'trapezoid' }).shape).toBe('square');
    expect(sanitizeParams({ shape: 'oval' }).shape).toBe('oval');
  });

  it('names the file after both axes', () => {
    expect(stlFileName(shaped('rect', 140, 70))).toContain('pot_140x70x95');
    expect(stlFileName(DEFAULT_PARAMS)).toBe('pot_90x90x95_f32.stl');
  });
});
