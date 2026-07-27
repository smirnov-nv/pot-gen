/**
 * Cross-section geometry: superellipse, arc-length resampling, fluting and
 * the vertical profile.
 *
 * Direct port of `potgen.py` — the algorithm is reproduced step for step,
 * including the order of operations, because the golden tests compare the
 * output of both implementations. Do not "clean up" the maths here without
 * regenerating the fixtures.
 *
 * Points are stored flat as `[x0, y0, x1, y1, …]` in `Float64Array`s: a
 * 1024-point section over a 250 mm pot is half a million points, and arrays of
 * tuples cost an allocation each.
 *
 * @module core/profile
 */

import type { Params } from './params';

/** One horizontal slice of the pot. */
export interface Ring {
  /** Height of the slice above the build plate, mm. */
  z: number;
  /** Flat `[x, y, …]` contour, counter-clockwise seen from above. */
  pts: Float64Array;
}

/** Points in the dense superellipse sampling before resampling. */
const DENSE_SAMPLES = 720;

/**
 * Dense sampling of a rounded square as a superellipse.
 *
 * ```text
 * x = a · sign(cos t) · |cos t|^(2/k)
 * y = a · sign(sin t) · |sin t|^(2/k)
 * k = max(2.5, 2a / corner_r)
 * ```
 *
 * The exponent is picked so the corner curvature roughly matches `cornerR`;
 * the 2.5 floor keeps the section from degenerating into a circle-ish blob
 * when the requested radius is large relative to the pot.
 *
 * @param a - half width of the section, mm
 * @param cornerR - corner radius, mm (floored at 0.5 to keep `k` finite)
 * @param n - number of samples in the dense pass
 * @returns flat `[x, y, …]` array of `n` points, counter-clockwise
 *
 * @example
 * ```ts
 * import { superellipse } from '@core/profile';
 * const pts = superellipse(45, 10);
 * pts.length; // 1440
 * ```
 */
export function superellipse(a: number, cornerR: number, n: number = DENSE_SAMPLES): Float64Array {
  const k = Math.max(2.5, (2.0 * a) / Math.max(cornerR, 0.5));
  const e = 2.0 / k;
  const out = new Float64Array(n * 2);
  for (let i = 0; i < n; i++) {
    const t = (2.0 * Math.PI * i) / n;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = a * Math.pow(Math.abs(c), e);
    const y = a * Math.pow(Math.abs(s), e);
    out[i * 2] = c < 0 ? -x : x;
    out[i * 2 + 1] = s < 0 ? -y : y;
  }
  return out;
}

/**
 * Resamples a closed polyline to `m` evenly spaced points.
 *
 * Mandatory, not cosmetic: uniform angular sampling of a superellipse
 * clusters points in the corners, which makes the fluting wavelength vary
 * around the perimeter and the corners come out mushy.
 *
 * @param pts - flat `[x, y, …]` closed contour
 * @param m - number of output points
 * @returns flat `[x, y, …]` array of `m` points spaced evenly by arc length
 *
 * @example
 * ```ts
 * import { resampleByArcLength, superellipse } from '@core/profile';
 * const even = resampleByArcLength(superellipse(45, 10), 256);
 * even.length; // 512
 * ```
 */
export function resampleByArcLength(pts: Float64Array, m: number): Float64Array {
  const n = pts.length / 2;
  const seglen = new Float64Array(n);
  let total = 0.0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const d = Math.hypot(pts[j * 2]! - pts[i * 2]!, pts[j * 2 + 1]! - pts[i * 2 + 1]!);
    seglen[i] = d;
    total += d;
  }

  const out = new Float64Array(m * 2);
  const step = total / m;
  let target = 0.0;
  let acc = 0.0;
  let i = 0;
  for (let q = 0; q < m; q++) {
    while (acc + seglen[i]! < target) {
      acc += seglen[i]!;
      i = (i + 1) % n;
    }
    const r = seglen[i]! > 0 ? (target - acc) / seglen[i]! : 0.0;
    const j = (i + 1) % n;
    out[q * 2] = pts[i * 2]! + (pts[j * 2]! - pts[i * 2]!) * r;
    out[q * 2 + 1] = pts[i * 2 + 1]! + (pts[j * 2 + 1]! - pts[i * 2 + 1]!) * r;
    target += step;
  }
  return out;
}

/**
 * One cross-section: resampled rounded square with the fluting applied along
 * the outward normal.
 *
 * The offset is `d(s) = fluteAmp · cos(2π · flutes · s)` with `s = j / seg`.
 * With `flutes` a multiple of four the wave keeps the 4-fold symmetry of the
 * square and the corners land on a crest, which is where the extra stiffness
 * is worth the most.
 *
 * @param halfSize - half width of the section, mm
 * @param cornerR - corner radius at this height, mm
 * @param flutes - number of waves around the perimeter; `<= 0` disables
 * @param fluteAmp - radial amplitude at this height, mm; `0` disables
 * @param seg - points in the output contour
 * @returns flat `[x, y, …]` contour of `seg` points
 *
 * @example
 * ```ts
 * import { baseProfile } from '@core/profile';
 * const section = baseProfile(45, 10, 32, 1.1, 256);
 * section.length; // 512
 * ```
 */
export function baseProfile(
  halfSize: number,
  cornerR: number,
  flutes: number,
  fluteAmp: number,
  seg: number,
): Float64Array {
  const pts = resampleByArcLength(superellipse(halfSize, cornerR), seg);
  if (flutes <= 0 || fluteAmp === 0.0) return pts;

  const out = new Float64Array(seg * 2);
  for (let j = 0; j < seg; j++) {
    const jp = (j + 1) % seg;
    const jm = (j - 1 + seg) % seg;
    const x = pts[j * 2]!;
    const y = pts[j * 2 + 1]!;
    // Central difference gives the tangent; rotating it by -90° gives the
    // outward normal for a counter-clockwise contour.
    const tx = pts[jp * 2]! - pts[jm * 2]!;
    const ty = pts[jp * 2 + 1]! - pts[jm * 2 + 1]!;
    const tl = Math.hypot(tx, ty) || 1.0;
    const nx = ty / tl;
    const ny = -tx / tl;
    const s = j / seg;
    const d = fluteAmp * Math.cos(2.0 * Math.PI * flutes * s);
    out[j * 2] = x + nx * d;
    out[j * 2 + 1] = y + ny * d;
  }
  return out;
}

/** Subset of {@link Params} the ring builder actually reads. */
export type ProfileParams = Pick<
  Params,
  'topSize' | 'bottomSize' | 'height' | 'cornerR' | 'flutes' | 'fluteAmp' | 'rimH' | 'rimFlare' | 'twist' | 'seg' | 'dz'
>;

/**
 * Builds the stack of cross-sections describing the outer surface.
 *
 * Per height: linear taper between `bottomSize` and `topSize`, corner radius
 * and flute amplitude scaled by the section size (otherwise nesting skews),
 * a quadratic rim flare over the last `rimH` mm, and an optional twist.
 *
 * @param p - shape parameters
 * @returns rings ordered bottom to top, `z[0] = 0`
 * @throws {Error} never — out-of-range input is clamped by the caller
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { buildRings } from '@core/profile';
 * const rings = buildRings(DEFAULT_PARAMS);
 * rings[0]!.z; // 0
 * ```
 */
export function buildRings(p: ProfileParams): Ring[] {
  const seg = Math.max(3, Math.round(p.seg));
  const nz = Math.max(2, Math.round(p.height / p.dz) + 1);
  const rings: Ring[] = new Array<Ring>(nz);

  for (let i = 0; i < nz; i++) {
    const z = (p.height * i) / (nz - 1);
    const f = z / p.height;
    const half = 0.5 * (p.bottomSize + (p.topSize - p.bottomSize) * f);
    // Corner radius and flute amplitude scale with the section: a constant
    // radius would make the lower sections proportionally rounder and the
    // stack of nested pots would sit crooked.
    const cr = p.cornerR * (half / (0.5 * p.topSize));
    const amp = p.fluteAmp * (half / (0.5 * p.topSize));

    const prof = baseProfile(half, cr, p.flutes, amp, seg);

    if (p.rimH > 0 && z > p.height - p.rimH) {
      // Quadratic so the lip leaves the wall tangentially instead of with a
      // visible crease; g² also keeps the very first flared layer tiny.
      const g = (z - (p.height - p.rimH)) / p.rimH;
      const scale = (half + p.rimFlare * g * g) / half;
      for (let j = 0; j < prof.length; j++) prof[j] = prof[j]! * scale;
    }

    if (p.twist) {
      const a = (Math.PI / 180) * (p.twist * z);
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      for (let j = 0; j < seg; j++) {
        const x = prof[j * 2]!;
        const y = prof[j * 2 + 1]!;
        prof[j * 2] = x * ca - y * sa;
        prof[j * 2 + 1] = x * sa + y * ca;
      }
    }

    rings[i] = { z, pts: prof };
  }
  return rings;
}

/**
 * Area of a closed polygon via the shoelace formula.
 *
 * @param pts - flat `[x, y, …]` contour
 * @returns unsigned area, mm²
 *
 * @example
 * ```ts
 * import { polygonArea } from '@core/profile';
 * polygonArea(new Float64Array([0, 0, 2, 0, 2, 2, 0, 2])); // 4
 * ```
 */
export function polygonArea(pts: Float64Array): number {
  const n = pts.length / 2;
  let a = 0.0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += pts[i * 2]! * pts[j * 2 + 1]! - pts[j * 2]! * pts[i * 2 + 1]!;
  }
  return Math.abs(a) * 0.5;
}

/**
 * Perimeter of a closed polygon.
 *
 * @param pts - flat `[x, y, …]` contour
 * @returns length, mm
 *
 * @example
 * ```ts
 * import { polygonPerimeter } from '@core/profile';
 * polygonPerimeter(new Float64Array([0, 0, 2, 0, 2, 2, 0, 2])); // 8
 * ```
 */
export function polygonPerimeter(pts: Float64Array): number {
  const n = pts.length / 2;
  let per = 0.0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    per += Math.hypot(pts[j * 2]! - pts[i * 2]!, pts[j * 2 + 1]! - pts[i * 2 + 1]!);
  }
  return per;
}
