[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/params](../README.md) / clampParam

# Function: clampParam()

> **clampParam**(`key`, `value`): `number`

Defined in: params.ts:284

Clamps a value into the schema range and snaps it to the step grid.

Snapping matters for `flutes`: the fluting only keeps 4-fold symmetry when
the wave count is a multiple of 4, and the step encodes exactly that.

## Parameters

### key

[`NumericParamKey`](../type-aliases/NumericParamKey.md)

parameter name

### value

`number`

raw value, possibly out of range or off-grid

## Returns

`number`

a value inside `[min, max]` aligned to `step`

## Example

```ts
import { clampParam } from '@core/params';
clampParam('flutes', 31); // 32
clampParam('topSize', 1e6); // 200
```
