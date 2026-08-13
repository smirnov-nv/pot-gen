/**
 * The tray: a shallow watertight dish the pot stands in.
 *
 * It is a separate model, not a mode of the pot. The pot is a printing
 * problem — one continuous contour, no drainage, fluting for stiffness; the
 * tray is a container problem — it must hold water, so the floor is solid and
 * has no holes at all, and the only thing it borrows from the pot is the rim
 * footprint it has to swallow.
 *
 * Geometry is built the same way as everything else: a stack of {@link Ring}s
 * fed to `triangulateRings`. The trick is that the stack is not monotone in z.
 * It walks up the outside, across the rim, back down the inside and stops at
 * the cavity floor, so the fan cap that `triangulateRings` puts on the last
 * ring becomes the floor of the dish and the cap on the first ring becomes the
 * outer underside. One closed manifold, no boolean operation, no special case.
 *
 * @module core/tray
 */

import type { Mesh } from './mesh';
import { meshVolume, triangulateRings } from './mesh';
import type { Params } from './params';
import type { Ring } from './profile';
import { baseProfile, polygonPerimeter, ringCount } from './profile';

/** Smallest corner radius the section generator is asked for, mm. */
const MIN_CORNER_R = 0.5;

/** Subset of {@link Params} the tray geometry actually reads. */
export type TrayParams = Pick<
  Params,
  'topSize' | 'cornerR' | 'seg' | 'trayHeight' | 'trayWall' | 'trayClearance' | 'trayFlare'
>;

/** Resolved tray geometry, mm. */
export interface TrayDims {
  /** Inner width at the floor — the footprint the pot has to fit into. */
  innerWidth: number;
  /** Outer width at the floor. */
  outerWidth: number;
  /** Inner width at the top of the wall, after the flare. */
  innerTopWidth: number;
  /** Outer width at the top of the wall, after the flare. */
  outerTopWidth: number;
  /** Floor thickness, mm — the cavity starts here. */
  floorZ: number;
  /** Overall height, mm. */
  height: number;
  /** Corner radius of the inner contour, mm. */
  innerCornerR: number;
}

/**
 * Resolves the four widths of the tray from the parameters.
 *
 * The inner footprint is the pot rim plus the clearance on each side — the
 * definition the file name and the `tray-tight` rule both rely on. The wall is
 * a constant horizontal offset outward from it, and the flare shifts both
 * contours outward by the same amount at the top, so the wall keeps its
 * thickness all the way up.
 *
 * @param p - parameters carrying the pot rim and the tray fields
 * @returns resolved widths and the floor level
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { trayDimensions } from '@core/tray';
 * trayDimensions({ ...DEFAULT_PARAMS, trayClearance: 10 }).innerWidth; // 110
 * ```
 */
export function trayDimensions(p: TrayParams): TrayDims {
  const innerHalf = p.topSize / 2 + p.trayClearance;
  const wall = p.trayWall;
  // A floor as thick as the wall is the printable choice, but a 5 mm rim with
  // a 5 mm wall would leave no cavity at all, so it never takes more than half
  // the height.
  const floorZ = Math.min(wall, p.trayHeight / 2);

  return {
    innerWidth: 2 * innerHalf,
    outerWidth: 2 * (innerHalf + wall),
    innerTopWidth: 2 * (innerHalf + p.trayFlare),
    outerTopWidth: 2 * (innerHalf + wall + p.trayFlare),
    floorZ,
    height: p.trayHeight,
    innerCornerR: Math.max(MIN_CORNER_R, p.cornerR),
  };
}

/**
 * Builds the ring stack of the tray, bottom-outside first.
 *
 * Four rings are enough and exact: every surface between them is either a
 * plane or a ruled surface of a linear flare, so intermediate levels would add
 * triangles without adding shape.
 *
 * Order — outer floor, outer rim, inner rim, cavity floor — is what makes the
 * caps land in the right places; see the module note.
 *
 * @param p - parameters carrying the pot rim and the tray fields
 * @returns rings in stack order, all with the same point count
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { buildTrayRings } from '@core/tray';
 * buildTrayRings(DEFAULT_PARAMS).length; // 4
 * ```
 */
export function buildTrayRings(p: TrayParams): Ring[] {
  const seg = ringCount(p);
  const d = trayDimensions(p);
  // The outer corner is the inner one grown by the wall: offsetting a rounded
  // square outward grows its radius by the offset, and matching that keeps the
  // wall thickness even round the corners instead of thick there and thin on
  // the flats.
  const outerCornerR = d.innerCornerR + p.trayWall;

  const section = (width: number, cornerR: number): Float64Array =>
    baseProfile(width / 2, cornerR, 0, 0, seg);

  return [
    { z: 0, pts: section(d.outerWidth, outerCornerR) },
    { z: d.height, pts: section(d.outerTopWidth, outerCornerR) },
    { z: d.height, pts: section(d.innerTopWidth, d.innerCornerR) },
    { z: d.floorZ, pts: section(d.innerWidth, d.innerCornerR) },
  ];
}

/**
 * Builds the tray mesh.
 *
 * @param p - parameters carrying the pot rim and the tray fields
 * @returns closed manifold triangle soup with a solid, hole-free floor
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { buildTrayMesh } from '@core/tray';
 * buildTrayMesh(DEFAULT_PARAMS).triangleCount > 0; // true
 * ```
 */
export function buildTrayMesh(p: TrayParams): Mesh {
  return triangulateRings(buildTrayRings(p));
}

/** Numbers the metrics panel shows for the tray. */
export interface TrayMetrics {
  /** Inner footprint, mm. */
  innerWidth: number;
  /** Outer footprint, mm. */
  outerWidth: number;
  /** Overall height, mm. */
  height: number;
  /** Water the dish holds up to the rim, litres. */
  capacityL: number;
  /** Printed material volume, mm³. */
  materialVolume: number;
  /** Filament mass, g. */
  grams: number;
  /** Filament cost, ₽. */
  cost: number;
  /** Number of printed layers. */
  layers: number;
  /** Rough print time, minutes. */
  minutes: number;
}

/**
 * Metrics of the tray for the current parameters.
 *
 * The material volume is the mesh volume, not an estimate: the tray is a
 * solid of a few hundred triangles, so integrating it exactly is cheaper than
 * arguing about a formula. Everything downstream of the slicer — the time
 * above all — is still a guess, exactly as for the pot.
 *
 * @param params - full parameter set
 * @returns numbers for the metrics panel
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { trayMetrics } from '@core/tray';
 * trayMetrics(DEFAULT_PARAMS).grams > 0; // true
 * ```
 */
export function trayMetrics(params: Params): TrayMetrics {
  const d = trayDimensions(params);
  const rings = buildTrayRings(params);
  const materialVolume = meshVolume(triangulateRings(rings));

  // Capacity: the cavity closed off at the rim is itself a solid of two rings,
  // so the same integrator gives it exactly instead of by a frustum formula.
  const capacity = meshVolume(triangulateRings([rings[3]!, rings[2]!]));

  const grams = (materialVolume / 1000) * params.density;
  const layers = Math.floor(d.height / params.layerH);
  // The tray is a plain object, not a vase: the slicer lays as many wall lines
  // as the thickness allows, and the floor is solid infill on top of that.
  const lines = Math.max(1, Math.round(params.trayWall / params.wallWidth));
  const perimeter = polygonPerimeter(rings[0]!.pts);
  const minutes = (layers * perimeter * lines) / params.speed / 60;

  return {
    innerWidth: d.innerWidth,
    outerWidth: d.outerWidth,
    height: d.height,
    capacityL: capacity / 1e6,
    materialVolume,
    grams,
    cost: grams * params.pricePerGram,
    layers,
    minutes,
  };
}
