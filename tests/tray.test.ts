import { describe, expect, it } from 'vitest';
import { buildMesh } from '../src/core/build';
import { type Mesh, meshBounds, meshVolume } from '../src/core/mesh';
import {
  DEFAULT_PARAMS,
  type Params,
  decodeParams,
  encodeParams,
  sanitizeParams,
  stlFileName,
} from '../src/core/params';
import { polygonArea } from '../src/core/profile';
import { buildTrayMesh, buildTrayRings, trayDimensions, trayMetrics } from '../src/core/tray';
import { validate } from '../src/core/validate';

const tray = (patch: Partial<Params> = {}): Params => ({
  ...DEFAULT_PARAMS,
  object: 'tray',
  // Coarse sampling keeps the manifold check quick; the topology is the same.
  seg: 128,
  ...patch,
});

/** Directed-edge report — see tests/mesh.test.ts for the reasoning. */
function manifoldReport(mesh: Mesh): { unmatched: number; duplicated: number } {
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
  let duplicated = 0;
  for (let t = 0; t < p.length; t += 9) {
    const a = idOf(t);
    const b = idOf(t + 3);
    const c = idOf(t + 6);
    for (const [u, v] of [[a, b], [b, c], [c, a]] as [number, number][]) {
      const key = `${u}>${v}`;
      if (seen.has(key)) duplicated++;
      seen.add(key);
      edges.push([u, v]);
    }
  }
  let unmatched = 0;
  for (const [u, v] of edges) if (!seen.has(`${v}>${u}`)) unmatched++;
  return { unmatched, duplicated };
}

/** Total area of the triangles lying entirely in the plane `z`. */
function areaAtLevel(mesh: Mesh, z: number): number {
  const p = mesh.positions;
  let sum = 0;
  for (let i = 0; i < p.length; i += 9) {
    if (p[i + 2] !== z || p[i + 5] !== z || p[i + 8] !== z) continue;
    const ux = p[i + 3]! - p[i]!;
    const uy = p[i + 4]! - p[i + 1]!;
    const vx = p[i + 6]! - p[i]!;
    const vy = p[i + 7]! - p[i + 1]!;
    sum += Math.abs(ux * vy - uy * vx) / 2;
  }
  return sum;
}

/** Widest half-extent of a ring along X — the half-size of a rounded square. */
function halfSize(pts: Float64Array): number {
  let max = 0;
  for (let i = 0; i < pts.length; i += 2) max = Math.max(max, Math.abs(pts[i]!));
  return max;
}

describe('tray mesh', () => {
  it('is a closed manifold with consistent winding', () => {
    const report = manifoldReport(buildTrayMesh(tray()));
    expect(report.duplicated).toBe(0);
    expect(report.unmatched).toBe(0);
  });

  it('stays manifold across the parameter corners', () => {
    const cases: Partial<Params>[] = [
      { trayFlare: 0 },
      { trayFlare: 15, trayClearance: 40 },
      { trayHeight: 5, trayWall: 5 },
      { trayHeight: 60, trayWall: 0.8, cornerR: 2 },
      { cornerR: 40, topSize: 200 },
      { seg: 64 },
    ];
    for (const patch of cases) {
      const mesh = buildTrayMesh(tray(patch));
      const report = manifoldReport(mesh);
      expect(report.duplicated, JSON.stringify(patch)).toBe(0);
      expect(report.unmatched, JSON.stringify(patch)).toBe(0);
      expect(meshVolume(mesh), JSON.stringify(patch)).toBeGreaterThan(0);
    }
  });

  it('has outward normals — divergence volume is strictly positive', () => {
    expect(meshVolume(buildTrayMesh(tray()))).toBeGreaterThan(0);
  });

  it('has a solid floor with no drainage holes', () => {
    const p = tray({ trayClearance: 10 });
    const mesh = buildTrayMesh(p);
    const rings = buildTrayRings(p);
    const d = trayDimensions(p);

    // The underside at z = 0 and the cavity floor at z = floorZ are each fully
    // covered by triangles: a hole would show up as missing area.
    expect(areaAtLevel(mesh, 0)).toBeCloseTo(polygonArea(rings[0]!.pts), 6);
    expect(areaAtLevel(mesh, d.floorZ)).toBeCloseTo(polygonArea(rings[3]!.pts), 6);
    expect(d.floorZ).toBeGreaterThan(0);
  });

  it('is a shallow dish, not a pot: cavity floor sits one wall above the plate', () => {
    const p = tray({ trayWall: 2, trayHeight: 20 });
    const b = meshBounds(buildTrayMesh(p));
    expect(b.min[2]).toBe(0);
    expect(b.max[2]).toBeCloseTo(20, 9);
    expect(trayDimensions(p).floorZ).toBeCloseTo(2, 9);
  });

  it('holds water: capacity grows with the wall height', () => {
    expect(trayMetrics(tray({ trayHeight: 40 })).capacityL).toBeGreaterThan(
      trayMetrics(tray({ trayHeight: 20 })).capacityL,
    );
    expect(trayMetrics(tray()).grams).toBeGreaterThan(0);
  });

  it('is what buildMesh dispatches to when the tray is selected', () => {
    expect(buildMesh(tray()).triangleCount).toBe(buildTrayMesh(tray()).triangleCount);
  });
});

describe('tray dimensions', () => {
  it('sizes the inside as the pot rim plus the clearance on each side', () => {
    for (const clearance of [0, 10, 25]) {
      const p = tray({ trayClearance: clearance });
      const d = trayDimensions(p);
      expect(d.innerWidth).toBe(p.topSize + 2 * clearance);

      // And the geometry actually follows the number: the cavity floor ring is
      // the last one in the stack.
      const floor = buildTrayRings(p)[3]!;
      expect(halfSize(floor.pts)).toBeCloseTo(d.innerWidth / 2, 6);
    }
  });

  it('sits exactly on the rim at zero clearance', () => {
    expect(trayDimensions(tray()).innerWidth).toBe(DEFAULT_PARAMS.topSize);
  });

  it('keeps the wall thickness between the two contours', () => {
    const p = tray({ trayWall: 2.5 });
    const d = trayDimensions(p);
    expect(d.outerWidth - d.innerWidth).toBeCloseTo(2 * 2.5, 9);
    expect(d.outerTopWidth - d.innerTopWidth).toBeCloseTo(2 * 2.5, 9);
  });

  it('splays the walls outward for stacking', () => {
    const d = trayDimensions(tray({ trayFlare: 3 }));
    expect(d.innerTopWidth - d.innerWidth).toBeCloseTo(2 * 3, 9);
  });
});

describe('validate — tray-tight', () => {
  const idsOf = (patch: Partial<Params>): string[] =>
    validate({ ...DEFAULT_PARAMS, ...patch }).map((w) => w.id);

  const ruleOf = (patch: Partial<Params>) =>
    validate({ ...DEFAULT_PARAMS, ...patch }).find((w) => w.id === 'tray-tight');

  it('fires below the 10 mm boundary and stays quiet at it', () => {
    expect(ruleOf({ object: 'tray', trayClearance: 9 })?.level).toBe('warning');
    expect(ruleOf({ object: 'tray', trayClearance: 10 })).toBeUndefined();
    expect(ruleOf({ object: 'tray', trayClearance: 25 })).toBeUndefined();
  });

  it('is a warning, not a blocker — the tray still prints', () => {
    const warnings = validate({ ...DEFAULT_PARAMS, object: 'tray', trayClearance: 0 });
    expect(warnings.every((w) => w.level !== 'error')).toBe(true);
  });

  it('says why, with the actual numbers', () => {
    const text = ruleOf({ object: 'tray', topSize: 90, trayClearance: 0 })!.text;
    expect(text).toContain('90');
    expect(text).toContain('110');
    expect(text).toMatch(/не сядет/);
  });

  it('does not fire while the pot is selected', () => {
    expect(idsOf({ trayClearance: 0 })).not.toContain('tray-tight');
    expect(validate(DEFAULT_PARAMS)).toEqual([]);
  });
});

describe('tray in the parameter codec', () => {
  it('round-trips the selected object through the URL hash', () => {
    const params: Params = {
      ...DEFAULT_PARAMS,
      object: 'tray',
      trayHeight: 35,
      trayWall: 2.4,
      trayClearance: 15,
      trayFlare: 5,
    };
    expect(encodeParams(params)).toContain('object=tray');
    expect(decodeParams(encodeParams(params))).toEqual(params);
  });

  it('keeps the pot as the default and emits nothing for it', () => {
    expect(DEFAULT_PARAMS.object).toBe('pot');
    expect(encodeParams({ ...DEFAULT_PARAMS })).toBe('');
    expect(sanitizeParams({ object: 'wat' }).object).toBe('pot');
    expect(sanitizeParams({ object: 'tray' }).object).toBe('tray');
  });

  it('names the file after the inner footprint', () => {
    expect(stlFileName({ ...DEFAULT_PARAMS, object: 'tray', trayClearance: 10 })).toBe(
      'tray_110x110x20.stl',
    );
    expect(stlFileName(DEFAULT_PARAMS)).toBe('pot_90x90x95_f32.stl');
  });
});
