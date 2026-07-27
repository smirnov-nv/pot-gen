import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS } from '../src/core/params';
import { buildVaseMesh } from '../src/core/mesh';
import { parseBinarySTL, writeBinarySTL } from '../src/core/stl';

const HEADER_BYTES = 80;

describe('binary STL', () => {
  const mesh = buildVaseMesh({ ...DEFAULT_PARAMS, seg: 64, dz: 2 });
  const buf = writeBinarySTL(mesh);

  it('has the expected layout', () => {
    expect(buf.byteLength).toBe(HEADER_BYTES + 4 + mesh.triangleCount * 50);
    const view = new DataView(buf);
    expect(view.getUint32(HEADER_BYTES, true)).toBe(mesh.triangleCount);
    // 80 zero bytes, matching potgen.py byte for byte
    expect(new Uint8Array(buf, 0, HEADER_BYTES).every((b) => b === 0)).toBe(true);
  });

  it('round-trips through the parser at float32 resolution', () => {
    const back = parseBinarySTL(buf);
    expect(back.triangleCount).toBe(mesh.triangleCount);
    for (let i = 0; i < mesh.positions.length; i++) {
      expect(back.positions[i]!).toBe(Math.fround(mesh.positions[i]!));
    }
  });

  it('writes unit-length outward normals', () => {
    const view = new DataView(buf);
    for (let t = 0; t < mesh.triangleCount; t++) {
      const o = HEADER_BYTES + 4 + t * 50;
      const n = [view.getFloat32(o, true), view.getFloat32(o + 4, true), view.getFloat32(o + 8, true)];
      expect(Math.hypot(n[0]!, n[1]!, n[2]!)).toBeCloseTo(1, 5);
    }
  });

  it('leaves the attribute byte count at zero', () => {
    const view = new DataView(buf);
    for (let t = 0; t < mesh.triangleCount; t++) {
      expect(view.getUint16(HEADER_BYTES + 4 + t * 50 + 48, true)).toBe(0);
    }
  });

  it('rejects truncated and inconsistent files', () => {
    expect(() => parseBinarySTL(new ArrayBuffer(10))).toThrow(/too short/);
    expect(() => parseBinarySTL(buf.slice(0, buf.byteLength - 1))).toThrow(/length mismatch/);
  });

  it('emits a zero normal for a degenerate triangle instead of NaN', () => {
    const degenerate = writeBinarySTL({
      positions: new Float64Array([0, 0, 0, 1, 1, 1, 2, 2, 2]),
      triangleCount: 1,
    });
    const view = new DataView(degenerate);
    expect(view.getFloat32(HEADER_BYTES + 4, true)).toBe(0);
    expect(view.getFloat32(HEADER_BYTES + 8, true)).toBe(0);
    expect(view.getFloat32(HEADER_BYTES + 12, true)).toBe(0);
  });
});
