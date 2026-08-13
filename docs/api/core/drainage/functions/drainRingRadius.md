[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/drainage](../README.md) / drainRingRadius

# Function: drainRingRadius()

> **drainRingRadius**(`params`): `number`

Defined in: drainage.ts:46

Radius of the circle the holes sit on.

Half way out from the axis: close enough to the middle that water finds
them, far enough from the wall that the fillet between wall and bottom is
not cut through.

On an elongated bottom this is the narrow axis: it is the one that decides
whether a hole still clears the wall.

## Parameters

### params

`Omit`\<[`DrainParams`](../type-aliases/DrainParams.md), `"drainHoles"`\>

parameters carrying the shape and the base sizes

## Returns

`number`

radius, mm

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { drainRingRadius } from '@core/drainage';
drainRingRadius(DEFAULT_PARAMS); // 17
```
