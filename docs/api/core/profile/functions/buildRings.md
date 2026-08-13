[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/profile](../README.md) / buildRings

# Function: buildRings()

> **buildRings**(`p`): [`Ring`](../interfaces/Ring.md)[]

Defined in: profile.ts:309

Builds the stack of cross-sections describing the outer surface.

Per height: linear taper between `bottomSize` and `topSize`, corner radius
and flute amplitude scaled by the section size (otherwise nesting skews),
a quadratic rim flare over the last `rimH` mm, and an optional twist.

## Parameters

### p

[`ProfileParams`](../type-aliases/ProfileParams.md)

shape parameters

## Returns

[`Ring`](../interfaces/Ring.md)[]

rings ordered bottom to top, `z[0] = 0`

## Throws

never — out-of-range input is clamped by the caller

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { buildRings } from '@core/profile';
const rings = buildRings(DEFAULT_PARAMS);
rings[0]!.z; // 0
```
