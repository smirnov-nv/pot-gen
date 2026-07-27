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
 * @param params - parameters carrying `bottomSize`
 * @returns radius, mm
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { drainRingRadius } from '@core/drainage';
 * drainRingRadius(DEFAULT_PARAMS); // 17
 * ```
 */
export function drainRingRadius(params: Pick<Params, 'bottomSize'>): number {
  return params.bottomSize * 0.25;
}

/**
 * Centres of the drainage holes, evenly spaced on the drain ring.
 *
 * The first hole sits on the diagonal rather than on an axis: the corners of
 * the bottom are the stiffest part, and a hole on the axis lands in the
 * middle of the flattest span.
 *
 * @param params - parameters carrying `bottomSize` and `drainHoles`
 * @returns hole centres; empty when no holes are requested
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { drainPoints } from '@core/drainage';
 * drainPoints(DEFAULT_PARAMS).length; // 4
 * ```
 */
export function drainPoints(params: Pick<Params, 'bottomSize' | 'drainHoles'>): DrainPoint[] {
  const count = Math.round(params.drainHoles);
  if (count <= 0) return [];
  const r = drainRingRadius(params);
  const out: DrainPoint[] = [];
  for (let i = 0; i < count; i++) {
    const a = (2 * Math.PI * i) / count + Math.PI / 4;
    out.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
  }
  return out;
}
