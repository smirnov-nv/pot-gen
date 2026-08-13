[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/params](../README.md) / Params

# Interface: Params

Defined in: params.ts:39

Full parameter set of the generator.

## Properties

### mode

> **mode**: [`PotMode`](../type-aliases/PotMode.md)

Defined in: params.ts:41

Generation mode.

***

### shape

> **shape**: [`SectionShape`](../type-aliases/SectionShape.md)

Defined in: params.ts:43

Cross-section outline.

***

### topSize

> **topSize**: `number`

Defined in: params.ts:47

Outer width across the rim along X, mm.

***

### bottomSize

> **bottomSize**: `number`

Defined in: params.ts:49

Outer width across the base along X, mm. Smaller than `topSize` => pots nest.

***

### topSizeY

> **topSizeY**: `number`

Defined in: params.ts:51

Outer width across the rim along Y, mm. Ignored unless the shape is `rect`/`oval`.

***

### bottomSizeY

> **bottomSizeY**: `number`

Defined in: params.ts:53

Outer width across the base along Y, mm. Ignored unless the shape is `rect`/`oval`.

***

### height

> **height**: `number`

Defined in: params.ts:55

Total height, mm.

***

### cornerR

> **cornerR**: `number`

Defined in: params.ts:57

Corner radius at the rim, mm. Scaled down with the section lower on.

***

### twist

> **twist**: `number`

Defined in: params.ts:59

Twist, degrees per mm of height. Non-zero breaks nesting.

***

### flutes

> **flutes**: `number`

Defined in: params.ts:63

Number of sine waves around the perimeter. 0 = smooth.

***

### fluteAmp

> **fluteAmp**: `number`

Defined in: params.ts:65

Radial amplitude of the fluting at the rim, mm.

***

### rimH

> **rimH**: `number`

Defined in: params.ts:69

Height of the flared lip, mm.

***

### rimFlare

> **rimFlare**: `number`

Defined in: params.ts:71

Extra outward offset at the very top, mm.

***

### seg

> **seg**: `number`

Defined in: params.ts:75

Points per cross-section.

***

### dz

> **dz**: `number`

Defined in: params.ts:77

Vertical sampling step, mm.

***

### nozzle

> **nozzle**: `number`

Defined in: params.ts:81

Nozzle diameter, mm.

***

### wallWidth

> **wallWidth**: `number`

Defined in: params.ts:83

Extrusion width — in vase mode this *is* the wall thickness, mm.

***

### layerH

> **layerH**: `number`

Defined in: params.ts:85

Layer height, mm.

***

### bottomLayers

> **bottomLayers**: `number`

Defined in: params.ts:87

Number of solid bottom layers.

***

### density

> **density**: `number`

Defined in: params.ts:89

Filament density, g/cm³.

***

### speed

> **speed**: `number`

Defined in: params.ts:91

Effective print speed for the time estimate, mm/s.

***

### pricePerGram

> **pricePerGram**: `number`

Defined in: params.ts:93

Filament price, ₽ per gram.

***

### wallThickness

> **wallThickness**: `number`

Defined in: params.ts:97

Wall thickness in shell mode, mm.

***

### bottomThickness

> **bottomThickness**: `number`

Defined in: params.ts:99

Bottom thickness in shell mode, mm.

***

### drainHoles

> **drainHoles**: `number`

Defined in: params.ts:101

Number of drainage holes in the bottom (shell mode).

***

### drainDia

> **drainDia**: `number`

Defined in: params.ts:103

Diameter of each drainage hole, mm.

***

### slots

> **slots**: `number`

Defined in: params.ts:105

Number of vertical air-pruning slots (shell mode). 0 = none.

***

### slotWidth

> **slotWidth**: `number`

Defined in: params.ts:107

Width of each slot, mm.

***

### slotHeight

> **slotHeight**: `number`

Defined in: params.ts:109

Height of each slot, mm.
