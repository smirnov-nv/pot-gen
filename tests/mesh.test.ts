import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS, type Params, clampParam } from '../src/core/params';
import { buildVaseMesh, meshBounds, meshVolume, type Mesh } from '../src/core/mesh';

/**
 * Manifold check: every directed edge occurs exactly once and its reverse
 * exists. That is equivalent to "each edge belongs to exactly two triangles
 * with consistent orientation" for a closed surface.
 */
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
  let duplicated = 0;
  const edges: [number, number][] = [];
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
  for (const [u, v] of edges) {
    if (!seen.has(`${v}>${u}`)) unmatched++;
  }
  return { unmatched, duplicated };
}

/** Deterministic PRNG — a failing case must be reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random but printable parameter set, kept coarse so 20 of them stay fast. */
function randomParams(rnd: () => number): Params {
  const topSize = 50 + rnd() * 120;
  const pick = (key: keyof Params & string, v: number): number =>
    clampParam(key as never, v);
  return {
    ...DEFAULT_PARAMS,
    topSize: pick('topSize', topSize),
    bottomSize: pick('bottomSize', topSize * (0.5 + rnd() * 0.45)),
    height: pick('height', 40 + rnd() * 180),
    cornerR: pick('cornerR', 2 + rnd() * 20),
    flutes: pick('flutes', Math.round(rnd() * 60)),
    fluteAmp: pick('fluteAmp', rnd() * 2),
    rimH: pick('rimH', rnd() * 15),
    rimFlare: pick('rimFlare', rnd() * 3),
    twist: pick('twist', (rnd() - 0.5) * 2),
    seg: pick('seg', 64 + Math.round(rnd() * 3) * 32),
    dz: pick('dz', 1 + rnd()),
  };
}

describe('vase mesh', () => {
  it('is a closed manifold with consistent winding', () => {
    const report = manifoldReport(buildVaseMesh(DEFAULT_PARAMS));
    expect(report.duplicated).toBe(0);
    expect(report.unmatched).toBe(0);
  });

  it('stays manifold over 20 random parameter sets', () => {
    const rnd = mulberry32(20240727);
    for (let i = 0; i < 20; i++) {
      const params = randomParams(rnd);
      const report = manifoldReport(buildVaseMesh(params));
      expect(report.duplicated, `set ${i}: ${JSON.stringify(params)}`).toBe(0);
      expect(report.unmatched, `set ${i}: ${JSON.stringify(params)}`).toBe(0);
    }
  });

  it('has outward normals — divergence volume is strictly positive', () => {
    const rnd = mulberry32(7);
    for (let i = 0; i < 20; i++) {
      expect(meshVolume(buildVaseMesh(randomParams(rnd)))).toBeGreaterThan(0);
    }
  });

  it('sits on the build plate and matches the requested envelope', () => {
    const b = meshBounds(buildVaseMesh(DEFAULT_PARAMS));
    expect(b.min[2]).toBe(0);
    expect(b.max[2]).toBeCloseTo(DEFAULT_PARAMS.height, 9);
    // half width + flute crest + rim flare
    const halfMax = DEFAULT_PARAMS.topSize / 2 + DEFAULT_PARAMS.fluteAmp + DEFAULT_PARAMS.rimFlare + 0.5;
    expect(b.max[0]).toBeLessThan(halfMax);
    expect(b.max[0]).toBeGreaterThan(DEFAULT_PARAMS.topSize / 2);
  });

  it('scales the triangle count with seg and dz', () => {
    const coarse = buildVaseMesh({ ...DEFAULT_PARAMS, seg: 64, dz: 2 });
    const fine = buildVaseMesh({ ...DEFAULT_PARAMS, seg: 128, dz: 1 });
    expect(fine.triangleCount).toBeGreaterThan(coarse.triangleCount * 3);
  });

  it('encloses a volume close to the swept cross-sections', () => {
    // Sanity anchor: a truncated pyramid of the same footprints.
    const { topSize, bottomSize, height } = DEFAULT_PARAMS;
    const a = bottomSize ** 2;
    const b = topSize ** 2;
    const frustum = (height / 3) * (a + b + Math.sqrt(a * b));
    const v = meshVolume(buildVaseMesh({ ...DEFAULT_PARAMS, flutes: 0, rimH: 0 }));
    expect(v).toBeGreaterThan(frustum * 0.75);
    expect(v).toBeLessThan(frustum);
  });
});
