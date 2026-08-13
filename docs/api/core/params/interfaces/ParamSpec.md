[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/params](../README.md) / ParamSpec

# Interface: ParamSpec

Defined in: params.ts:171

Schema entry describing one numeric parameter.

## Properties

### key

> **key**: [`NumericParamKey`](../type-aliases/NumericParamKey.md)

Defined in: params.ts:173

Property name in [Params](Params.md).

***

### label

> **label**: `string`

Defined in: params.ts:175

Russian label shown in the UI.

***

### unit

> **unit**: `string`

Defined in: params.ts:177

Unit suffix (mm, °, шт, …). Empty for dimensionless values.

***

### min

> **min**: `number`

Defined in: params.ts:179

Inclusive lower bound.

***

### max

> **max**: `number`

Defined in: params.ts:181

Inclusive upper bound.

***

### step

> **step**: `number`

Defined in: params.ts:183

Slider/stepper increment.

***

### group

> **group**: [`ParamGroup`](../type-aliases/ParamGroup.md)

Defined in: params.ts:185

Panel section this parameter belongs to.

***

### description

> **description**: `string`

Defined in: params.ts:187

Russian one-line description; also used in the generated README table.

***

### shellOnly?

> `optional` **shellOnly?**: `boolean`

Defined in: params.ts:189

True when the parameter only affects shell mode.

***

### axisY?

> `optional` **axisY?**: `boolean`

Defined in: params.ts:191

True when the parameter only affects the shapes with an independent Y size.
