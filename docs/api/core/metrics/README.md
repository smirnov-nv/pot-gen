[**core/ — справочник API**](../../README.md)

***

[core/ — справочник API](../../README.md) / core/metrics

# core/metrics

Derived numbers shown in the metrics panel: substrate volume, filament
mass, cost, layer count, print time, nesting pitch and wall angle.

All of it is estimation. The only figure that is exact is the geometry;
everything downstream of the slicer (time above all) is a guess and the UI
says so.

## Interfaces

- [Metrics](interfaces/Metrics.md)

## Variables

- [STACK\_LIMIT\_MM](variables/STACK_LIMIT_MM.md)

## Functions

- [effectiveWall](functions/effectiveWall.md)
- [nestingPitch](functions/nestingPitch.md)
- [computeMetrics](functions/computeMetrics.md)
