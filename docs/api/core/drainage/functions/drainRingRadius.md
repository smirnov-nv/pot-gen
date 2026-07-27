[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/drainage](../README.md) / drainRingRadius

# Function: drainRingRadius()

> **drainRingRadius**(`params`): `number`

Defined in: drainage.ts:36

Radius of the circle the holes sit on.

Half way out from the axis: close enough to the middle that water finds
them, far enough from the wall that the fillet between wall and bottom is
not cut through.

## Parameters

### params

`Pick`\<[`Params`](../../params/interfaces/Params.md), `"bottomSize"`\>

parameters carrying `bottomSize`

## Returns

`number`

radius, mm

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { drainRingRadius } from '@core/drainage';
drainRingRadius(DEFAULT_PARAMS); // 17
```
