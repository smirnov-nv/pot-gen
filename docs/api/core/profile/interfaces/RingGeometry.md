[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/profile](../README.md) / RingGeometry

# Interface: RingGeometry

Defined in: profile.ts:342

Section parameters at one height, before the contour is generated.

## Properties

### half

> **half**: `number`

Defined in: profile.ts:344

Half width of the section along X, mm.

***

### halfY

> **halfY**: `number`

Defined in: profile.ts:346

Half width of the section along Y, mm. Equal to `half` on linked shapes.

***

### cornerR

> **cornerR**: `number`

Defined in: profile.ts:348

Corner radius at this height, mm.

***

### fluteAmp

> **fluteAmp**: `number`

Defined in: profile.ts:350

Flute amplitude at this height, mm.

***

### flareScale

> **flareScale**: `number`

Defined in: profile.ts:352

Outward scale along X applied by the rim flare; 1 below the lip.

***

### flareScaleY

> **flareScaleY**: `number`

Defined in: profile.ts:354

Outward scale along Y applied by the rim flare; 1 below the lip.

***

### twistAngle

> **twistAngle**: `number`

Defined in: profile.ts:356

Twist at this height, radians.
