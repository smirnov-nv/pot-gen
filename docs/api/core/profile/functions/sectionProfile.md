[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/profile](../README.md) / sectionProfile

# Function: sectionProfile()

> **sectionProfile**(`s`): `Float64Array`

Defined in: profile.ts:245

One cross-section of any shape, resampled, with the fluting applied along
the outward normal.

The fluting is shape-agnostic on purpose: the normal is computed from the
sampled points themselves, so an ellipse flutes exactly like a square does.

## Parameters

### s

[`SectionSpec`](../interfaces/SectionSpec.md)

section description

## Returns

`Float64Array`

flat `[x, y, …]` contour of `s.seg` points

## Example

```ts
import { sectionProfile } from '@core/profile';
const oval = sectionProfile({
  shape: 'oval', halfX: 45, halfY: 30, cornerR: 10, flutes: 32, fluteAmp: 1.1, seg: 256,
});
oval.length; // 512
```
