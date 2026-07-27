[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/params](../README.md) / encodeParams

# Function: encodeParams()

> **encodeParams**(`params`): `string`

Defined in: params.ts:344

Encodes parameters into a URL hash payload.

Only values differing from [DEFAULT\_PARAMS](../variables/DEFAULT_PARAMS.md) are written, so a link to
the default pot stays short and a future added parameter does not
invalidate old links.

## Parameters

### params

[`Params`](../interfaces/Params.md)

parameter set to share

## Returns

`string`

hash payload without the leading `#`

## Example

```ts
import { DEFAULT_PARAMS, encodeParams } from '@core/params';
encodeParams({ ...DEFAULT_PARAMS, height: 120 }); // "height=120"
```
