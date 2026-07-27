#!/usr/bin/env python3
"""
Parametric square nursery pot for spiral-vase (vase mode) printing.

- Rounded-square cross-section (superellipse), resampled by arc length
- Optional sinusoidal fluting -> big stiffness gain on a single-wall print
- Linear taper -> pots nest for storage/transport
- Rim flare -> nested pots don't jam together, stiffens the lip
- Closed manifold solid (side + bottom cap + top cap) -> slicer traces outer
  contour in vase mode

No dependencies. python3 potgen.py
"""

import math
import struct

# ----------------------------------------------------------------------------
# PRESETS  (edit here)
# ----------------------------------------------------------------------------

PRESETS = {
    # classic european P9 nursery pot, ~0.5 L, fits standard trays
    "pot_p9_90x90x95": dict(
        top_size=90.0,        # outer width at rim, mm
        bottom_size=68.0,     # outer width at base, mm  (taper = nesting)
        height=95.0,
        corner_r=10.0,        # corner radius at the rim
        flutes=32,            # 0 = smooth walls
        flute_amp=1.1,        # radial amplitude, mm
        rim_h=6.0,            # height of the flared lip
        rim_flare=1.3,        # extra outward offset at the very top, mm
        twist=0.0,            # deg per mm of height (0 keeps nesting working)
    ),
    # smaller, ~0.35 L, cheaper/faster - good for freshly rooted cuttings
    "pot_small_78x78x82": dict(
        top_size=78.0,
        bottom_size=58.0,
        height=82.0,
        corner_r=9.0,
        flutes=28,
        flute_amp=1.0,
        rim_h=5.0,
        rim_flare=1.2,
        twist=0.0,
    ),
}

# print settings used only for the material/time estimate
WALL_WIDTH = 0.75       # extrusion width in vase mode
LAYER_H = 0.28
BOTTOM_LAYERS = 4
PETG_DENSITY = 1.27     # g/cm3

SEG = 256               # points around the cross-section
DZ = 0.5                # vertical sampling, mm

# ----------------------------------------------------------------------------


def superellipse(a, corner_r, n=720):
    """Rounded square of half-width `a` with corner radius `corner_r`,
    approximated by a superellipse. Returns dense point list."""
    # exponent chosen so the corner curvature roughly matches corner_r
    k = max(2.5, 2.0 * a / max(corner_r, 0.5))
    pts = []
    for i in range(n):
        t = 2.0 * math.pi * i / n
        c, s = math.cos(t), math.sin(t)
        x = a * math.copysign(abs(c) ** (2.0 / k), c)
        y = a * math.copysign(abs(s) ** (2.0 / k), s)
        pts.append((x, y))
    return pts


def resample_by_arclength(pts, m):
    """Even spacing along the closed polyline -> flutes come out uniform."""
    n = len(pts)
    seglen = []
    total = 0.0
    for i in range(n):
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % n]
        d = math.hypot(x1 - x0, y1 - y0)
        seglen.append(d)
        total += d

    out = []
    target = 0.0
    step = total / m
    acc = 0.0
    i = 0
    for _ in range(m):
        while acc + seglen[i] < target:
            acc += seglen[i]
            i = (i + 1) % n
        r = (target - acc) / seglen[i] if seglen[i] > 0 else 0.0
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % n]
        out.append((x0 + (x1 - x0) * r, y0 + (y1 - y0) * r))
        target += step
    return out


def base_profile(half_size, corner_r, flutes, flute_amp, seg):
    """Unit-ish cross-section at a given half size, with fluting applied
    along the outward normal."""
    dense = superellipse(half_size, corner_r)
    pts = resample_by_arclength(dense, seg)
    if flutes <= 0 or flute_amp == 0.0:
        return pts

    out = []
    for j in range(seg):
        x, y = pts[j]
        xp, yp = pts[(j + 1) % seg]
        xm, ym = pts[(j - 1) % seg]
        tx, ty = xp - xm, yp - ym
        tl = math.hypot(tx, ty) or 1.0
        # outward normal for CCW ordering
        nx, ny = ty / tl, -tx / tl
        s = j / seg
        # phase: flutes % 4 == 0 keeps 4-fold symmetry, corners land on a peak
        d = flute_amp * math.cos(2.0 * math.pi * flutes * s)
        out.append((x + nx * d, y + ny * d))
    return out


def build(top_size, bottom_size, height, corner_r, flutes, flute_amp,
          rim_h, rim_flare, twist, seg=SEG, dz=DZ):
    nz = max(2, int(round(height / dz)) + 1)
    rings = []
    for i in range(nz):
        z = height * i / (nz - 1)
        f = z / height
        half = 0.5 * (bottom_size + (top_size - bottom_size) * f)
        # corner radius scales with the section so nesting stays clean
        cr = corner_r * (half / (0.5 * top_size))
        amp = flute_amp * (half / (0.5 * top_size))

        prof = base_profile(half, cr, flutes, amp, seg)

        # rim flare over the last rim_h mm
        if rim_h > 0 and z > height - rim_h:
            g = (z - (height - rim_h)) / rim_h
            grow = rim_flare * g * g
            scale = (half + grow) / half
            prof = [(x * scale, y * scale) for (x, y) in prof]

        if twist:
            a = math.radians(twist * z)
            ca, sa = math.cos(a), math.sin(a)
            prof = [(x * ca - y * sa, x * sa + y * ca) for (x, y) in prof]

        rings.append((z, prof))
    return rings


def polygon_area(pts):
    a = 0.0
    n = len(pts)
    for i in range(n):
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % n]
        a += x0 * y1 - x1 * y0
    return abs(a) * 0.5


def polygon_perimeter(pts):
    p = 0.0
    n = len(pts)
    for i in range(n):
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % n]
        p += math.hypot(x1 - x0, y1 - y0)
    return p


def triangles(rings):
    tris = []
    nz = len(rings)
    seg = len(rings[0][1])

    for i in range(nz - 1):
        z0, p0 = rings[i]
        z1, p1 = rings[i + 1]
        for j in range(seg):
            k = (j + 1) % seg
            a = (p0[j][0], p0[j][1], z0)
            b = (p0[k][0], p0[k][1], z0)
            c = (p1[k][0], p1[k][1], z1)
            d = (p1[j][0], p1[j][1], z1)
            tris.append((a, b, c))
            tris.append((a, c, d))

    z0, p0 = rings[0]
    cb = (0.0, 0.0, z0)
    for j in range(seg):
        k = (j + 1) % seg
        tris.append((cb, (p0[k][0], p0[k][1], z0), (p0[j][0], p0[j][1], z0)))

    z1, p1 = rings[-1]
    ct = (0.0, 0.0, z1)
    for j in range(seg):
        k = (j + 1) % seg
        tris.append((ct, (p1[j][0], p1[j][1], z1), (p1[k][0], p1[k][1], z1)))

    return tris


def write_stl(path, tris):
    with open(path, "wb") as f:
        f.write(b"\0" * 80)
        f.write(struct.pack("<I", len(tris)))
        for a, b, c in tris:
            ux, uy, uz = b[0] - a[0], b[1] - a[1], b[2] - a[2]
            vx, vy, vz = c[0] - a[0], c[1] - a[1], c[2] - a[2]
            nx = uy * vz - uz * vy
            ny = uz * vx - ux * vz
            nz_ = ux * vy - uy * vx
            l = math.sqrt(nx * nx + ny * ny + nz_ * nz_) or 1.0
            f.write(struct.pack("<3f", nx / l, ny / l, nz_ / l))
            for p in (a, b, c):
                f.write(struct.pack("<3f", *p))
            f.write(struct.pack("<H", 0))


def estimate(rings, name):
    nz = len(rings)
    wall_vol = 0.0
    soil_vol = 0.0
    path_len = 0.0
    for i in range(nz - 1):
        z0, p0 = rings[i]
        z1, _ = rings[i + 1]
        h = z1 - z0
        per = polygon_perimeter(p0)
        wall_vol += per * WALL_WIDTH * h
        path_len += per
        # usable volume: outer area shrunk by one wall, and stop 12 mm below rim
        if z0 < rings[-1][0] - 12.0:
            area = polygon_area(p0)
            r_eq = math.sqrt(area / math.pi)
            inner = math.pi * max(0.0, r_eq - WALL_WIDTH) ** 2
            soil_vol += inner * h

    bottom_area = polygon_area(rings[0][1])
    wall_vol += bottom_area * BOTTOM_LAYERS * LAYER_H
    grams = wall_vol / 1000.0 * PETG_DENSITY
    layers = int(rings[-1][0] / LAYER_H)
    # crude time estimate at 70 mm/s effective
    minutes = (path_len * (LAYER_H / DZ) if False else path_len * 0) or 0
    avg_per = path_len / (nz - 1)
    minutes = layers * avg_per / 70.0 / 60.0

    print(f"  {name}")
    print(f"    footprint      {math.sqrt(bottom_area):.0f} mm base -> rim, "
          f"{rings[-1][0]:.0f} mm tall")
    print(f"    usable volume  ~{soil_vol/1e6:.2f} L of substrate")
    print(f"    filament       ~{grams:.0f} g PETG "
          f"(wall {WALL_WIDTH} mm, {BOTTOM_LAYERS} bottom layers)")
    print(f"    layers         {layers} @ {LAYER_H} mm")
    print(f"    print time     ~{minutes:.0f} min at 70 mm/s effective")


if __name__ == "__main__":
    import os
    outdir = "/mnt/user-data/outputs"
    os.makedirs(outdir, exist_ok=True)
    print("generated:")
    for name, params in PRESETS.items():
        rings = build(**params)
        tris = triangles(rings)
        path = os.path.join(outdir, name + ".stl")
        write_stl(path, tris)
        estimate(rings, name + ".stl")
