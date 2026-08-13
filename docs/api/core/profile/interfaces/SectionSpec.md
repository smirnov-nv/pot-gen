[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/profile](../README.md) / SectionSpec

# Interface: SectionSpec

Defined in: profile.ts:209

One cross-section, fully described.

## Properties

### shape

> **shape**: [`SectionShape`](../../params/type-aliases/SectionShape.md)

Defined in: profile.ts:211

Section outline.

***

### halfX

> **halfX**: `number`

Defined in: profile.ts:213

Half size along X, mm.

***

### halfY

> **halfY**: `number`

Defined in: profile.ts:215

Half size along Y, mm.

***

### cornerR

> **cornerR**: `number`

Defined in: profile.ts:217

Corner radius, mm; ignored for ellipses.

***

### flutes

> **flutes**: `number`

Defined in: profile.ts:219

Number of waves around the perimeter; `<= 0` disables.

***

### fluteAmp

> **fluteAmp**: `number`

Defined in: profile.ts:221

Radial amplitude of the fluting, mm; `0` disables.

***

### seg

> **seg**: `number`

Defined in: profile.ts:223

Points in the output contour.
