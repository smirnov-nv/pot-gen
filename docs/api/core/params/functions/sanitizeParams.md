[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/params](../README.md) / sanitizeParams

# Function: sanitizeParams()

> **sanitizeParams**(`raw`): [`Params`](../interfaces/Params.md)

Defined in: params.ts:413

Normalises an arbitrary object into a valid parameter set.

Unknown keys are dropped, missing keys fall back to [DEFAULT\_PARAMS](../variables/DEFAULT_PARAMS.md),
and every numeric value goes through [clampParam](clampParam.md). Used for URL
hashes, imported JSON and persisted state — all three are untrusted input.

## Parameters

### raw

`unknown`

candidate object

## Returns

[`Params`](../interfaces/Params.md)

a complete, in-range parameter set

## Example

```ts
import { sanitizeParams } from '@core/params';
sanitizeParams({ topSize: 500, nope: 1 }).topSize; // 200
```
