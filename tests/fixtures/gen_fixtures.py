#!/usr/bin/env python3
"""
Regenerates the golden fixtures from the reference implementation.

Runs only inside the pinned Python image:

    make fixtures

The TypeScript port is checked against these numbers by tests/golden.test.ts.
Nothing here may import anything outside the standard library -- potgen.py has
no dependencies and the fixtures must stay reproducible on any machine.
"""

import gzip
import hashlib
import json
import math
import os
import struct
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, ROOT)

import potgen  # noqa: E402  (path juggling has to come first)

# Fixture id -> preset name in potgen.py. The ids match BUILTIN_PRESETS in
# src/core/params.ts; keeping them aligned is what makes the comparison
# meaningful.
PRESET_IDS = {
    "p9": "pot_p9_90x90x95",
    "small": "pot_small_78x78x82",
}


def mesh_volume(tris):
    """Enclosed volume via the divergence theorem, mm^3."""
    v = 0.0
    for a, b, c in tris:
        v += (
            a[0] * (b[1] * c[2] - b[2] * c[1])
            - a[1] * (b[0] * c[2] - b[2] * c[0])
            + a[2] * (b[0] * c[1] - b[1] * c[0])
        ) / 6.0
    return v


def mesh_area(tris):
    """Total surface area, mm^2."""
    s = 0.0
    for a, b, c in tris:
        ux, uy, uz = b[0] - a[0], b[1] - a[1], b[2] - a[2]
        vx, vy, vz = c[0] - a[0], c[1] - a[1], c[2] - a[2]
        nx = uy * vz - uz * vy
        ny = uz * vx - ux * vz
        nz = ux * vy - uy * vx
        s += 0.5 * math.sqrt(nx * nx + ny * ny + nz * nz)
    return s


def mesh_bounds(tris):
    lo = [float("inf")] * 3
    hi = [float("-inf")] * 3
    for tri in tris:
        for p in tri:
            for i in range(3):
                lo[i] = min(lo[i], p[i])
                hi[i] = max(hi[i], p[i])
    return lo, hi


def stl_bytes(tris):
    """Binary STL as bytes -- same layout potgen.write_stl produces."""
    out = bytearray()
    out += b"\0" * 80
    out += struct.pack("<I", len(tris))
    for a, b, c in tris:
        ux, uy, uz = b[0] - a[0], b[1] - a[1], b[2] - a[2]
        vx, vy, vz = c[0] - a[0], c[1] - a[1], c[2] - a[2]
        nx = uy * vz - uz * vy
        ny = uz * vx - ux * vz
        nz = ux * vy - uy * vx
        l = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
        out += struct.pack("<3f", nx / l, ny / l, nz / l)
        for p in (a, b, c):
            out += struct.pack("<3f", *p)
        out += struct.pack("<H", 0)
    return bytes(out)


def sample_points(rings, count=16):
    """A handful of exact contour points, so a failing golden test points at
    the profile stage instead of just 'volume differs'."""
    out = []
    for idx in (0, len(rings) // 2, len(rings) - 1):
        z, pts = rings[idx]
        step = max(1, len(pts) // count)
        out.append(
            {
                "ring": idx,
                "z": z,
                "points": [[pts[j][0], pts[j][1]] for j in range(0, len(pts), step)],
            }
        )
    return out


def main():
    for fixture_id, preset_name in PRESET_IDS.items():
        params = potgen.PRESETS[preset_name]
        rings = potgen.build(**params)
        tris = potgen.triangles(rings)
        lo, hi = mesh_bounds(tris)
        blob = stl_bytes(tris)

        fixture = {
            "_generated_by": "tests/fixtures/gen_fixtures.py (make fixtures)",
            "id": fixture_id,
            "preset": preset_name,
            "params": dict(params, seg=potgen.SEG, dz=potgen.DZ),
            "rings": len(rings),
            "triangles": len(tris),
            "bounds": {"min": lo, "max": hi},
            "volume": mesh_volume(tris),
            "area": mesh_area(tris),
            "bottomPerimeter": potgen.polygon_perimeter(rings[0][1]),
            "bottomArea": potgen.polygon_area(rings[0][1]),
            "topPerimeter": potgen.polygon_perimeter(rings[-1][1]),
            "topArea": potgen.polygon_area(rings[-1][1]),
            "stlBytes": len(blob),
            "stlSha256": hashlib.sha256(blob).hexdigest(),
            "samples": sample_points(rings),
        }

        path = os.path.join(HERE, fixture_id + ".json")
        with open(path, "w") as f:
            json.dump(fixture, f, indent=2)
            f.write("\n")

        # The reference STL itself, gzipped (~750 kB -> ~15 % of raw). The port
        # is compared vertex by vertex against it: a checksum cannot be used,
        # because CPython's libm and V8 differ by an ulp on cos/sin near the
        # axes and that flips the odd float32 in the last bits.
        stl_path = os.path.join(HERE, fixture_id + ".stl.gz")
        with gzip.open(stl_path, "wb", compresslevel=9) as f:
            f.write(blob)

        print(f"wrote {path}: {len(tris)} triangles, sha256 {fixture['stlSha256'][:12]}…")


if __name__ == "__main__":
    main()
