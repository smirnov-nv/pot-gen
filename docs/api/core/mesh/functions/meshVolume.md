[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/mesh](../README.md) / meshVolume

# Function: meshVolume()

> **meshVolume**(`mesh`): `number`

Defined in: mesh.ts:169

Enclosed volume via the divergence theorem.

Positive means the winding is consistent and the normals point outwards —
which is exactly what the orientation test checks.

## Parameters

### mesh

[`Mesh`](../interfaces/Mesh.md)

closed triangle soup

## Returns

`number`

signed volume, mm³

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { buildVaseMesh, meshVolume } from '@core/mesh';
meshVolume(buildVaseMesh(DEFAULT_PARAMS)) > 0; // true
```
