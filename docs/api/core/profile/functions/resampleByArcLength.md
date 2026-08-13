[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/profile](../README.md) / resampleByArcLength

# Function: resampleByArcLength()

> **resampleByArcLength**(`pts`, `m`): `Float64Array`

Defined in: profile.ts:137

Resamples a closed polyline to `m` evenly spaced points.

Mandatory, not cosmetic: uniform angular sampling of a superellipse
clusters points in the corners, which makes the fluting wavelength vary
around the perimeter and the corners come out mushy.

## Parameters

### pts

`Float64Array`

flat `[x, y, …]` closed contour

### m

`number`

number of output points

## Returns

`Float64Array`

flat `[x, y, …]` array of `m` points spaced evenly by arc length

## Example

```ts
import { resampleByArcLength, superellipse } from '@core/profile';
const even = resampleByArcLength(superellipse(45, 10), 256);
even.length; // 512
```
