[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/mesh](../README.md) / meshBounds

# Function: meshBounds()

> **meshBounds**(`mesh`): [`Bounds`](../interfaces/Bounds.md)

Defined in: mesh.ts:139

Axis-aligned bounding box of a mesh.

## Parameters

### mesh

[`Mesh`](../interfaces/Mesh.md)

triangle soup

## Returns

[`Bounds`](../interfaces/Bounds.md)

min and max corner, mm

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { buildVaseMesh, meshBounds } from '@core/mesh';
meshBounds(buildVaseMesh(DEFAULT_PARAMS)).min[2]; // 0
```
