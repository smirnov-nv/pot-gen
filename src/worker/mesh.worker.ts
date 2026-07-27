/**
 * Mesh generation worker.
 *
 * A 1024-point section over a 250 mm pot at dz = 0.2 is ~1.3 M triangles;
 * building that on the main thread freezes the UI for seconds and kills the
 * point of live sliders. Results come back as transferable buffers, so the
 * ~15 MB of positions is moved, not copied.
 *
 * @module worker/mesh.worker
 */

import { buildMesh } from '../core/build';
import { toFloat32 } from '../core/mesh';
import { writeBinarySTL } from '../core/stl';
import type { WorkerRequest, WorkerResponse } from './protocol';

const post = (msg: WorkerResponse, transfer: Transferable[] = []): void => {
  self.postMessage(msg, transfer);
};

self.onmessage = (event: MessageEvent<WorkerRequest>): void => {
  const { id, kind, params } = event.data;
  const started = performance.now();

  try {
    post({ id, kind: 'progress', phase: 'Строю сечения', value: 0.05 });
    const mesh = buildMesh(params);
    post({ id, kind: 'progress', phase: 'Триангуляция', value: 0.6 });

    if (kind === 'stl') {
      const buffer = writeBinarySTL(mesh);
      post({ id, kind: 'progress', phase: 'Пишу STL', value: 0.95 });
      post({ id, kind: 'stl', buffer, ms: performance.now() - started }, [buffer]);
      return;
    }

    const positions = toFloat32(mesh);
    post(
      { id, kind: 'mesh', positions, triangleCount: mesh.triangleCount, ms: performance.now() - started },
      [positions.buffer],
    );
  } catch (error) {
    post({ id, kind: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};
