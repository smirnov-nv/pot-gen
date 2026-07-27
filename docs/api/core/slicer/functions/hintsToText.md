[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/slicer](../README.md) / hintsToText

# Function: hintsToText()

> **hintsToText**(`hints`): `string`

Defined in: slicer.ts:131

Renders the hints as plain text for the clipboard.

## Parameters

### hints

readonly [`SlicerHint`](../interfaces/SlicerHint.md)[]

result of [slicerHints](slicerHints.md)

## Returns

`string`

text block, one setting per line

## Example

```ts
import { DEFAULT_PARAMS } from '@core/params';
import { slicerHints, hintsToText } from '@core/slicer';
hintsToText(slicerHints(DEFAULT_PARAMS)).split('\n').length > 5; // true
```
