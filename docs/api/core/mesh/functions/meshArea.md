[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/mesh](../README.md) / meshArea

# Function: meshArea()

> **meshArea**(`mesh`): `number`

Defined in: mesh.ts:194

Total surface area of a mesh.

## Parameters

### mesh

[`Mesh`](../interfaces/Mesh.md)

triangle soup

## Returns

`number`

area, mm²

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { buildVaseMesh, meshArea } from '@core/mesh';
meshArea(buildVaseMesh(DEFAULT_PARAMS)) > 0; // true
```
