/**
 * Triangulation of the ring stack into a closed manifold solid, plus the
 * integral quantities used by the tests and the metrics panel.
 *
 * Vase mode deliberately produces a *solid*, not a thin shell: the slicer in
 * spiral-vase mode traces the outer contour of whatever it is given and
 * ignores the interior, so a solid is both simpler and immune to
 * self-intersecting inner walls.
 *
 * Triangles are stored as a soup — 9 doubles per triangle, no index buffer —
 * matching the STL format and the reference implementation one for one.
 *
 * @module core/mesh
 */

import type { Params } from './params';
import type { ProfileParams, Ring } from './profile';
import { buildRings } from './profile';

/** Triangle soup. `positions` holds `9 * triangleCount` doubles. */
export interface Mesh {
  /** Flat `[ax, ay, az, bx, by, bz, cx, cy, cz, …]`. */
  positions: Float64Array;
  /** Number of triangles. */
  triangleCount: number;
}

/** Axis-aligned bounding box, mm. */
export interface Bounds {
  min: [number, number, number];
  max: [number, number, number];
}

/**
 * Triangulates a ring stack into a closed solid.
 *
 * Side quads are split `(a, b, c)` / `(a, c, d)`, then a fan cap closes the
 * bottom and another closes the top. Winding is counter-clockwise seen from
 * outside, so every face normal points away from the body.
 *
 * @param rings - rings ordered bottom to top, all with the same point count
 * @returns closed manifold triangle soup
 * @throws {Error} if fewer than two rings are supplied
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { buildRings } from '@core/profile';
 * import { triangulateRings } from '@core/mesh';
 * const mesh = triangulateRings(buildRings(DEFAULT_PARAMS));
 * mesh.triangleCount > 0; // true
 * ```
 */
export function triangulateRings(rings: readonly Ring[]): Mesh {
  const nz = rings.length;
  if (nz < 2) throw new Error('triangulateRings needs at least two rings');
  const first = rings[0]!;
  const last = rings[nz - 1]!;
  const seg = first.pts.length / 2;

  const triangleCount = (nz - 1) * seg * 2 + 2 * seg;
  const positions = new Float64Array(triangleCount * 9);
  let o = 0;

  const push = (
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number,
    cx: number, cy: number, cz: number,
  ): void => {
    positions[o] = ax; positions[o + 1] = ay; positions[o + 2] = az;
    positions[o + 3] = bx; positions[o + 4] = by; positions[o + 5] = bz;
    positions[o + 6] = cx; positions[o + 7] = cy; positions[o + 8] = cz;
    o += 9;
  };

  for (let i = 0; i < nz - 1; i++) {
    const r0 = rings[i]!;
    const r1 = rings[i + 1]!;
    const { z: z0, pts: p0 } = r0;
    const { z: z1, pts: p1 } = r1;
    for (let j = 0; j < seg; j++) {
      const k = (j + 1) % seg;
      const ax = p0[j * 2]!, ay = p0[j * 2 + 1]!;
      const bx = p0[k * 2]!, by = p0[k * 2 + 1]!;
      const cx = p1[k * 2]!, cy = p1[k * 2 + 1]!;
      const dx = p1[j * 2]!, dy = p1[j * 2 + 1]!;
      push(ax, ay, z0, bx, by, z0, cx, cy, z1);
      push(ax, ay, z0, cx, cy, z1, dx, dy, z1);
    }
  }

  // Bottom cap: fan from the axis, wound the other way round so it faces down.
  const pb = first.pts;
  for (let j = 0; j < seg; j++) {
    const k = (j + 1) % seg;
    push(0, 0, first.z, pb[k * 2]!, pb[k * 2 + 1]!, first.z, pb[j * 2]!, pb[j * 2 + 1]!, first.z);
  }

  // Top cap.
  const pt = last.pts;
  for (let j = 0; j < seg; j++) {
    const k = (j + 1) % seg;
    push(0, 0, last.z, pt[j * 2]!, pt[j * 2 + 1]!, last.z, pt[k * 2]!, pt[k * 2 + 1]!, last.z);
  }

  return { positions, triangleCount };
}

/**
 * Builds the vase-mode mesh straight from parameters.
 *
 * @param p - shape parameters
 * @returns closed manifold triangle soup
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { buildVaseMesh } from '@core/mesh';
 * buildVaseMesh(DEFAULT_PARAMS).triangleCount; // 98304 + 512
 * ```
 */
export function buildVaseMesh(p: ProfileParams): Mesh {
  return triangulateRings(buildRings(p));
}

/**
 * Axis-aligned bounding box of a mesh.
 *
 * @param mesh - triangle soup
 * @returns min and max corner, mm
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { buildVaseMesh, meshBounds } from '@core/mesh';
 * meshBounds(buildVaseMesh(DEFAULT_PARAMS)).min[2]; // 0
 * ```
 */
export function meshBounds(mesh: Mesh): Bounds {
  const { positions } = mesh;
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      const v = positions[i + a]!;
      if (v < min[a]!) min[a] = v;
      if (v > max[a]!) max[a] = v;
    }
  }
  return { min, max };
}

/**
 * Enclosed volume via the divergence theorem.
 *
 * Positive means the winding is consistent and the normals point outwards —
 * which is exactly what the orientation test checks.
 *
 * @param mesh - closed triangle soup
 * @returns signed volume, mm³
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { buildVaseMesh, meshVolume } from '@core/mesh';
 * meshVolume(buildVaseMesh(DEFAULT_PARAMS)) > 0; // true
 * ```
 */
export function meshVolume(mesh: Mesh): number {
  const p = mesh.positions;
  let v = 0.0;
  for (let i = 0; i < p.length; i += 9) {
    const ax = p[i]!, ay = p[i + 1]!, az = p[i + 2]!;
    const bx = p[i + 3]!, by = p[i + 4]!, bz = p[i + 5]!;
    const cx = p[i + 6]!, cy = p[i + 7]!, cz = p[i + 8]!;
    v += (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6.0;
  }
  return v;
}

/**
 * Total surface area of a mesh.
 *
 * @param mesh - triangle soup
 * @returns area, mm²
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { buildVaseMesh, meshArea } from '@core/mesh';
 * meshArea(buildVaseMesh(DEFAULT_PARAMS)) > 0; // true
 * ```
 */
export function meshArea(mesh: Mesh): number {
  const p = mesh.positions;
  let s = 0.0;
  for (let i = 0; i < p.length; i += 9) {
    const ux = p[i + 3]! - p[i]!, uy = p[i + 4]! - p[i + 1]!, uz = p[i + 5]! - p[i + 2]!;
    const vx = p[i + 6]! - p[i]!, vy = p[i + 7]! - p[i + 1]!, vz = p[i + 8]! - p[i + 2]!;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    s += 0.5 * Math.hypot(nx, ny, nz);
  }
  return s;
}

/**
 * Converts a mesh to the `Float32Array` three.js wants for a
 * `BufferAttribute`.
 *
 * Geometry is computed in double precision and only narrowed here, so the
 * rounding happens once — the same single rounding the STL writer applies.
 *
 * @param mesh - triangle soup
 * @returns positions as float32
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { buildVaseMesh, toFloat32 } from '@core/mesh';
 * toFloat32(buildVaseMesh(DEFAULT_PARAMS)).BYTES_PER_ELEMENT; // 4
 * ```
 */
export function toFloat32(mesh: Mesh): Float32Array {
  return Float32Array.from(mesh.positions);
}

/**
 * Estimated vertex count for the given parameters, without building anything.
 *
 * Used by the validator to warn about heavy meshes before the worker spends
 * a second on them.
 *
 * @param p - parameters carrying `seg`, `height` and `dz`
 * @returns number of mesh vertices
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { estimateVertexCount } from '@core/mesh';
 * estimateVertexCount(DEFAULT_PARAMS) > 0; // true
 * ```
 */
export function estimateVertexCount(p: Pick<Params, 'seg' | 'height' | 'dz'>): number {
  const nz = Math.max(2, Math.round(p.height / p.dz) + 1);
  return nz * Math.round(p.seg);
}
