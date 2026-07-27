/**
 * Binary STL reader and writer.
 *
 * Binary, not ASCII: a 100 k-triangle pot is 5 MB binary against ~50 MB of
 * text, and every slicer reads binary faster.
 *
 * @module core/stl
 */

import type { Mesh } from './mesh';

/** Bytes of zero padding at the start of a binary STL. */
const HEADER_BYTES = 80;
/** Bytes per triangle record: normal + 3 vertices + attribute word. */
const TRIANGLE_BYTES = 50;

/**
 * Serialises a mesh as a binary STL.
 *
 * The 80-byte header is left as zeros, matching `potgen.py` byte for byte —
 * the acceptance criterion is that both implementations produce the same
 * file, so there is nothing to gain from stamping a signature into it.
 *
 * Facet normals are computed in double precision from the double-precision
 * vertices and only then narrowed to float32, which is what the reference
 * does; deriving them from the narrowed vertices would shift the last bits.
 *
 * @param mesh - triangle soup to write
 * @returns the complete file as an `ArrayBuffer`
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { buildVaseMesh } from '@core/mesh';
 * import { writeBinarySTL } from '@core/stl';
 * const buf = writeBinarySTL(buildVaseMesh(DEFAULT_PARAMS));
 * buf.byteLength > 84; // true
 * ```
 */
export function writeBinarySTL(mesh: Mesh): ArrayBuffer {
  const { positions, triangleCount } = mesh;
  const buffer = new ArrayBuffer(HEADER_BYTES + 4 + triangleCount * TRIANGLE_BYTES);
  const view = new DataView(buffer);

  view.setUint32(HEADER_BYTES, triangleCount, true);

  let off = HEADER_BYTES + 4;
  for (let i = 0; i < positions.length; i += 9) {
    const ax = positions[i]!, ay = positions[i + 1]!, az = positions[i + 2]!;
    const bx = positions[i + 3]!, by = positions[i + 4]!, bz = positions[i + 5]!;
    const cx = positions[i + 6]!, cy = positions[i + 7]!, cz = positions[i + 8]!;

    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    // Degenerate triangles (zero-length normal) would divide by zero; the
    // reference substitutes 1.0 and writes a zero normal, so do the same.
    const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;

    view.setFloat32(off, nx / l, true);
    view.setFloat32(off + 4, ny / l, true);
    view.setFloat32(off + 8, nz / l, true);
    view.setFloat32(off + 12, ax, true);
    view.setFloat32(off + 16, ay, true);
    view.setFloat32(off + 20, az, true);
    view.setFloat32(off + 24, bx, true);
    view.setFloat32(off + 28, by, true);
    view.setFloat32(off + 32, bz, true);
    view.setFloat32(off + 36, cx, true);
    view.setFloat32(off + 40, cy, true);
    view.setFloat32(off + 44, cz, true);
    view.setUint16(off + 48, 0, true);
    off += TRIANGLE_BYTES;
  }

  return buffer;
}

/**
 * Parses a binary STL back into a mesh.
 *
 * Only used by the tests (round-trip check) and never in the app — importing
 * foreign STLs is explicitly out of scope.
 *
 * @param buffer - file contents
 * @returns triangle soup with float32-rounded coordinates
 * @throws {Error} if the buffer is too short or the triangle count does not
 *   match the file length
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { buildVaseMesh } from '@core/mesh';
 * import { parseBinarySTL, writeBinarySTL } from '@core/stl';
 * const mesh = buildVaseMesh(DEFAULT_PARAMS);
 * parseBinarySTL(writeBinarySTL(mesh)).triangleCount === mesh.triangleCount; // true
 * ```
 */
export function parseBinarySTL(buffer: ArrayBuffer): Mesh {
  if (buffer.byteLength < HEADER_BYTES + 4) throw new Error('STL too short');
  const view = new DataView(buffer);
  const triangleCount = view.getUint32(HEADER_BYTES, true);
  const expected = HEADER_BYTES + 4 + triangleCount * TRIANGLE_BYTES;
  if (buffer.byteLength !== expected) {
    throw new Error(`STL length mismatch: expected ${expected}, got ${buffer.byteLength}`);
  }

  const positions = new Float64Array(triangleCount * 9);
  let off = HEADER_BYTES + 4;
  for (let t = 0; t < triangleCount; t++) {
    for (let v = 0; v < 9; v++) {
      // +12 skips the facet normal; vertices follow it.
      positions[t * 9 + v] = view.getFloat32(off + 12 + v * 4, true);
    }
    off += TRIANGLE_BYTES;
  }
  return { positions, triangleCount };
}
