[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/profile](../README.md) / superellipse

# Function: superellipse()

> **superellipse**(`a`, `cornerR`, `n?`): `Float64Array`

Defined in: profile.ts:56

Dense sampling of a rounded square as a superellipse.

```text
x = a · sign(cos t) · |cos t|^(2/k)
y = a · sign(sin t) · |sin t|^(2/k)
k = max(2.5, 2a / corner_r)
```

The exponent is picked so the corner curvature roughly matches `cornerR`;
the 2.5 floor keeps the section from degenerating into a circle-ish blob
when the requested radius is large relative to the pot.

## Parameters

### a

`number`

half width of the section, mm

### cornerR

`number`

corner radius, mm (floored at 0.5 to keep `k` finite)

### n?

`number` = `DENSE_SAMPLES`

number of samples in the dense pass

## Returns

`Float64Array`

flat `[x, y, …]` array of `n` points, counter-clockwise

## Example

```ts
import { superellipse } from '@core/profile';
const pts = superellipse(45, 10);
pts.length; // 1440
```
