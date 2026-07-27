[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/params](../README.md) / specOf

# Function: specOf()

> **specOf**(`key`): [`ParamSpec`](../interfaces/ParamSpec.md)

Defined in: params.ts:224

Schema entry for a parameter.

## Parameters

### key

[`NumericParamKey`](../type-aliases/NumericParamKey.md)

parameter name

## Returns

[`ParamSpec`](../interfaces/ParamSpec.md)

the schema entry

## Throws

if the key is not in the schema — that means the schema and
  [Params](../interfaces/Params.md) drifted apart

## Example

```ts
import { specOf } from '@core/params';
specOf('topSize').max; // 200
```
