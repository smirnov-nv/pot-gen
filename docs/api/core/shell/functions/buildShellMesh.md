[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/shell](../README.md) / buildShellMesh

# Function: buildShellMesh()

> **buildShellMesh**(`p`): [`Mesh`](../../mesh/interfaces/Mesh.md)

Defined in: shell.ts:170

Builds the shell-mode mesh.

## Parameters

### p

[`Params`](../../params/interfaces/Params.md)

full parameter set

## Returns

[`Mesh`](../../mesh/interfaces/Mesh.md)

closed manifold triangle soup

## Throws

if the bottom contour cannot be triangulated, which means
  the drainage holes do not fit inside it

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { buildShellMesh } from '@core/shell';
buildShellMesh({ ...DEFAULT_PARAMS, mode: 'shell' }).triangleCount > 0; // true
```
