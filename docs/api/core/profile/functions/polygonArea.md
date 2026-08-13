[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/profile](../README.md) / polygonArea

# Function: polygonArea()

> **polygonArea**(`pts`): `number`

Defined in: profile.ts:448

Area of a closed polygon via the shoelace formula.

## Parameters

### pts

`Float64Array`

flat `[x, y, …]` contour

## Returns

`number`

unsigned area, mm²

## Example

```ts
import { polygonArea } from '@core/profile';
polygonArea(new Float64Array([0, 0, 2, 0, 2, 2, 0, 2])); // 4
```
