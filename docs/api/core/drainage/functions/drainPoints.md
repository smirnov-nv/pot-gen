[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/drainage](../README.md) / drainPoints

# Function: drainPoints()

> **drainPoints**(`params`): [`DrainPoint`](../interfaces/DrainPoint.md)[]

Defined in: drainage.ts:71

Centres of the drainage holes, evenly spaced on the drain ring.

The first hole sits on the diagonal rather than on an axis: the corners of
the bottom are the stiffest part, and a hole on the axis lands in the
middle of the flattest span.

On an elongated bottom the ring stretches with it: holes on a circle would
bunch up in the middle of a 160×70 pot and leave the ends undrained.

## Parameters

### params

[`DrainParams`](../type-aliases/DrainParams.md)

parameters carrying the shape, the base sizes and `drainHoles`

## Returns

[`DrainPoint`](../interfaces/DrainPoint.md)[]

hole centres; empty when no holes are requested

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { drainPoints } from '@core/drainage';
drainPoints(DEFAULT_PARAMS).length; // 4
```
