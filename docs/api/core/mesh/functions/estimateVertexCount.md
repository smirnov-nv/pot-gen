[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/mesh](../README.md) / estimateVertexCount

# Function: estimateVertexCount()

> **estimateVertexCount**(`p`): `number`

Defined in: mesh.ts:245

Estimated vertex count for the given parameters, without building anything.

Used by the validator to warn about heavy meshes before the worker spends
a second on them.

## Parameters

### p

`Pick`\<[`Params`](../../params/interfaces/Params.md), `"seg"` \| `"height"` \| `"dz"`\>

parameters carrying `seg`, `height` and `dz`

## Returns

`number`

number of mesh vertices

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { estimateVertexCount } from '@core/mesh';
estimateVertexCount(DEFAULT_PARAMS) > 0; // true
```
