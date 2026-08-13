[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/build](../README.md) / buildMesh

# Function: buildMesh()

> **buildMesh**(`params`): [`Mesh`](../../mesh/interfaces/Mesh.md)

Defined in: build.ts:33

Builds the mesh of the selected object.

The object comes first: the tray is a model of its own and the pot's
generation mode says nothing about it.

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
buildMesh({ ...DEFAULT_PARAMS, object: 'tray' }).triangleCount > 0; // true
```
