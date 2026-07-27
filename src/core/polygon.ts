/**
 * Triangulation of a simple polygon with holes.
 *
 * Needed by shell mode: the bottom is a contour with round drainage holes
 * punched through it, and a fan from the axis cannot express that. The
 * algorithm is the textbook pair — bridge every hole into the outer contour
 * (Eberly), then ear-clip the resulting simple polygon.
 *
 * O(n²) on purpose: a bottom contour is a few hundred points, and a
 * hand-verifiable implementation is worth more here than an asymptotically
 * clever one.
 *
 * @module core/polygon
 */

/** A vertex in the doubly linked working list. */
interface Node {
  x: number;
  y: number;
  prev: Node;
  next: Node;
  /** Index in the flat input, kept for debugging. */
  i: number;
}

/** Signed area of a flat `[x, y, …]` contour; positive means CCW. */
function signedArea(pts: Float64Array): number {
  let a = 0;
  const n = pts.length / 2;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    a += pts[i * 2]! * pts[j * 2 + 1]! - pts[j * 2]! * pts[i * 2 + 1]!;
  }
  return a / 2;
}

/** Builds a circular linked list from a contour, in the requested winding. */
function toList(pts: Float64Array, ccw: boolean, offset: number): Node {
  const n = pts.length / 2;
  const forward = signedArea(pts) > 0 === ccw;
  let first: Node | null = null;
  let last: Node | null = null;

  for (let k = 0; k < n; k++) {
    const i = forward ? k : n - 1 - k;
    const node = {
      x: pts[i * 2]!,
      y: pts[i * 2 + 1]!,
      i: offset + i,
    } as Node;
    if (!first) {
      first = node;
      node.prev = node;
      node.next = node;
    } else {
      node.prev = last!;
      node.next = first;
      last!.next = node;
      first.prev = node;
    }
    last = node;
  }
  return first!;
}

/** Twice the signed area of a triangle; > 0 when counter-clockwise. */
function cross(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

/** Point-in-triangle, inclusive of the boundary. */
function inTriangle(
  ax: number, ay: number, bx: number, by: number, cx: number, cy: number,
  px: number, py: number,
): boolean {
  const d1 = cross(ax, ay, bx, by, px, py);
  const d2 = cross(bx, by, cx, cy, px, py);
  const d3 = cross(cx, cy, ax, ay, px, py);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

/** Splices a hole into the outer list through a bridge between two nodes. */
function bridge(outerNode: Node, holeNode: Node): void {
  const o2 = { x: outerNode.x, y: outerNode.y, i: outerNode.i } as Node;
  const h2 = { x: holeNode.x, y: holeNode.y, i: holeNode.i } as Node;

  const on = outerNode.next;
  const hp = holeNode.prev;

  outerNode.next = holeNode;
  holeNode.prev = outerNode;

  hp.next = h2;
  h2.prev = hp;

  h2.next = o2;
  o2.prev = h2;

  o2.next = on;
  on.prev = o2;
}

/** Is `b` inside the interior wedge at vertex `a`? */
function locallyInside(a: Node, b: Node): boolean {
  return cross(a.prev.x, a.prev.y, a.x, a.y, a.next.x, a.next.y) > 0
    ? cross(a.x, a.y, b.x, b.y, a.next.x, a.next.y) <= 0 &&
        cross(a.x, a.y, a.prev.x, a.prev.y, b.x, b.y) <= 0
    : cross(a.x, a.y, b.x, b.y, a.prev.x, a.prev.y) > 0 ||
        cross(a.x, a.y, a.next.x, a.next.y, b.x, b.y) > 0;
}

/** Tie-break between two bridge candidates at the same x: whose wedge is wider. */
function sectorContainsSector(m: Node, p: Node): boolean {
  return (
    cross(m.prev.x, m.prev.y, m.x, m.y, p.prev.x, p.prev.y) > 0 &&
    cross(p.next.x, p.next.y, m.x, m.y, m.next.x, m.next.y) > 0
  );
}

/** Leftmost vertex of a ring; ties broken by the lower y. */
function leftmost(ring: Node): Node {
  let m = ring;
  let node = ring.next;
  while (node !== ring) {
    if (node.x < m.x || (node.x === m.x && node.y < m.y)) m = node;
    node = node.next;
  }
  return m;
}

/**
 * Connects one hole to the outer polygon.
 *
 * Ray towards -x from the hole's leftmost vertex, nearest crossed edge, then
 * the visible vertex with the smallest angle to the ray. Taking the *nearest*
 * crossing is what keeps a bridge from running through a neighbouring hole,
 * and the sector tie-break is what keeps two holes at the same x from
 * bridging into one corner and crossing each other -- both of which the naive
 * version got wrong on four symmetric drainage holes.
 */
function eliminateHole(outer: Node, hole: Node): void {
  const h = leftmost(hole);
  const hx = h.x;
  const hy = h.y;

  let m: Node | null = null;
  let qx = -Infinity;
  let node = outer;
  do {
    const a = node;
    const b = node.next;
    if (hy <= a.y && hy >= b.y && b.y !== a.y) {
      const x = a.x + ((hy - a.y) * (b.x - a.x)) / (b.y - a.y);
      if (x <= hx && x > qx) {
        qx = x;
        m = a.x < b.x ? a : b;
        if (x === hx) break; // the ray starts on this edge -- bridge right here
      }
    }
    node = node.next;
  } while (node !== outer);

  if (!m) throw new Error('hole lies outside the outer contour');

  let best = m;
  let tanMin = Infinity;
  const stop = m;
  const mx = m.x;
  const my = m.y;
  node = m;
  do {
    if (
      hx >= node.x &&
      node.x >= mx &&
      hx !== node.x &&
      inTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, node.x, node.y)
    ) {
      const tan = Math.abs(hy - node.y) / (hx - node.x);
      if (
        locallyInside(node, h) &&
        (tan < tanMin ||
          (tan === tanMin &&
            (node.x > best.x || (node.x === best.x && sectorContainsSector(best, node)))))
      ) {
        best = node;
        tanMin = tan;
      }
    }
    node = node.next;
  } while (node !== stop);

  bridge(best, h);
}

/** True when the triangle at `ear` can be clipped off. */
function isEar(ear: Node): boolean {
  const a = ear.prev;
  const b = ear;
  const c = ear.next;
  if (cross(a.x, a.y, b.x, b.y, c.x, c.y) <= 0) return false; // reflex or degenerate

  let node = c.next;
  while (node !== a) {
    if (
      inTriangle(a.x, a.y, b.x, b.y, c.x, c.y, node.x, node.y) &&
      cross(node.prev.x, node.prev.y, node.x, node.y, node.next.x, node.next.y) <= 0
    ) {
      return false;
    }
    node = node.next;
  }
  return true;
}

/**
 * Triangulates a contour with holes.
 *
 * @param outer - flat `[x, y, …]` outer contour, any winding
 * @param holes - flat contours strictly inside `outer` and not overlapping
 * @returns flat `[ax, ay, bx, by, cx, cy, …]`, every triangle counter-clockwise
 * @throws {Error} if a hole lies outside the outer contour, or if the polygon
 *   cannot be reduced — both mean the caller built an impossible shape
 *
 * @example
 * ```ts
 * import { triangulateWithHoles } from '@core/polygon';
 * const square = new Float64Array([0, 0, 10, 0, 10, 10, 0, 10]);
 * triangulateWithHoles(square, []).length / 6; // 2
 * ```
 */
export function triangulateWithHoles(
  outer: Float64Array,
  holes: readonly Float64Array[] = [],
): Float64Array {
  if (outer.length < 6) return new Float64Array(0);

  const list = toList(outer, true, 0);
  let offset = outer.length / 2;
  // Leftmost-first: bridges run towards -x, so processing holes left to
  // right means every later bridge sees the earlier ones as ordinary edges.
  const sorted = [...holes].sort((a, b) => minX(a) - minX(b));
  for (const hole of sorted) {
    if (hole.length < 6) continue;
    eliminateHole(list, toList(hole, false, offset));
    offset += hole.length / 2;
  }

  const out: number[] = [];
  let node = list;
  // A full lap without clipping anything means no ear exists, which for a
  // simple polygon is impossible — so the input was not simple.
  let stop = node;
  while (node.next !== node.prev) {
    if (isEar(node)) {
      out.push(node.prev.x, node.prev.y, node.x, node.y, node.next.x, node.next.y);
      node.prev.next = node.next;
      node.next.prev = node.prev;
      node = node.next;
      stop = node;
      continue;
    }
    node = node.next;
    if (node === stop) throw new Error('polygon cannot be triangulated (self-intersecting?)');
  }

  return Float64Array.from(out);
}

/** Smallest x of a contour. */
function minX(pts: Float64Array): number {
  let m = Infinity;
  for (let i = 0; i < pts.length; i += 2) m = Math.min(m, pts[i]!);
  return m;
}
