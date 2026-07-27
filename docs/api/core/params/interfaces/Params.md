[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/params](../README.md) / Params

# Interface: Params

Defined in: params.ts:19

Full parameter set of the generator.

## Properties

### mode

> **mode**: [`PotMode`](../type-aliases/PotMode.md)

Defined in: params.ts:21

Generation mode.

***

### topSize

> **topSize**: `number`

Defined in: params.ts:25

Outer width across the rim, mm.

***

### bottomSize

> **bottomSize**: `number`

Defined in: params.ts:27

Outer width across the base, mm. Smaller than `topSize` => pots nest.

***

### height

> **height**: `number`

Defined in: params.ts:29

Total height, mm.

***

### cornerR

> **cornerR**: `number`

Defined in: params.ts:31

Corner radius at the rim, mm. Scaled down with the section lower on.

***

### twist

> **twist**: `number`

Defined in: params.ts:33

Twist, degrees per mm of height. Non-zero breaks nesting.

***

### flutes

> **flutes**: `number`

Defined in: params.ts:37

Number of sine waves around the perimeter. 0 = smooth.

***

### fluteAmp

> **fluteAmp**: `number`

Defined in: params.ts:39

Radial amplitude of the fluting at the rim, mm.

***

### rimH

> **rimH**: `number`

Defined in: params.ts:43

Height of the flared lip, mm.

***

### rimFlare

> **rimFlare**: `number`

Defined in: params.ts:45

Extra outward offset at the very top, mm.

***

### seg

> **seg**: `number`

Defined in: params.ts:49

Points per cross-section.

***

### dz

> **dz**: `number`

Defined in: params.ts:51

Vertical sampling step, mm.

***

### nozzle

> **nozzle**: `number`

Defined in: params.ts:55

Nozzle diameter, mm.

***

### wallWidth

> **wallWidth**: `number`

Defined in: params.ts:57

Extrusion width — in vase mode this *is* the wall thickness, mm.

***

### layerH

> **layerH**: `number`

Defined in: params.ts:59

Layer height, mm.

***

### bottomLayers

> **bottomLayers**: `number`

Defined in: params.ts:61

Number of solid bottom layers.

***

### density

> **density**: `number`

Defined in: params.ts:63

Filament density, g/cm³.

***

### speed

> **speed**: `number`

Defined in: params.ts:65

Effective print speed for the time estimate, mm/s.

***

### pricePerGram

> **pricePerGram**: `number`

Defined in: params.ts:67

Filament price, ₽ per gram.

***

### wallThickness

> **wallThickness**: `number`

Defined in: params.ts:71

Wall thickness in shell mode, mm.

***

### bottomThickness

> **bottomThickness**: `number`

Defined in: params.ts:73

Bottom thickness in shell mode, mm.

***

### drainHoles

> **drainHoles**: `number`

Defined in: params.ts:75

Number of drainage holes in the bottom (shell mode).

***

### drainDia

> **drainDia**: `number`

Defined in: params.ts:77

Diameter of each drainage hole, mm.

***

### slots

> **slots**: `number`

Defined in: params.ts:79

Number of vertical air-pruning slots (shell mode). 0 = none.

***

### slotWidth

> **slotWidth**: `number`

Defined in: params.ts:81

Width of each slot, mm.

***

### slotHeight

> **slotHeight**: `number`

Defined in: params.ts:83

Height of each slot, mm.
