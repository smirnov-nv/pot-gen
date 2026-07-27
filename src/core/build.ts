/**
 * Mode dispatch: turns a parameter set into a mesh.
 *
 * Lives apart from `mesh.ts` so that `shell.ts` can build on the mesh
 * primitives without a cycle.
 *
 * @module core/build
 */

import type { Mesh } from './mesh';
import { buildVaseMesh } from './mesh';
import type { Params } from './params';
import { buildShellMesh } from './shell';

/**
 * Builds the mesh for the current mode.
 *
 * @param params - full parameter set
 * @returns triangle soup ready for display or STL export
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { buildMesh } from '@core/build';
 * buildMesh(DEFAULT_PARAMS).triangleCount > 0; // true
 * ```
 */
export function buildMesh(params: Params): Mesh {
  return params.mode === 'shell' ? buildShellMesh(params) : buildVaseMesh(params);
}
