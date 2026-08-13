[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/profile](../README.md) / baseProfile

# Function: baseProfile()

> **baseProfile**(`halfSize`, `cornerR`, `flutes`, `fluteAmp`, `seg`): `Float64Array`

Defined in: profile.ts:190

One cross-section: resampled rounded square with the fluting applied along
the outward normal.

The offset is `d(s) = fluteAmp · cos(2π · flutes · s)` with `s = j / seg`.
With `flutes` a multiple of four the wave keeps the 4-fold symmetry of the
square and the corners land on a crest, which is where the extra stiffness
is worth the most.

## Parameters

### halfSize

`number`

half width of the section, mm

### cornerR

`number`

corner radius at this height, mm

### flutes

`number`

number of waves around the perimeter; `<= 0` disables

### fluteAmp

`number`

radial amplitude at this height, mm; `0` disables

### seg

`number`

points in the output contour

## Returns

`Float64Array`

flat `[x, y, …]` contour of `seg` points

## Example

```ts
import { baseProfile } from '@core/profile';
const section = baseProfile(45, 10, 32, 1.1, 256);
section.length; // 512
```
