[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/params](../README.md) / Params

# Interface: Params

Defined in: params.ts:42

Full parameter set of the generator.

## Properties

### mode

> **mode**: [`PotMode`](../type-aliases/PotMode.md)

Defined in: params.ts:44

Generation mode.

***

### shape

> **shape**: [`SectionShape`](../type-aliases/SectionShape.md)

Defined in: params.ts:46

Cross-section outline.

***

### object

> **object**: [`PotObject`](../type-aliases/PotObject.md)

Defined in: params.ts:48

Object the viewport, the metrics and the STL export refer to.

***

### topSize

> **topSize**: `number`

Defined in: params.ts:52

Outer width across the rim along X, mm.

***

### bottomSize

> **bottomSize**: `number`

Defined in: params.ts:54

Outer width across the base along X, mm. Smaller than `topSize` => pots nest.

***

### topSizeY

> **topSizeY**: `number`

Defined in: params.ts:56

Outer width across the rim along Y, mm. Ignored unless the shape is `rect`/`oval`.

***

### bottomSizeY

> **bottomSizeY**: `number`

Defined in: params.ts:58

Outer width across the base along Y, mm. Ignored unless the shape is `rect`/`oval`.

***

### height

> **height**: `number`

Defined in: params.ts:60

Total height, mm.

***

### cornerR

> **cornerR**: `number`

Defined in: params.ts:62

Corner radius at the rim, mm. Scaled down with the section lower on.

***

### twist

> **twist**: `number`

Defined in: params.ts:64

Twist, degrees per mm of height. Non-zero breaks nesting.

***

### flutes

> **flutes**: `number`

Defined in: params.ts:68

Number of sine waves around the perimeter. 0 = smooth.

***

### fluteAmp

> **fluteAmp**: `number`

Defined in: params.ts:70

Radial amplitude of the fluting at the rim, mm.

***

### rimH

> **rimH**: `number`

Defined in: params.ts:74

Height of the flared lip, mm.

***

### rimFlare

> **rimFlare**: `number`

Defined in: params.ts:76

Extra outward offset at the very top, mm.

***

### seg

> **seg**: `number`

Defined in: params.ts:80

Points per cross-section.

***

### dz

> **dz**: `number`

Defined in: params.ts:82

Vertical sampling step, mm.

***

### nozzle

> **nozzle**: `number`

Defined in: params.ts:86

Nozzle diameter, mm.

***

### wallWidth

> **wallWidth**: `number`

Defined in: params.ts:88

Extrusion width — in vase mode this *is* the wall thickness, mm.

***

### layerH

> **layerH**: `number`

Defined in: params.ts:90

Layer height, mm.

***

### bottomLayers

> **bottomLayers**: `number`

Defined in: params.ts:92

Number of solid bottom layers.

***

### density

> **density**: `number`

Defined in: params.ts:94

Filament density, g/cm³.

***

### speed

> **speed**: `number`

Defined in: params.ts:96

Effective print speed for the time estimate, mm/s.

***

### pricePerGram

> **pricePerGram**: `number`

Defined in: params.ts:98

Filament price, ₽ per gram.

***

### wallThickness

> **wallThickness**: `number`

Defined in: params.ts:102

Wall thickness in shell mode, mm.

***

### bottomThickness

> **bottomThickness**: `number`

Defined in: params.ts:104

Bottom thickness in shell mode, mm.

***

### drainHoles

> **drainHoles**: `number`

Defined in: params.ts:106

Number of drainage holes in the bottom (shell mode).

***

### drainDia

> **drainDia**: `number`

Defined in: params.ts:108

Diameter of each drainage hole, mm.

***

### slots

> **slots**: `number`

Defined in: params.ts:110

Number of vertical air-pruning slots (shell mode). 0 = none.

***

### slotWidth

> **slotWidth**: `number`

Defined in: params.ts:112

Width of each slot, mm.

***

### slotHeight

> **slotHeight**: `number`

Defined in: params.ts:114

Height of each slot, mm.

***

### trayHeight

> **trayHeight**: `number`

Defined in: params.ts:118

Height of the tray wall, mm.

***

### trayWall

> **trayWall**: `number`

Defined in: params.ts:120

Tray wall and floor thickness, mm.

***

### trayClearance

> **trayClearance**: `number`

Defined in: params.ts:122

Gap per side between the pot rim and the tray wall, mm.

***

### trayFlare

> **trayFlare**: `number`

Defined in: params.ts:124

Outward splay of the tray wall over its height, mm. Lets trays stack.
