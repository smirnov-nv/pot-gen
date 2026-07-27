[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/metrics](../README.md) / Metrics

# Interface: Metrics

Defined in: metrics.ts:23

Everything the metrics panel displays.

## Properties

### usableVolumeL

> **usableVolumeL**: `number`

Defined in: metrics.ts:25

Usable substrate volume, litres.

***

### grams

> **grams**: `number`

Defined in: metrics.ts:27

Filament mass, grams.

***

### cost

> **cost**: `number`

Defined in: metrics.ts:29

Filament cost, ₽.

***

### layers

> **layers**: `number`

Defined in: metrics.ts:31

Number of printed layers.

***

### minutes

> **minutes**: `number`

Defined in: metrics.ts:33

Rough print time, minutes.

***

### nestingPitch

> **nestingPitch**: `number`

Defined in: metrics.ts:35

How much a stack grows per added pot, mm.

***

### nestingCount

> **nestingCount**: `number`

Defined in: metrics.ts:37

Pots that fit in [STACK\_LIMIT\_MM](../variables/STACK_LIMIT_MM.md) of stacking height.

***

### wallAngleDeg

> **wallAngleDeg**: `number`

Defined in: metrics.ts:39

Wall inclination from vertical, degrees.

***

### rimPerimeter

> **rimPerimeter**: `number`

Defined in: metrics.ts:41

Perimeter of the rim section, mm.

***

### bottomPerimeter

> **bottomPerimeter**: `number`

Defined in: metrics.ts:43

Perimeter of the bottom section, mm.

***

### bottomArea

> **bottomArea**: `number`

Defined in: metrics.ts:45

Footprint area of the bottom, mm².

***

### flutePeriod

> **flutePeriod**: `number`

Defined in: metrics.ts:47

Wavelength of the fluting along the rim, mm. `Infinity` when smooth.

***

### effectiveWall

> **effectiveWall**: `number`

Defined in: metrics.ts:49

Wall thickness the estimate assumed, mm — differs per mode.
