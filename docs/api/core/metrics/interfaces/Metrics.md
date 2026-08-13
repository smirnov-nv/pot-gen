[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/metrics](../README.md) / Metrics

# Interface: Metrics

Defined in: metrics.ts:24

Everything the metrics panel displays.

## Properties

### usableVolumeL

> **usableVolumeL**: `number`

Defined in: metrics.ts:26

Usable substrate volume, litres.

***

### grams

> **grams**: `number`

Defined in: metrics.ts:28

Filament mass, grams.

***

### cost

> **cost**: `number`

Defined in: metrics.ts:30

Filament cost, ₽.

***

### layers

> **layers**: `number`

Defined in: metrics.ts:32

Number of printed layers.

***

### minutes

> **minutes**: `number`

Defined in: metrics.ts:34

Rough print time, minutes.

***

### nestingPitch

> **nestingPitch**: `number`

Defined in: metrics.ts:36

How much a stack grows per added pot, mm.

***

### nestingCount

> **nestingCount**: `number`

Defined in: metrics.ts:38

Pots that fit in [STACK\_LIMIT\_MM](../variables/STACK_LIMIT_MM.md) of stacking height.

***

### wallAngleDeg

> **wallAngleDeg**: `number`

Defined in: metrics.ts:40

Wall inclination from vertical, degrees.

***

### rimPerimeter

> **rimPerimeter**: `number`

Defined in: metrics.ts:42

Perimeter of the rim section, mm.

***

### bottomPerimeter

> **bottomPerimeter**: `number`

Defined in: metrics.ts:44

Perimeter of the bottom section, mm.

***

### bottomArea

> **bottomArea**: `number`

Defined in: metrics.ts:46

Footprint area of the bottom, mm².

***

### flutePeriod

> **flutePeriod**: `number`

Defined in: metrics.ts:48

Wavelength of the fluting along the rim, mm. `Infinity` when smooth.

***

### effectiveWall

> **effectiveWall**: `number`

Defined in: metrics.ts:50

Wall thickness the estimate assumed, mm — differs per mode.
