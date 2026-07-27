/**
 * Message protocol between the UI and the mesh worker.
 *
 * Kept in its own module so the UI can import the types without pulling the
 * worker (and with it the whole geometry core) into the main bundle.
 *
 * @module worker/protocol
 */

import type { Params } from '../core/params';

/** Work the worker can be asked to do. */
export type RequestKind = 'mesh' | 'stl';

/** UI -> worker. */
export interface WorkerRequest {
  /** Monotonic id; replies carry it back so stale results can be dropped. */
  id: number;
  kind: RequestKind;
  params: Params;
}

/** Worker -> UI. */
export type WorkerResponse =
  | { id: number; kind: 'progress'; phase: string; value: number }
  | { id: number; kind: 'mesh'; positions: Float32Array; triangleCount: number; ms: number }
  | { id: number; kind: 'stl'; buffer: ArrayBuffer; ms: number }
  | { id: number; kind: 'error'; message: string };
