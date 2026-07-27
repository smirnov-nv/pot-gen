import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { BUILTIN_PRESETS, type Params } from '../src/core/params';
import { buildRings, polygonArea, polygonPerimeter } from '../src/core/profile';
import { meshArea, meshBounds, meshVolume, triangulateRings } from '../src/core/mesh';
import { parseBinarySTL, writeBinarySTL } from '../src/core/stl';
import p9 from './fixtures/p9.json';
import small from './fixtures/small.json';

/**
 * Golden tests of the potgen.py -> TypeScript port.
 *
 * Fixtures are produced by tests/fixtures/gen_fixtures.py inside the pinned
 * Python image (`make fixtures`). Regenerate them only when the reference
 * implementation itself changes.
 */

interface Fixture {
  id: string;
  params: Record<string, number>;
  rings: number;
  triangles: number;
  bounds: { min: number[]; max: number[] };
  volume: number;
  area: number;
  bottomPerimeter: number;
  bottomArea: number;
  topPerimeter: number;
  topArea: number;
  stlBytes: number;
  stlSha256: string;
  samples: { ring: number; z: number; points: number[][] }[];
}

/** Relative tolerance required by SPEC section 8. */
const REL_TOL = 1e-6;

/** potgen.py parameter name -> Params field. */
const PY_TO_TS: Record<string, keyof Params> = {
  top_size: 'topSize',
  bottom_size: 'bottomSize',
  height: 'height',
  corner_r: 'cornerR',
  flutes: 'flutes',
  flute_amp: 'fluteAmp',
  rim_h: 'rimH',
  rim_flare: 'rimFlare',
  twist: 'twist',
  seg: 'seg',
  dz: 'dz',
};

function expectClose(actual: number, expected: number, what: string): void {
  const scale = Math.max(1, Math.abs(expected));
  expect(Math.abs(actual - expected) / scale, `${what}: ${actual} vs ${expected}`).toBeLessThan(REL_TOL);
}

const fixtures: Fixture[] = [p9 as Fixture, small as Fixture];

describe.each(fixtures)('golden fixture $id', (fx) => {
  const preset = BUILTIN_PRESETS.find((p) => p.id === fx.id);
  if (!preset) throw new Error(`no built-in preset for fixture "${fx.id}"`);
  const params = preset.params;

  it('the built-in preset matches the reference preset', () => {
    for (const [pyKey, tsKey] of Object.entries(PY_TO_TS)) {
      expect(params[tsKey], `${pyKey} / ${String(tsKey)}`).toBe(fx.params[pyKey]);
    }
  });

  const rings = buildRings(params);
  const mesh = triangulateRings(rings);

  it('produces the same number of rings and triangles', () => {
    expect(rings.length).toBe(fx.rings);
    expect(mesh.triangleCount).toBe(fx.triangles);
  });

  it('matches the reference bounding box', () => {
    const b = meshBounds(mesh);
    for (let a = 0; a < 3; a++) {
      expectClose(b.min[a]!, fx.bounds.min[a]!, `bounds.min[${a}]`);
      expectClose(b.max[a]!, fx.bounds.max[a]!, `bounds.max[${a}]`);
    }
  });

  it('matches the reference volume and surface area', () => {
    expectClose(meshVolume(mesh), fx.volume, 'volume');
    expectClose(meshArea(mesh), fx.area, 'area');
  });

  it('matches the reference bottom and top contours', () => {
    const bottom = rings[0]!.pts;
    const top = rings[rings.length - 1]!.pts;
    expectClose(polygonPerimeter(bottom), fx.bottomPerimeter, 'bottomPerimeter');
    expectClose(polygonArea(bottom), fx.bottomArea, 'bottomArea');
    expectClose(polygonPerimeter(top), fx.topPerimeter, 'topPerimeter');
    expectClose(polygonArea(top), fx.topArea, 'topArea');
  });

  it('matches sampled contour points exactly enough to localise drift', () => {
    for (const sample of fx.samples) {
      const ring = rings[sample.ring]!;
      expectClose(ring.z, sample.z, `ring ${sample.ring} z`);
      const step = Math.max(1, (ring.pts.length / 2 / sample.points.length) | 0);
      sample.points.forEach((pt, i) => {
        const j = i * step;
        expectClose(ring.pts[j * 2]!, pt[0]!, `ring ${sample.ring} pt ${j}.x`);
        expectClose(ring.pts[j * 2 + 1]!, pt[1]!, `ring ${sample.ring} pt ${j}.y`);
      });
    }
  });

  it('writes an STL geometrically identical to the reference', () => {
    const buf = writeBinarySTL(mesh);
    expect(buf.byteLength).toBe(fx.stlBytes);

    // Byte equality is unreachable across runtimes: CPython's libm and V8
    // disagree by an ulp on cos/sin near the axes, which occasionally lands on
    // the neighbouring float32. Compare every coordinate instead, at float32
    // resolution -- which is what SPEC section 13 actually asks for.
    const reference = parseBinarySTL(
      gunzipSync(readFileSync(new URL(`./fixtures/${fx.id}.stl.gz`, import.meta.url))).buffer as ArrayBuffer,
    );
    const mine = parseBinarySTL(buf);
    expect(mine.triangleCount).toBe(reference.triangleCount);

    let worst = 0;
    for (let i = 0; i < reference.positions.length; i++) {
      const a = mine.positions[i]!;
      const b = reference.positions[i]!;
      const tol = REL_TOL * Math.max(1, Math.abs(b));
      const d = Math.abs(a - b);
      if (d > worst) worst = d;
      if (d > tol) {
        throw new Error(`coordinate ${i} differs: ${a} vs ${b} (tolerance ${tol})`);
      }
    }
    // A silent regression that stays inside tolerance but grows by orders of
    // magnitude is still worth catching.
    expect(worst).toBeLessThan(1e-4);
  });

  it('records the reference checksum for provenance', () => {
    const raw = gunzipSync(readFileSync(new URL(`./fixtures/${fx.id}.stl.gz`, import.meta.url)));
    expect(createHash('sha256').update(raw).digest('hex')).toBe(fx.stlSha256);
    expect(raw.byteLength).toBe(fx.stlBytes);
  });
});
