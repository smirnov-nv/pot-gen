[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/mesh](../README.md) / toFloat32

# Function: toFloat32()

> **toFloat32**(`mesh`): `Float32Array`

Defined in: mesh.ts:225

Converts a mesh to the `Float32Array` three.js wants for a
`BufferAttribute`.

Geometry is computed in double precision and only narrowed here, so the
rounding happens once — the same single rounding the STL writer applies.

## Parameters

### mesh

[`Mesh`](../interfaces/Mesh.md)

triangle soup

## Returns

`Float32Array`

positions as float32

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { buildVaseMesh, toFloat32 } from '@core/mesh';
toFloat32(buildVaseMesh(DEFAULT_PARAMS)).BYTES_PER_ELEMENT; // 4
```
