import { describe, expect, it } from 'vitest';
import { triangulateWithHoles } from '../src/core/polygon';

/** Total area of a triangle soup in `[ax, ay, bx, by, cx, cy, …]` form. */
function area(tris: Float64Array): number {
  let s = 0;
  for (let i = 0; i < tris.length; i += 6) {
    s += Math.abs(
      (tris[i + 2]! - tris[i]!) * (tris[i + 5]! - tris[i + 1]!) -
        (tris[i + 3]! - tris[i + 1]!) * (tris[i + 4]! - tris[i]!),
    ) / 2;
  }
  return s;
}

/** All triangles wound counter-clockwise? */
function allCCW(tris: Float64Array): boolean {
  for (let i = 0; i < tris.length; i += 6) {
    const c =
      (tris[i + 2]! - tris[i]!) * (tris[i + 5]! - tris[i + 1]!) -
      (tris[i + 3]! - tris[i + 1]!) * (tris[i + 4]! - tris[i]!);
    if (c <= 0) return false;
  }
  return true;
}

/** Regular polygon approximating a circle. */
function circle(cx: number, cy: number, r: number, n = 24): Float64Array {
  const out = new Float64Array(n * 2);
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    out[i * 2] = cx + r * Math.cos(a);
    out[i * 2 + 1] = cy + r * Math.sin(a);
  }
  return out;
}

const square = new Float64Array([0, 0, 10, 0, 10, 10, 0, 10]);

describe('triangulateWithHoles', () => {
  it('splits a square into two triangles', () => {
    const tris = triangulateWithHoles(square);
    expect(tris.length / 6).toBe(2);
    expect(area(tris)).toBeCloseTo(100, 9);
    expect(allCCW(tris)).toBe(true);
  });

  it('accepts either winding of the input', () => {
    const cw = new Float64Array([0, 0, 0, 10, 10, 10, 10, 0]);
    expect(area(triangulateWithHoles(cw))).toBeCloseTo(100, 9);
    expect(allCCW(triangulateWithHoles(cw))).toBe(true);
  });

  it('subtracts a single hole', () => {
    const hole = circle(5, 5, 2);
    const tris = triangulateWithHoles(square, [hole]);
    expect(area(tris)).toBeCloseTo(100 - area(triangulateWithHoles(hole)), 6);
    expect(allCCW(tris)).toBe(true);
  });

  it('subtracts several holes', () => {
    const holes = [circle(2.5, 2.5, 1), circle(7.5, 2.5, 1), circle(7.5, 7.5, 1), circle(2.5, 7.5, 1)];
    const tris = triangulateWithHoles(square, holes);
    const holeArea = holes.reduce((s, h) => s + area(triangulateWithHoles(h)), 0);
    expect(area(tris)).toBeCloseTo(100 - holeArea, 6);
    expect(allCCW(tris)).toBe(true);
  });

  it('handles a concave outer contour', () => {
    // L-shape
    const l = new Float64Array([0, 0, 10, 0, 10, 4, 4, 4, 4, 10, 0, 10]);
    const tris = triangulateWithHoles(l);
    expect(area(tris)).toBeCloseTo(10 * 4 + 4 * 6, 9);
    expect(allCCW(tris)).toBe(true);
  });

  it('produces a fan-free triangulation of a many-sided contour', () => {
    const tris = triangulateWithHoles(circle(0, 0, 45, 256), [circle(0, 0, 5, 32)]);
    expect(allCCW(tris)).toBe(true);
    expect(area(tris)).toBeGreaterThan(Math.PI * 45 * 45 * 0.98 - Math.PI * 25);
  });

  it('ignores degenerate input instead of throwing', () => {
    expect(triangulateWithHoles(new Float64Array([0, 0, 1, 1])).length).toBe(0);
    expect(triangulateWithHoles(square, [new Float64Array([0, 0])]).length / 6).toBe(2);
  });

  it('rejects a hole outside the contour', () => {
    expect(() => triangulateWithHoles(square, [circle(50, 50, 2)])).toThrow(/outside/);
  });
});
