[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/params](../README.md) / sectionSizes

# Function: sectionSizes()

> **sectionSizes**(`p`): [`SectionSizes`](../interfaces/SectionSizes.md)

Defined in: params.ts:158

Half sizes of the section, with the Y axis resolved.

On the linked shapes (`square`, `circle`) the Y parameters are ignored and
Y follows X, so every consumer can read one pair of numbers instead of
re-deriving the rule.

## Parameters

### p

`Pick`\<[`Params`](../interfaces/Params.md), `"shape"` \| `"topSize"` \| `"bottomSize"` \| `"topSizeY"` \| `"bottomSizeY"`\>

parameters carrying the shape and the sizes

## Returns

[`SectionSizes`](../interfaces/SectionSizes.md)

half sizes at the rim and at the base, mm

## Example

```ts
import { DEFAULT_PARAMS, sectionSizes } from '@core/params';
sectionSizes({ ...DEFAULT_PARAMS, shape: 'rect', topSizeY: 140 }).topHalfY; // 70
```
