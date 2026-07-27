[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/stl](../README.md) / writeBinarySTL

# Function: writeBinarySTL()

> **writeBinarySTL**(`mesh`): `ArrayBuffer`

Defined in: stl.ts:40

Serialises a mesh as a binary STL.

The 80-byte header is left as zeros, matching `potgen.py` byte for byte —
the acceptance criterion is that both implementations produce the same
file, so there is nothing to gain from stamping a signature into it.

Facet normals are computed in double precision from the double-precision
vertices and only then narrowed to float32, which is what the reference
does; deriving them from the narrowed vertices would shift the last bits.

## Parameters

### mesh

[`Mesh`](../../mesh/interfaces/Mesh.md)

triangle soup to write

## Returns

`ArrayBuffer`

the complete file as an `ArrayBuffer`

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { buildVaseMesh } from '@core/mesh';
import { writeBinarySTL } from '@core/stl';
const buf = writeBinarySTL(buildVaseMesh(DEFAULT_PARAMS));
buf.byteLength > 84; // true
```
