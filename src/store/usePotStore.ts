/**
 * Application state: parameters, undo/redo history, view toggles and user
 * presets.
 *
 * Only `core/` types cross this boundary — the store knows nothing about
 * three.js, and `core/` knows nothing about the store.
 *
 * @module store/usePotStore
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_PARAMS,
  type NumericParamKey,
  type Params,
  type PotMode,
  type PotObject,
  type Preset,
  type SectionShape,
  clampParam,
  decodeParams,
  sanitizeParams,
} from '../core/params';

/** Viewport toggles. */
export interface ViewState {
  /** Centre pane tab. */
  tab: '3d' | '2d';
  /** Render as wireframe instead of matte. */
  wireframe: boolean;
  /** Clip the model on the XZ plane to look inside. */
  section: boolean;
  /** Show the build plate grid. */
  grid: boolean;
}

/** Consecutive edits closer than this collapse into one undo step, ms. */
const HISTORY_COALESCE_MS = 500;
/** Undo depth. Deep enough to walk back a session, cheap enough to persist. */
const HISTORY_LIMIT = 100;

interface PotStore {
  params: Params;
  view: ViewState;
  userPresets: Preset[];
  past: Params[];
  future: Params[];

  /** Sets one numeric parameter, clamped to its schema range. */
  setParam: (key: NumericParamKey, value: number) => void;
  /** Switches generation mode. */
  setMode: (mode: PotMode) => void;
  /** Switches the cross-section outline. */
  setShape: (shape: SectionShape) => void;
  /** Switches the object being previewed and exported: pot or tray. */
  setObject: (object: PotObject) => void;
  /** Replaces the whole parameter set (preset, import, shared link). */
  setParams: (params: Params) => void;
  /** Restores defaults. */
  reset: () => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  setView: (patch: Partial<ViewState>) => void;

  /** Stores the current parameters under a name. */
  savePreset: (name: string) => void;
  deletePreset: (id: string) => void;
  /** Replaces the user preset list wholesale (JSON import). */
  importPresets: (presets: Preset[]) => void;
}

/** Timestamp and key of the last edit, for history coalescing. */
let lastEdit = { key: '', at: 0 };

/** Pushes the previous state onto the undo stack, coalescing rapid edits. */
function pushHistory(state: PotStore, key: string): Partial<PotStore> {
  const now = Date.now();
  const coalesce = key !== '' && key === lastEdit.key && now - lastEdit.at < HISTORY_COALESCE_MS;
  lastEdit = { key, at: now };
  if (coalesce) return { future: [] };
  return {
    past: [...state.past, state.params].slice(-HISTORY_LIMIT),
    future: [],
  };
}

/** Parameters carried by the current URL hash, if any. */
function paramsFromHash(): Params | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#/, '');
  return hash ? decodeParams(hash) : null;
}

export const usePotStore = create<PotStore>()(
  persist(
    (set, get) => ({
      params: { ...DEFAULT_PARAMS },
      view: { tab: '3d', wireframe: false, section: false, grid: true },
      userPresets: [],
      past: [],
      future: [],

      setParam: (key, value) =>
        set((state) => ({
          ...pushHistory(state, key),
          params: { ...state.params, [key]: clampParam(key, value) },
        })),

      setMode: (mode) =>
        set((state) => ({
          ...pushHistory(state, 'mode'),
          params: { ...state.params, mode },
        })),

      setShape: (shape) =>
        set((state) => ({
          ...pushHistory(state, 'shape'),
          params: { ...state.params, shape },
        })),

      setObject: (object) =>
        set((state) => ({
          ...pushHistory(state, 'object'),
          params: { ...state.params, object },
        })),

      setParams: (params) =>
        set((state) => ({
          ...pushHistory(state, ''),
          params: sanitizeParams(params),
        })),

      reset: () =>
        set((state) => ({
          ...pushHistory(state, ''),
          params: { ...DEFAULT_PARAMS },
        })),

      undo: () =>
        set((state) => {
          const prev = state.past[state.past.length - 1];
          if (!prev) return {};
          lastEdit = { key: '', at: 0 };
          return {
            params: prev,
            past: state.past.slice(0, -1),
            future: [state.params, ...state.future].slice(0, HISTORY_LIMIT),
          };
        }),

      redo: () =>
        set((state) => {
          const next = state.future[0];
          if (!next) return {};
          lastEdit = { key: '', at: 0 };
          return {
            params: next,
            past: [...state.past, state.params].slice(-HISTORY_LIMIT),
            future: state.future.slice(1),
          };
        }),

      canUndo: () => get().past.length > 0,
      canRedo: () => get().future.length > 0,

      setView: (patch) => set((state) => ({ view: { ...state.view, ...patch } })),

      savePreset: (name) =>
        set((state) => {
          const trimmed = name.trim() || 'Без имени';
          const id = `u${Date.now().toString(36)}`;
          return { userPresets: [...state.userPresets, { id, name: trimmed, params: state.params }] };
        }),

      deletePreset: (id) =>
        set((state) => ({ userPresets: state.userPresets.filter((p) => p.id !== id) })),

      importPresets: (presets) =>
        set((state) => ({
          userPresets: [
            ...state.userPresets,
            ...presets.map((p, i) => ({
              id: `i${Date.now().toString(36)}${i}`,
              name: String(p.name ?? 'Импорт'),
              params: sanitizeParams(p.params),
            })),
          ],
        })),
    }),
    {
      name: 'potgen',
      // History is session-scoped: restoring an undo stack from last week
      // would let the user "undo" into a state they never saw this session.
      partialize: (state) => ({
        params: state.params,
        view: state.view,
        userPresets: state.userPresets,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<PotStore> | undefined;
        // A shared link must win over whatever localStorage remembers.
        const hashed = paramsFromHash();
        return {
          ...current,
          ...saved,
          params: hashed ?? sanitizeParams(saved?.params ?? current.params),
          view: { ...current.view, ...saved?.view },
          userPresets: (saved?.userPresets ?? []).map((p) => ({
            ...p,
            params: sanitizeParams(p.params),
          })),
        };
      },
    },
  ),
);
