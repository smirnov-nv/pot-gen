[**core/ — справочник API**](../../README.md)

***

[core/ — справочник API](../../README.md) / core/params

# core/params

Parameter schema, defaults, presets and the URL codec.

The schema is the single source of truth: the UI builds its controls from
it, the README parameter table is generated from it, and the URL codec
round-trips through it. Adding a parameter anywhere else is a bug.

## Interfaces

- [Params](interfaces/Params.md)
- [ParamSpec](interfaces/ParamSpec.md)
- [Preset](interfaces/Preset.md)

## Type Aliases

- [PotMode](type-aliases/PotMode.md)
- [ParamGroup](type-aliases/ParamGroup.md)
- [NumericParamKey](type-aliases/NumericParamKey.md)

## Variables

- [DEFAULT\_PARAMS](variables/DEFAULT_PARAMS.md)
- [PARAM\_SCHEMA](variables/PARAM_SCHEMA.md)
- [GROUP\_TITLES](variables/GROUP_TITLES.md)
- [BUILTIN\_PRESETS](variables/BUILTIN_PRESETS.md)

## Functions

- [specOf](functions/specOf.md)
- [clampParam](functions/clampParam.md)
- [sanitizeParams](functions/sanitizeParams.md)
- [encodeParams](functions/encodeParams.md)
- [decodeParams](functions/decodeParams.md)
- [stlFileName](functions/stlFileName.md)
