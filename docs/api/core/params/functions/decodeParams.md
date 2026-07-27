[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/params](../README.md) / decodeParams

# Function: decodeParams()

> **decodeParams**(`hash`): [`Params`](../interfaces/Params.md)

Defined in: params.ts:369

Decodes a URL hash payload produced by [encodeParams](encodeParams.md).

Anything unparseable falls back to the default value rather than throwing:
a mangled link should still open the app.

## Parameters

### hash

`string`

hash payload, with or without the leading `#`

## Returns

[`Params`](../interfaces/Params.md)

a complete parameter set

## Example

```ts
import { decodeParams } from '@core/params';
decodeParams('#height=120').height; // 120
```
