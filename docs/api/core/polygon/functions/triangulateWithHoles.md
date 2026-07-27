[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/polygon](../README.md) / triangulateWithHoles

# Function: triangulateWithHoles()

> **triangulateWithHoles**(`outer`, `holes?`): `Float64Array`

Defined in: polygon.ts:231

Triangulates a contour with holes.

## Parameters

### outer

`Float64Array`

flat `[x, y, …]` outer contour, any winding

### holes?

readonly `Float64Array`\<`ArrayBufferLike`\>[] = `[]`

flat contours strictly inside `outer` and not overlapping

## Returns

`Float64Array`

flat `[ax, ay, bx, by, cx, cy, …]`, every triangle counter-clockwise

## Throws

if a hole lies outside the outer contour, or if the polygon
  cannot be reduced — both mean the caller built an impossible shape

## Example

```ts
import { triangulateWithHoles } from '@core/polygon';
const square = new Float64Array([0, 0, 10, 0, 10, 10, 0, 10]);
triangulateWithHoles(square, []).length / 6; // 2
```
