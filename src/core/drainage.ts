/**
 * Placement of the drainage holes.
 *
 * Shared by two consumers that must not disagree: the shell-mode mesh, which
 * cuts real holes, and the 2D bottom view, which marks where to put a hot
 * nail after a vase-mode print.
 *
 * @module core/drainage
 */

import type { Params } from './params';
import { sectionSizes } from './params';

/** Parameters the hole placement reads. */
export type DrainParams = Pick<
  Params,
  'shape' | 'bottomSize' | 'bottomSizeY' | 'topSize' | 'topSizeY' | 'drainHoles'
>;

/** A hole centre on the bottom, mm. */
export interface DrainPoint {
  x: number;
  y: number;
}

/**
 * Radius of the circle the holes sit on.
 *
 * Half way out from the axis: close enough to the middle that water finds
 * them, far enough from the wall that the fillet between wall and bottom is
 * not cut through.
 *
 * On an elongated bottom this is the narrow axis: it is the one that decides
 * whether a hole still clears the wall.
 *
 * @param params - parameters carrying the shape and the base sizes
 * @returns radius, mm
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { drainRingRadius } from '@core/drainage';
 * drainRingRadius(DEFAULT_PARAMS); // 17
 * ```
 */
export function drainRingRadius(params: Omit<DrainParams, 'drainHoles'>): number {
  const s = sectionSizes(params);
  return Math.min(s.bottomHalfX, s.bottomHalfY) * 0.5;
}

/**
 * Centres of the drainage holes, evenly spaced on the drain ring.
 *
 * The first hole sits on the diagonal rather than on an axis: the corners of
 * the bottom are the stiffest part, and a hole on the axis lands in the
 * middle of the flattest span.
 *
 * On an elongated bottom the ring stretches with it: holes on a circle would
 * bunch up in the middle of a 160×70 pot and leave the ends undrained.
 *
 * @param params - parameters carrying the shape, the base sizes and `drainHoles`
 * @returns hole centres; empty when no holes are requested
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { drainPoints } from '@core/drainage';
 * drainPoints(DEFAULT_PARAMS).length; // 4
 * ```
 */
export function drainPoints(params: DrainParams): DrainPoint[] {
  const count = Math.round(params.drainHoles);
  if (count <= 0) return [];
  const s = sectionSizes(params);
  const rx = s.bottomHalfX * 0.5;
  const ry = s.bottomHalfY * 0.5;
  const out: DrainPoint[] = [];
  for (let i = 0; i < count; i++) {
    const a = (2 * Math.PI * i) / count + Math.PI / 4;
    out.push({ x: rx * Math.cos(a), y: ry * Math.sin(a) });
  }
  return out;
}
