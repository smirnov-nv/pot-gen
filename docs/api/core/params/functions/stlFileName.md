[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/params](../README.md) / stlFileName

# Function: stlFileName()

> **stlFileName**(`params`): `string`

Defined in: params.ts:509

Builds the STL file name from the parameters.

The tray is named by its inner footprint — the number that decides which pot
fits into it — while the pot is named by its rim and its flute count.

## Parameters

### params

[`Params`](../interfaces/Params.md)

parameter set being exported

## Returns

`string`

file name such as `pot_90x90x95_f32.stl` or `tray_110x110x20.stl`

## Example

```ts
import { DEFAULT_PARAMS, stlFileName } from '@core/params';
stlFileName(DEFAULT_PARAMS); // "pot_90x90x95_f32.stl"
stlFileName({ ...DEFAULT_PARAMS, object: 'tray', trayClearance: 10 }); // "tray_110x110x20.stl"
```
