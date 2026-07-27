[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/metrics](../README.md) / nestingPitch

# Function: nestingPitch()

> **nestingPitch**(`rings`, `wall`): `number`

Defined in: metrics.ts:92

Nesting pitch: how much a stack grows when one more pot is added.

Computed from the real silhouette rather than from the taper formula —
the rim flare, not the cone, is what stops a nested pot, and a formula
would miss it. A copy is lowered ring by ring until its outer envelope
would touch the inner surface of the pot below.

## Parameters

### rings

readonly [`Ring`](../../profile/interfaces/Ring.md)[]

ring stack of the pot

### wall

`number`

wall thickness, mm

## Returns

`number`

pitch in mm; equals the full height if the shape cannot nest

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { buildRings } from '@core/profile';
import { nestingPitch } from '@core/metrics';
nestingPitch(buildRings(DEFAULT_PARAMS), 0.75) < DEFAULT_PARAMS.height; // true
```
