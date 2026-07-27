[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/metrics](../README.md) / effectiveWall

# Function: effectiveWall()

> **effectiveWall**(`p`): `number`

Defined in: metrics.ts:68

Wall thickness the current mode actually prints.

In vase mode the wall *is* one extrusion, so it equals `wallWidth`; in
shell mode it is the explicit `wallThickness`.

## Parameters

### p

[`Params`](../../params/interfaces/Params.md)

parameters

## Returns

`number`

wall thickness, mm

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { effectiveWall } from '@core/metrics';
effectiveWall(DEFAULT_PARAMS); // 0.75
```
