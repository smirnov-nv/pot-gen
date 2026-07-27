[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/build](../README.md) / buildMesh

# Function: buildMesh()

> **buildMesh**(`params`): [`Mesh`](../../mesh/interfaces/Mesh.md)

Defined in: build.ts:28

Builds the mesh for the current mode.

## Parameters

### params

[`Params`](../../params/interfaces/Params.md)

full parameter set

## Returns

[`Mesh`](../../mesh/interfaces/Mesh.md)

triangle soup ready for display or STL export

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { buildMesh } from '@core/build';
buildMesh(DEFAULT_PARAMS).triangleCount > 0; // true
```
