/**
 * Derived numbers shown in the metrics panel: substrate volume, filament
 * mass, cost, layer count, print time, nesting pitch and wall angle.
 *
 * All of it is estimation. The only figure that is exact is the geometry;
 * everything downstream of the slicer (time above all) is a guess and the UI
 * says so.
 *
 * @module core/metrics
 */

import type { Params } from './params';
import { sectionSizes } from './params';
import type { Ring } from './profile';
import { buildRings, polygonArea, polygonPerimeter, sectionProfile } from './profile';

/** Distance below the rim that is not filled with substrate, mm. */
const HEADROOM_MM = 12;

/** Usable printer height for the nesting estimate, mm (P2S build volume). */
export const STACK_LIMIT_MM = 250;

/** Everything the metrics panel displays. */
export interface Metrics {
  /** Usable substrate volume, litres. */
  usableVolumeL: number;
  /** Filament mass, grams. */
  grams: number;
  /** Filament cost, ₽. */
  cost: number;
  /** Number of printed layers. */
  layers: number;
  /** Rough print time, minutes. */
  minutes: number;
  /** How much a stack grows per added pot, mm. */
  nestingPitch: number;
  /** Pots that fit in {@link STACK_LIMIT_MM} of stacking height. */
  nestingCount: number;
  /** Wall inclination from vertical, degrees. */
  wallAngleDeg: number;
  /** Perimeter of the rim section, mm. */
  rimPerimeter: number;
  /** Perimeter of the bottom section, mm. */
  bottomPerimeter: number;
  /** Footprint area of the bottom, mm². */
  bottomArea: number;
  /** Wavelength of the fluting along the rim, mm. `Infinity` when smooth. */
  flutePeriod: number;
  /** Wall thickness the estimate assumed, mm — differs per mode. */
  effectiveWall: number;
}

/**
 * Wall thickness the current mode actually prints.
 *
 * In vase mode the wall *is* one extrusion, so it equals `wallWidth`; in
 * shell mode it is the explicit `wallThickness`.
 *
 * @param p - parameters
 * @returns wall thickness, mm
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { effectiveWall } from '@core/metrics';
 * effectiveWall(DEFAULT_PARAMS); // 0.75
 * ```
 */
export function effectiveWall(p: Params): number {
  return p.mode === 'shell' ? p.wallThickness : p.wallWidth;
}

/**
 * Nesting pitch: how much a stack grows when one more pot is added.
 *
 * Computed from the real silhouette rather than from the taper formula —
 * the rim flare, not the cone, is what stops a nested pot, and a formula
 * would miss it. A copy is lowered ring by ring until its outer envelope
 * would touch the inner surface of the pot below.
 *
 * @param rings - ring stack of the pot
 * @param wall - wall thickness, mm
 * @returns pitch in mm; equals the full height if the shape cannot nest
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { buildRings } from '@core/profile';
 * import { nestingPitch } from '@core/metrics';
 * nestingPitch(buildRings(DEFAULT_PARAMS), 0.75) < DEFAULT_PARAMS.height; // true
 * ```
 */
export function nestingPitch(rings: readonly Ring[], wall: number): number {
  const n = rings.length;
  if (n < 2) return 0;
  const height = rings[n - 1]!.z;

  // Outer envelope radius per ring: the fluting crests and the flare are all
  // that can touch, so the maximum radius is the right summary.
  const radius = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const pts = rings[i]!.pts;
    let r = 0;
    for (let j = 0; j < pts.length; j += 2) {
      const d = Math.hypot(pts[j]!, pts[j + 1]!);
      if (d > r) r = d;
    }
    radius[i] = r;
  }

  for (let k = 1; k < n; k++) {
    let fits = true;
    for (let i = 0; i + k < n; i++) {
      if (radius[i]! > radius[i + k]! - wall) {
        fits = false;
        break;
      }
    }
    if (fits) return (height * k) / (n - 1);
  }
  return height;
}

/**
 * Computes every metric for a parameter set.
 *
 * Rings are rebuilt here rather than taken from the worker mesh so the panel
 * stays live while a heavy mesh is still being generated.
 *
 * @param params - full parameter set
 * @param rings - optional pre-built rings, to avoid rebuilding them
 * @returns the metrics shown in the right-hand panel
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { computeMetrics } from '@core/metrics';
 * computeMetrics(DEFAULT_PARAMS).layers; // 339
 * ```
 */
export function computeMetrics(params: Params, rings: readonly Ring[] = buildRings(params)): Metrics {
  const n = rings.length;
  const height = rings[n - 1]!.z;
  const wall = effectiveWall(params);
  const shell = params.mode === 'shell';

  let wallVolume = 0;
  let soilVolume = 0;
  let pathLength = 0;

  for (let i = 0; i < n - 1; i++) {
    const ring = rings[i]!;
    const h = rings[i + 1]!.z - ring.z;
    const per = polygonPerimeter(ring.pts);
    wallVolume += per * wall * h;
    pathLength += per;

    if (ring.z < height - HEADROOM_MM) {
      // Equivalent-radius shrink: offsetting the fluted polygon inward
      // properly would self-intersect in the troughs, and for a volume
      // estimate the area-equivalent circle is within a couple of percent.
      const area = polygonArea(ring.pts);
      const rEq = Math.sqrt(area / Math.PI);
      soilVolume += Math.PI * Math.max(0, rEq - wall) ** 2 * h;
    }
  }

  const bottomArea = polygonArea(rings[0]!.pts);
  const bottomThickness = shell ? params.bottomThickness : params.bottomLayers * params.layerH;
  let bottomVolume = bottomArea * bottomThickness;
  if (shell && params.drainHoles > 0) {
    bottomVolume -= params.drainHoles * Math.PI * (params.drainDia / 2) ** 2 * bottomThickness;
  }
  wallVolume += Math.max(0, bottomVolume);

  if (shell && params.slots > 0) {
    // Air-pruning slots are cut straight through the wall.
    wallVolume = Math.max(0, wallVolume - params.slots * params.slotWidth * params.slotHeight * wall);
  }

  const grams = (wallVolume / 1000) * params.density;
  const layers = Math.floor(height / params.layerH);
  const avgPerimeter = pathLength / (n - 1);
  // Shell mode lays several wall lines per layer; vase mode is one by
  // definition. Bottom layers and travel moves are ignored on purpose --
  // the panel labels this a rough estimate.
  const linesPerLayer = shell ? Math.max(1, Math.round(params.wallThickness / params.wallWidth)) : 1;
  const minutes = (layers * avgPerimeter * linesPerLayer) / params.speed / 60;

  const pitch = nestingPitch(rings, wall);
  const nestingCount = pitch > 0 ? Math.max(1, Math.floor((STACK_LIMIT_MM - height) / pitch) + 1) : 1;

  const rimPerimeter = polygonPerimeter(rings[n - 1]!.pts);
  const bottomPerimeter = polygonPerimeter(rings[0]!.pts);

  // Wavelength is measured on the *smooth* rim contour. Measuring it on the
  // fluted one is circular: a deep wave lengthens the path and makes its own
  // period look comfortably long, exactly when it is least printable.
  const sizes = sectionSizes(params);
  const smoothRim = polygonPerimeter(
    sectionProfile({
      shape: params.shape,
      halfX: sizes.topHalfX,
      halfY: sizes.topHalfY,
      cornerR: params.cornerR,
      flutes: 0,
      fluteAmp: 0,
      seg: Math.round(params.seg),
    }),
  );

  return {
    usableVolumeL: soilVolume / 1e6,
    grams,
    cost: grams * params.pricePerGram,
    layers,
    minutes,
    nestingPitch: pitch,
    nestingCount,
    // The steeper of the two axes: that is the wall the slicer has to hold up.
    wallAngleDeg:
      (Math.atan2(
        Math.max(sizes.topHalfX - sizes.bottomHalfX, sizes.topHalfY - sizes.bottomHalfY),
        params.height,
      ) *
        180) /
      Math.PI,
    rimPerimeter,
    bottomPerimeter,
    bottomArea,
    flutePeriod: params.flutes > 0 ? smoothRim / params.flutes : Infinity,
    effectiveWall: wall,
  };
}
