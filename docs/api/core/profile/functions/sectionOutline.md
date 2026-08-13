[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/profile](../README.md) / sectionOutline

# Function: sectionOutline()

> **sectionOutline**(`shape`, `halfX`, `halfY`, `cornerR`, `n?`): `Float64Array`

Defined in: profile.ts:93

Dense sampling of any supported cross-section.

All four shapes are the same curve with two knobs — the two half sizes and
the exponent:

```text
x = ax · sign(cos t) · |cos t|^(2/k)
y = ay · sign(sin t) · |sin t|^(2/k)
```

A rounded rectangle derives `k` from the corner radius, exactly as the
square always did; an ellipse pins `k = 2`, which collapses the exponent to
1 and leaves the plain parametric ellipse. The corner radius is meaningless
for an ellipse and is ignored there rather than fudged.

With `ax === ay` and a rounded shape the output is bit-identical to the
original square sampling — the golden fixtures depend on that.

## Parameters

### shape

[`SectionShape`](../../params/type-aliases/SectionShape.md)

section outline

### halfX

`number`

half size along X, mm

### halfY

`number`

half size along Y, mm

### cornerR

`number`

corner radius, mm (floored at 0.5; ignored for ellipses)

### n?

`number` = `DENSE_SAMPLES`

number of samples in the dense pass

## Returns

`Float64Array`

flat `[x, y, …]` array of `n` points, counter-clockwise

## Example

```ts
import { sectionOutline } from '@core/profile';
const oval = sectionOutline('oval', 45, 30, 10);
oval.length; // 1440
```
