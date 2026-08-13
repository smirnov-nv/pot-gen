[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/metrics](../README.md) / computeMetrics

# Function: computeMetrics()

> **computeMetrics**(`params`, `rings?`): [`Metrics`](../interfaces/Metrics.md)

Defined in: metrics.ts:141

Computes every metric for a parameter set.

Rings are rebuilt here rather than taken from the worker mesh so the panel
stays live while a heavy mesh is still being generated.

## Parameters

### params

[`Params`](../../params/interfaces/Params.md)

full parameter set

### rings?

readonly [`Ring`](../../profile/interfaces/Ring.md)[] = `...`

optional pre-built rings, to avoid rebuilding them

## Returns

[`Metrics`](../interfaces/Metrics.md)

the metrics shown in the right-hand panel

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { computeMetrics } from '@core/metrics';
computeMetrics(DEFAULT_PARAMS).layers; // 339
```
