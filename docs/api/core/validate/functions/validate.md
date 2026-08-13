[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/validate](../README.md) / validate

# Function: validate()

> **validate**(`params`, `metrics?`): [`Warning`](../interfaces/Warning.md)[]

Defined in: validate.ts:85

Runs every rule against a parameter set.

Order is by severity, then by declaration: errors first, so the panel
leads with what actually blocks the print.

## Parameters

### params

[`Params`](../../params/interfaces/Params.md)

full parameter set

### metrics?

[`Metrics`](../../metrics/interfaces/Metrics.md) = `...`

metrics for the same parameters; recomputed if omitted

## Returns

[`Warning`](../interfaces/Warning.md)[]

triggered warnings, most severe first

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { validate } from '@core/validate';
validate({ ...DEFAULT_PARAMS, bottomSize: 120 }).some((w) => w.level === 'error'); // true
```
