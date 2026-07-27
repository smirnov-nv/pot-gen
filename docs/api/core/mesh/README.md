[**core/ — справочник API**](../../README.md)

***

[core/ — справочник API](../../README.md) / core/mesh

# core/mesh

Triangulation of the ring stack into a closed manifold solid, plus the
integral quantities used by the tests and the metrics panel.

Vase mode deliberately produces a *solid*, not a thin shell: the slicer in
spiral-vase mode traces the outer contour of whatever it is given and
ignores the interior, so a solid is both simpler and immune to
self-intersecting inner walls.

Triangles are stored as a soup — 9 doubles per triangle, no index buffer —
matching the STL format and the reference implementation one for one.

## Interfaces

- [Mesh](interfaces/Mesh.md)
- [Bounds](interfaces/Bounds.md)

## Functions

- [triangulateRings](functions/triangulateRings.md)
- [buildVaseMesh](functions/buildVaseMesh.md)
- [meshBounds](functions/meshBounds.md)
- [meshVolume](functions/meshVolume.md)
- [meshArea](functions/meshArea.md)
- [toFloat32](functions/toFloat32.md)
- [estimateVertexCount](functions/estimateVertexCount.md)
