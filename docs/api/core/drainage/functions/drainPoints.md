[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/drainage](../README.md) / drainPoints

# Function: drainPoints()

> **drainPoints**(`params`): [`DrainPoint`](../interfaces/DrainPoint.md)[]

Defined in: drainage.ts:57

Centres of the drainage holes, evenly spaced on the drain ring.

The first hole sits on the diagonal rather than on an axis: the corners of
the bottom are the stiffest part, and a hole on the axis lands in the
middle of the flattest span.

## Parameters

### params

`Pick`\<[`Params`](../../params/interfaces/Params.md), `"bottomSize"` \| `"drainHoles"`\>

parameters carrying `bottomSize` and `drainHoles`

## Returns

[`DrainPoint`](../interfaces/DrainPoint.md)[]

hole centres; empty when no holes are requested

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { drainPoints } from '@core/drainage';
drainPoints(DEFAULT_PARAMS).length; // 4
```
