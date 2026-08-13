[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/params](../README.md) / stlFileName

# Function: stlFileName()

> **stlFileName**(`params`): `string`

Defined in: params.ts:474

Builds the STL file name from the parameters.

## Parameters

### params

[`Params`](../interfaces/Params.md)

parameter set being exported

## Returns

`string`

file name such as `pot_90x90x95_f32.stl`

## Example

```ts
import { DEFAULT_PARAMS, stlFileName } from '@core/params';
stlFileName(DEFAULT_PARAMS); // "pot_90x90x95_f32.stl"
```
