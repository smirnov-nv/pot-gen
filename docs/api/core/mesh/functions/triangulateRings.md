[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/mesh](../README.md) / triangulateRings

# Function: triangulateRings()

> **triangulateRings**(`rings`): [`Mesh`](../interfaces/Mesh.md)

Defined in: mesh.ts:54

Triangulates a ring stack into a closed solid.

Side quads are split `(a, b, c)` / `(a, c, d)`, then a fan cap closes the
bottom and another closes the top. Winding is counter-clockwise seen from
outside, so every face normal points away from the body.

## Parameters

### rings

readonly [`Ring`](../../profile/interfaces/Ring.md)[]

rings ordered bottom to top, all with the same point count

## Returns

[`Mesh`](../interfaces/Mesh.md)

closed manifold triangle soup

## Throws

if fewer than two rings are supplied

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { buildRings } from '@core/profile';
import { triangulateRings } from '@core/mesh';
const mesh = triangulateRings(buildRings(DEFAULT_PARAMS));
mesh.triangleCount > 0; // true
```
