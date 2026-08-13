[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/params](../README.md) / ParamSpec

# Interface: ParamSpec

Defined in: params.ts:156

Schema entry describing one numeric parameter.

## Properties

### key

> **key**: [`NumericParamKey`](../type-aliases/NumericParamKey.md)

Defined in: params.ts:158

Property name in [Params](Params.md).

***

### label

> **label**: `string`

Defined in: params.ts:160

Russian label shown in the UI.

***

### unit

> **unit**: `string`

Defined in: params.ts:162

Unit suffix (mm, °, шт, …). Empty for dimensionless values.

***

### min

> **min**: `number`

Defined in: params.ts:164

Inclusive lower bound.

***

### max

> **max**: `number`

Defined in: params.ts:166

Inclusive upper bound.

***

### step

> **step**: `number`

Defined in: params.ts:168

Slider/stepper increment.

***

### group

> **group**: [`ParamGroup`](../type-aliases/ParamGroup.md)

Defined in: params.ts:170

Panel section this parameter belongs to.

***

### description

> **description**: `string`

Defined in: params.ts:172

Russian one-line description; also used in the generated README table.

***

### shellOnly?

> `optional` **shellOnly?**: `boolean`

Defined in: params.ts:174

True when the parameter only affects shell mode.

***

### axisY?

> `optional` **axisY?**: `boolean`

Defined in: params.ts:176

True when the parameter only affects the shapes with an independent Y size.
