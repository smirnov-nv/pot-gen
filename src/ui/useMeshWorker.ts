/**
 * React binding for the mesh worker.
 *
 * Owns exactly one worker for the lifetime of the app, debounces parameter
 * changes and drops results whose request has been superseded — dragging a
 * slider must not queue thirty meshes.
 *
 * @module ui/useMeshWorker
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Params } from '../core/params';
import type { WorkerRequest, WorkerResponse } from '../worker/protocol';

/** Slider drags settle within this window before a rebuild starts, ms. */
const DEBOUNCE_MS = 120;

/** What the hook exposes to the viewport. */
export interface MeshState {
  /** Latest generated geometry, or `null` before the first result. */
  positions: Float32Array | null;
  triangleCount: number;
  /** Generation time of the last mesh, ms. */
  ms: number;
  /** A rebuild is in flight. */
  busy: boolean;
  /** Progress of the current job, 0…1. */
  progress: number;
  /** Human-readable phase, shown next to the progress bar. */
  phase: string;
  /** Error from the worker, if the last job failed. */
  error: string | null;
  /** Requests an STL for the given parameters; resolves with the file bytes. */
  requestSTL: (params: Params) => Promise<ArrayBuffer>;
  /** Progress of the STL job, 0…1, or `null` when none is running. */
  stlProgress: number | null;
}

/**
 * Keeps a mesh in sync with the parameters.
 *
 * @param params - current parameter set
 * @returns geometry, progress and the STL export entry point
 *
 * @example
 * ```tsx
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { useMeshWorker } from '@ui/useMeshWorker';
 * function Demo() {
 *   const { triangleCount } = useMeshWorker(DEFAULT_PARAMS);
 *   return <span>{triangleCount}</span>;
 * }
 * ```
 */
export function useMeshWorker(params: Params): MeshState {
  const workerRef = useRef<Worker | null>(null);
  const nextId = useRef(1);
  const meshRequestId = useRef(0);
  const stlWaiters = useRef(new Map<number, { resolve: (b: ArrayBuffer) => void; reject: (e: Error) => void }>());

  const [state, setState] = useState<Omit<MeshState, 'requestSTL'>>({
    positions: null,
    triangleCount: 0,
    ms: 0,
    busy: true,
    progress: 0,
    phase: '',
    error: null,
    stlProgress: null,
  });

  useEffect(() => {
    const worker = new Worker(new URL('../worker/mesh.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      const isStl = stlWaiters.current.has(msg.id);

      switch (msg.kind) {
        case 'progress':
          setState((s) =>
            isStl
              ? { ...s, stlProgress: msg.value }
              : msg.id === meshRequestId.current
                ? { ...s, progress: msg.value, phase: msg.phase }
                : s,
          );
          break;
        case 'mesh':
          // Stale reply: a newer request is already in flight.
          if (msg.id !== meshRequestId.current) break;
          setState((s) => ({
            ...s,
            positions: msg.positions,
            triangleCount: msg.triangleCount,
            ms: msg.ms,
            busy: false,
            progress: 1,
            phase: '',
            error: null,
          }));
          break;
        case 'stl': {
          const waiter = stlWaiters.current.get(msg.id);
          stlWaiters.current.delete(msg.id);
          setState((s) => ({ ...s, stlProgress: null }));
          waiter?.resolve(msg.buffer);
          break;
        }
        case 'error': {
          const waiter = stlWaiters.current.get(msg.id);
          if (waiter) {
            stlWaiters.current.delete(msg.id);
            setState((s) => ({ ...s, stlProgress: null }));
            waiter.reject(new Error(msg.message));
          } else {
            setState((s) => ({ ...s, busy: false, error: msg.message }));
          }
          break;
        }
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const worker = workerRef.current;
      if (!worker) return;
      const id = nextId.current++;
      meshRequestId.current = id;
      setState((s) => ({ ...s, busy: true, progress: 0, error: null }));
      const request: WorkerRequest = { id, kind: 'mesh', params };
      worker.postMessage(request);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [params]);

  const requestSTL = useCallback((p: Params): Promise<ArrayBuffer> => {
    const worker = workerRef.current;
    if (!worker) return Promise.reject(new Error('воркер не запущен'));
    const id = nextId.current++;
    return new Promise<ArrayBuffer>((resolve, reject) => {
      stlWaiters.current.set(id, { resolve, reject });
      setState((s) => ({ ...s, stlProgress: 0 }));
      const request: WorkerRequest = { id, kind: 'stl', params: p };
      worker.postMessage(request);
    });
  }, []);

  return { ...state, requestSTL };
}
