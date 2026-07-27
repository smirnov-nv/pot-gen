[**core/ — справочник API**](../../README.md)

***

[core/ — справочник API](../../README.md) / core/polygon

# core/polygon

Triangulation of a simple polygon with holes.

Needed by shell mode: the bottom is a contour with round drainage holes
punched through it, and a fan from the axis cannot express that. The
algorithm is the textbook pair — bridge every hole into the outer contour
(Eberly), then ear-clip the resulting simple polygon.

O(n²) on purpose: a bottom contour is a few hundred points, and a
hand-verifiable implementation is worth more here than an asymptotically
clever one.

## Functions

- [triangulateWithHoles](functions/triangulateWithHoles.md)
