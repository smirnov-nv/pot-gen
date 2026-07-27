[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/mesh](../README.md) / buildVaseMesh

# Function: buildVaseMesh()

> **buildVaseMesh**(`p`): [`Mesh`](../interfaces/Mesh.md)

Defined in: mesh.ts:122

Builds the vase-mode mesh straight from parameters.

## Parameters

### p

[`ProfileParams`](../../profile/type-aliases/ProfileParams.md)

shape parameters

## Returns

[`Mesh`](../interfaces/Mesh.md)

closed manifold triangle soup

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { buildVaseMesh } from '@core/mesh';
buildVaseMesh(DEFAULT_PARAMS).triangleCount; // 98304 + 512
```
