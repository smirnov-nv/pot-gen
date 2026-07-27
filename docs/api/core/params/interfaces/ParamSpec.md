[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/params](../README.md) / ParamSpec

# Interface: ParamSpec

Defined in: params.ts:90

Schema entry describing one numeric parameter.

## Properties

### key

> **key**: [`NumericParamKey`](../type-aliases/NumericParamKey.md)

Defined in: params.ts:92

Property name in [Params](Params.md).

***

### label

> **label**: `string`

Defined in: params.ts:94

Russian label shown in the UI.

***

### unit

> **unit**: `string`

Defined in: params.ts:96

Unit suffix (mm, °, шт, …). Empty for dimensionless values.

***

### min

> **min**: `number`

Defined in: params.ts:98

Inclusive lower bound.

***

### max

> **max**: `number`

Defined in: params.ts:100

Inclusive upper bound.

***

### step

> **step**: `number`

Defined in: params.ts:102

Slider/stepper increment.

***

### group

> **group**: [`ParamGroup`](../type-aliases/ParamGroup.md)

Defined in: params.ts:104

Panel section this parameter belongs to.

***

### description

> **description**: `string`

Defined in: params.ts:106

Russian one-line description; also used in the generated README table.

***

### shellOnly?

> `optional` **shellOnly?**: `boolean`

Defined in: params.ts:108

True when the parameter only affects shell mode.
