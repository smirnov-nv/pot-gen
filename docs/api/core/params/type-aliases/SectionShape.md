[**core/ — справочник API**](../../../README.md)

***

[core/ — справочник API](../../../README.md) / [core/params](../README.md) / SectionShape

# Type Alias: SectionShape

> **SectionShape** = `"square"` \| `"rect"` \| `"circle"` \| `"oval"`

Defined in: params.ts:26

Cross-section outline.

`square` and `circle` are the linked variants of `rect` and `oval`: they use
one size for both axes, so the Y controls disappear from the panel instead
of silently doing nothing. `square` is the default and reproduces the
original rounded-square pot exactly — the golden fixtures depend on it.
