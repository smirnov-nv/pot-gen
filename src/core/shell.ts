/**
 * Shell mode: a real thin-walled pot.
 *
 * Vase mode gives one pot per print. This mode gives a model that slices as
 * an ordinary object — two perimeters, no infill — so nine of them fit on the
 * plate at once. For a batch of a hundred that is the whole difference.
 *
 * The body is: outer surface, inner surface offset inward, a bottom slab of
 * its own thickness, real drainage holes through that slab, and optional
 * vertical slots through the wall for air pruning.
 *
 * @module core/shell
 */

import { drainPoints, drainRingRadius } from './drainage';
import type { Mesh } from './mesh';
import type { Params } from './params';
import { triangulateWithHoles } from './polygon';
import type { Ring } from './profile';
import {
  buildRings,
  polygonPerimeter,
  ringCount,
  ringGeometryAt,
  rotateInPlace,
  sectionProfile,
} from './profile';

/** Points per drainage-hole circle. Smooth enough at 5 mm, cheap enough. */
const HOLE_SEGMENTS = 24;

/** Smallest cavity half-width the generator will produce, mm. */
const MIN_CAVITY_HALF = 1;

/** Growable triangle soup. */
class TriangleSink {
  private readonly data: number[] = [];

  tri(a: readonly number[], b: readonly number[], c: readonly number[]): void {
    this.data.push(a[0]!, a[1]!, a[2]!, b[0]!, b[1]!, b[2]!, c[0]!, c[1]!, c[2]!);
  }

  /** Quad `a→b→c→d`, split along `a–c`. */
  quad(a: readonly number[], b: readonly number[], c: readonly number[], d: readonly number[]): void {
    this.tri(a, b, c);
    this.tri(a, c, d);
  }

  finish(): Mesh {
    const positions = Float64Array.from(this.data);
    return { positions, triangleCount: positions.length / 9 };
  }
}

/** A circle contour, counter-clockwise. */
function circle(cx: number, cy: number, r: number, n = HOLE_SEGMENTS): Float64Array {
  const out = new Float64Array(n * 2);
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    out[i * 2] = cx + r * Math.cos(a);
    out[i * 2 + 1] = cy + r * Math.sin(a);
  }
  return out;
}

/**
 * Inner (cavity) contour at one height.
 *
 * The offset is `wallThickness + fluteAmp`, not `wallThickness`: the fluting
 * pushes the outer surface *in* by the amplitude in every trough, so an
 * offset of the wall thickness alone would leave paper there. With this
 * offset the thinnest spot is exactly the requested thickness and the crests
 * are thicker.
 *
 * The cavity is smooth — the fluting is a stiffener for the outside, and
 * copying it inward would only make the wall harder to slice.
 */
function innerContour(p: Params, z: number, seg: number): Float64Array {
  const g = ringGeometryAt(p, z);
  const outerHalf = g.half * g.flareScale;
  const outerHalfY = g.halfY * g.flareScaleY;
  const offset = p.wallThickness + g.fluteAmp * g.flareScale;
  const half = Math.max(MIN_CAVITY_HALF, outerHalf - offset);
  const halfY = Math.max(MIN_CAVITY_HALF, outerHalfY - offset);
  // The radius shrinks with the wall, and on an anisotropic section the axis
  // that lost the larger share of itself sets the amount.
  const shrink = Math.min(half / outerHalf, halfY / outerHalfY);
  const cornerR = Math.max(0.5, g.cornerR * g.flareScale * shrink);
  const pts = sectionProfile({
    shape: p.shape,
    halfX: half,
    halfY,
    cornerR,
    flutes: 0,
    fluteAmp: 0,
    seg,
  });
  if (g.twistAngle !== 0) rotateInPlace(pts, g.twistAngle);
  return pts;
}

/** Point `j` of a ring as an `[x, y, z]` tuple. */
function at(ring: Ring, j: number): [number, number, number] {
  return [ring.pts[j * 2]!, ring.pts[j * 2 + 1]!, ring.z];
}

/** Slot occupancy of the wall grid. */
interface SlotMask {
  /** True when the cell between rings `i`/`i+1` and points `j`/`j+1` is cut out. */
  cut: (i: number, j: number) => boolean;
  /** Whether any slot exists at all. */
  any: boolean;
}

/**
 * Builds the slot mask.
 *
 * Slots are whole cells of the wall grid: snapping them to the sampling grid
 * keeps the mesh manifold without a boolean operation, at the cost of the
 * width and height landing on the nearest `dz` / segment boundary.
 */
function slotMask(p: Params, rings: readonly Ring[], seg: number, floorIndex: number): SlotMask {
  const count = Math.round(p.slots);
  if (count <= 0 || p.slotHeight <= 0 || p.slotWidth <= 0) {
    return { cut: () => false, any: false };
  }

  const nz = rings.length;
  const bottom = Math.max(floorIndex + 1, Math.round((p.bottomThickness + 2) / p.dz));
  const top = Math.min(nz - 2, bottom + Math.max(1, Math.round(p.slotHeight / p.dz)));
  if (top <= bottom) return { cut: () => false, any: false };

  // Slot width is an arc length; convert it to whole segments. Measured on the
  // ring the slot actually sits on, because a circle and a square of the same
  // width differ by a fifth in perimeter and the slot would come out that far
  // off on a round pot.
  const perimeter = polygonPerimeter(rings[Math.floor((bottom + top) / 2)]!.pts);
  const widthSegments = Math.max(1, Math.round((p.slotWidth / perimeter) * seg));
  const starts: number[] = [];
  for (let s = 0; s < count; s++) {
    starts.push(Math.round((s * seg) / count));
  }

  const inSlot = new Uint8Array(seg);
  for (const start of starts) {
    for (let k = 0; k < widthSegments; k++) inSlot[(start + k) % seg] = 1;
  }

  return {
    any: true,
    cut: (i, j) => i >= bottom && i < top && inSlot[j] === 1,
  };
}

/**
 * Builds the shell-mode mesh.
 *
 * @param p - full parameter set
 * @returns closed manifold triangle soup
 * @throws {Error} if the bottom contour cannot be triangulated, which means
 *   the drainage holes do not fit inside it
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { buildShellMesh } from '@core/shell';
 * buildShellMesh({ ...DEFAULT_PARAMS, mode: 'shell' }).triangleCount > 0; // true
 * ```
 */
export function buildShellMesh(p: Params): Mesh {
  const seg = ringCount(p);
  const outer = buildRings(p);
  const nz = outer.length;

  // Cavity floor snaps to the sampling grid; below it the pot is solid slab.
  const floorIndex = Math.min(nz - 2, Math.max(1, Math.round(p.bottomThickness / p.dz)));
  const floorZ = outer[floorIndex]!.z;

  const inner: Ring[] = [];
  for (let i = floorIndex; i < nz; i++) {
    inner.push({ z: outer[i]!.z, pts: innerContour(p, outer[i]!.z, seg) });
  }
  const innerAt = (i: number): Ring => inner[i - floorIndex]!;

  const mask = slotMask(p, outer, seg, floorIndex);
  const sink = new TriangleSink();

  // --- outer surface -------------------------------------------------------
  for (let i = 0; i < nz - 1; i++) {
    for (let j = 0; j < seg; j++) {
      if (mask.cut(i, j)) continue;
      const k = (j + 1) % seg;
      sink.quad(at(outer[i]!, j), at(outer[i]!, k), at(outer[i + 1]!, k), at(outer[i + 1]!, j));
    }
  }

  // --- cavity surface (reversed: it faces inward) --------------------------
  for (let i = floorIndex; i < nz - 1; i++) {
    for (let j = 0; j < seg; j++) {
      if (mask.cut(i, j)) continue;
      const k = (j + 1) % seg;
      sink.quad(at(innerAt(i), j), at(innerAt(i + 1), j), at(innerAt(i + 1), k), at(innerAt(i), k));
    }
  }

  // --- slot reveals: the wall thickness shows on all four sides of the cut --
  if (mask.any) {
    for (let i = 0; i < nz - 1; i++) {
      for (let j = 0; j < seg; j++) {
        if (!mask.cut(i, j)) continue;
        const k = (j + 1) % seg;
        const jPrev = (j - 1 + seg) % seg;

        // Every reveal is wound against the wall quad that shares its outer
        // edge — same direction there would mean a duplicated directed edge,
        // which is a hole in the surface, not a seam.
        if (!mask.cut(i, jPrev)) {
          sink.quad(
            at(outer[i]!, j), at(innerAt(i), j), at(innerAt(i + 1), j), at(outer[i + 1]!, j),
          );
        }
        if (!mask.cut(i, k)) {
          sink.quad(
            at(outer[i]!, k), at(outer[i + 1]!, k), at(innerAt(i + 1), k), at(innerAt(i), k),
          );
        }
        if (!mask.cut(i - 1, j)) {
          sink.quad(
            at(outer[i]!, j), at(outer[i]!, k), at(innerAt(i), k), at(innerAt(i), j),
          );
        }
        if (!mask.cut(i + 1, j)) {
          sink.quad(
            at(outer[i + 1]!, j), at(innerAt(i + 1), j), at(innerAt(i + 1), k), at(outer[i + 1]!, k),
          );
        }
      }
    }
  }

  // --- rim: closes outer and cavity at the top -----------------------------
  const topOuter = outer[nz - 1]!;
  const topInner = innerAt(nz - 1);
  for (let j = 0; j < seg; j++) {
    const k = (j + 1) % seg;
    sink.quad(at(topOuter, j), at(topOuter, k), at(topInner, k), at(topInner, j));
  }

  // --- drainage --------------------------------------------------------------
  const holes = drainPoints(p);
  // Keep the holes clear of the cavity wall; if they do not fit, drop them
  // rather than emit a self-intersecting bottom. The validator warns about it.
  const cavityPts = innerAt(floorIndex).pts;
  let cavityHalf = Infinity;
  for (let i = 0; i < cavityPts.length; i += 2) {
    cavityHalf = Math.min(cavityHalf, Math.hypot(cavityPts[i]!, cavityPts[i + 1]!));
  }
  const radius = p.drainDia / 2;
  const fits = holes.length > 0 && drainRingRadius(p) + radius < cavityHalf - 1;
  const holeContours = fits ? holes.map((h) => circle(h.x, h.y, radius)) : [];

  // Outer face of the slab, pointing down: the triangulator returns CCW, so
  // every triangle is emitted reversed.
  const bottomFace = triangulateWithHoles(outer[0]!.pts, holeContours);
  for (let i = 0; i < bottomFace.length; i += 6) {
    sink.tri(
      [bottomFace[i]!, bottomFace[i + 1]!, 0],
      [bottomFace[i + 4]!, bottomFace[i + 5]!, 0],
      [bottomFace[i + 2]!, bottomFace[i + 3]!, 0],
    );
  }

  // Cavity floor, pointing up.
  const floorFace = triangulateWithHoles(innerAt(floorIndex).pts, holeContours);
  for (let i = 0; i < floorFace.length; i += 6) {
    sink.tri(
      [floorFace[i]!, floorFace[i + 1]!, floorZ],
      [floorFace[i + 2]!, floorFace[i + 3]!, floorZ],
      [floorFace[i + 4]!, floorFace[i + 5]!, floorZ],
    );
  }

  // Hole walls, facing into the hole.
  for (const contour of holeContours) {
    const n = contour.length / 2;
    for (let j = 0; j < n; j++) {
      const k = (j + 1) % n;
      const a: [number, number, number] = [contour[j * 2]!, contour[j * 2 + 1]!, 0];
      const b: [number, number, number] = [contour[k * 2]!, contour[k * 2 + 1]!, 0];
      const c: [number, number, number] = [contour[k * 2]!, contour[k * 2 + 1]!, floorZ];
      const d: [number, number, number] = [contour[j * 2]!, contour[j * 2 + 1]!, floorZ];
      sink.quad(a, d, c, b);
    }
  }

  return sink.finish();
}
