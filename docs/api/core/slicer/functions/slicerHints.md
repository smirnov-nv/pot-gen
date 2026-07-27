[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/slicer](../README.md) / slicerHints

# Function: slicerHints()

> **slicerHints**(`params`, `metrics?`): [`SlicerHint`](../interfaces/SlicerHint.md)[]

Defined in: slicer.ts:44

Builds the recommended slicer settings for the current parameters.

## Parameters

### params

[`Params`](../../params/interfaces/Params.md)

full parameter set

### metrics?

[`Metrics`](../../metrics/interfaces/Metrics.md) = `...`

metrics for the same parameters; recomputed if omitted

## Returns

[`SlicerHint`](../interfaces/SlicerHint.md)[]

hints in display order

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { slicerHints } from '@core/slicer';
slicerHints(DEFAULT_PARAMS)[0]!.label; // "Spiral vase (режим вазы)"
```
