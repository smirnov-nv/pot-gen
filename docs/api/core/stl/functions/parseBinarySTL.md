[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/stl](../README.md) / parseBinarySTL

# Function: parseBinarySTL()

> **parseBinarySTL**(`buffer`): [`Mesh`](../../mesh/interfaces/Mesh.md)

Defined in: stl.ts:101

Parses a binary STL back into a mesh.

Only used by the tests (round-trip check) and never in the app — importing
foreign STLs is explicitly out of scope.

## Parameters

### buffer

`ArrayBuffer`

file contents

## Returns

[`Mesh`](../../mesh/interfaces/Mesh.md)

triangle soup with float32-rounded coordinates

## Throws

if the buffer is too short or the triangle count does not
  match the file length

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { buildVaseMesh } from '@core/mesh';
import { parseBinarySTL, writeBinarySTL } from '@core/stl';
const mesh = buildVaseMesh(DEFAULT_PARAMS);
parseBinarySTL(writeBinarySTL(mesh)).triangleCount === mesh.triangleCount; // true
```
