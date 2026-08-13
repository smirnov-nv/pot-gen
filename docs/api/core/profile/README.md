[**core/ — справочник API**](../../README.md)

***

[core/ — справочник API](../../README.md) / core/profile

# core/profile

Cross-section geometry: superellipse, arc-length resampling, fluting and
the vertical profile.

Direct port of `potgen.py` — the algorithm is reproduced step for step,
including the order of operations, because the golden tests compare the
output of both implementations. Do not "clean up" the maths here without
regenerating the fixtures.

Points are stored flat as `[x0, y0, x1, y1, …]` in `Float64Array`s: a
1024-point section over a 250 mm pot is half a million points, and arrays of
tuples cost an allocation each.

## Interfaces

- [Ring](interfaces/Ring.md)
- [SectionSpec](interfaces/SectionSpec.md)
- [RingGeometry](interfaces/RingGeometry.md)

## Type Aliases

- [ProfileParams](type-aliases/ProfileParams.md)

## Functions

- [superellipse](functions/superellipse.md)
- [sectionOutline](functions/sectionOutline.md)
- [resampleByArcLength](functions/resampleByArcLength.md)
- [baseProfile](functions/baseProfile.md)
- [sectionProfile](functions/sectionProfile.md)
- [buildRings](functions/buildRings.md)
- [ringGeometryAt](functions/ringGeometryAt.md)
- [ringCount](functions/ringCount.md)
- [ringLevels](functions/ringLevels.md)
- [rotateInPlace](functions/rotateInPlace.md)
- [polygonArea](functions/polygonArea.md)
- [polygonPerimeter](functions/polygonPerimeter.md)
