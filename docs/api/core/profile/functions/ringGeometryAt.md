[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/profile](../README.md) / ringGeometryAt

# Function: ringGeometryAt()

> **ringGeometryAt**(`p`, `z`): [`RingGeometry`](../interfaces/RingGeometry.md)

Defined in: profile.ts:251

Section parameters at a given height.

Shared by the vase rings and by shell mode, which needs the same numbers to
derive the inner wall. Duplicating the taper maths in two places is exactly
how the two surfaces would drift apart.

## Parameters

### p

[`ProfileParams`](../type-aliases/ProfileParams.md)

shape parameters

### z

`number`

height above the plate, mm

## Returns

[`RingGeometry`](../interfaces/RingGeometry.md)

section parameters at `z`

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { ringGeometryAt } from '@core/profile';
ringGeometryAt(DEFAULT_PARAMS, 0).half; // 34
```
