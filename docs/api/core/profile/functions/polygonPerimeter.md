[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/profile](../README.md) / polygonPerimeter

# Function: polygonPerimeter()

> **polygonPerimeter**(`pts`): `number`

Defined in: profile.ts:470

Perimeter of a closed polygon.

## Parameters

### pts

`Float64Array`

flat `[x, y, …]` contour

## Returns

`number`

length, mm

## Example

```ts
import { polygonPerimeter } from '@core/profile';
polygonPerimeter(new Float64Array([0, 0, 2, 0, 2, 2, 0, 2])); // 8
```
