[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/validate](../README.md) / isPrintable

# Function: isPrintable()

> **isPrintable**(`warnings`): `boolean`

Defined in: validate.ts:237

True when nothing blocks the print.

## Parameters

### warnings

readonly [`Warning`](../interfaces/Warning.md)[]

result of [validate](validate.md)

## Returns

`boolean`

`false` if any error-level rule fired

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { isPrintable, validate } from '@core/validate';
isPrintable(validate(DEFAULT_PARAMS)); // true
```
