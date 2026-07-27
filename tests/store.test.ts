// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS } from '../src/core/params';
import { usePotStore } from '../src/store/usePotStore';

/** Fresh store state before each case — the store is a module singleton. */
beforeEach(() => {
  usePotStore.setState({
    params: { ...DEFAULT_PARAMS },
    past: [],
    future: [],
    userPresets: [],
    view: { tab: '3d', wireframe: false, section: false, grid: true },
  });
});

/** Pushes an edit that will not coalesce with the previous one. */
function edit(key: 'height' | 'topSize' | 'cornerR', value: number): void {
  usePotStore.getState().setParam(key, value);
}

describe('parameters', () => {
  it('clamps values through the schema', () => {
    edit('topSize', 5000);
    expect(usePotStore.getState().params.topSize).toBe(200);
  });

  it('sanitizes whole sets', () => {
    usePotStore.getState().setParams({ ...DEFAULT_PARAMS, height: 1e6 });
    expect(usePotStore.getState().params.height).toBe(250);
  });

  it('switches mode', () => {
    usePotStore.getState().setMode('shell');
    expect(usePotStore.getState().params.mode).toBe('shell');
  });
});

describe('undo/redo', () => {
  it('walks back and forward through edits on different parameters', () => {
    edit('height', 120);
    edit('topSize', 100);
    expect(usePotStore.getState().params.topSize).toBe(100);

    usePotStore.getState().undo();
    expect(usePotStore.getState().params.topSize).toBe(DEFAULT_PARAMS.topSize);
    expect(usePotStore.getState().params.height).toBe(120);

    usePotStore.getState().undo();
    expect(usePotStore.getState().params.height).toBe(DEFAULT_PARAMS.height);

    usePotStore.getState().redo();
    expect(usePotStore.getState().params.height).toBe(120);
  });

  it('collapses a rapid drag on one slider into a single step', () => {
    for (let h = 100; h <= 140; h += 10) edit('height', h);
    expect(usePotStore.getState().params.height).toBe(140);
    usePotStore.getState().undo();
    expect(usePotStore.getState().params.height).toBe(DEFAULT_PARAMS.height);
  });

  it('does nothing when there is nothing to undo or redo', () => {
    usePotStore.getState().undo();
    usePotStore.getState().redo();
    expect(usePotStore.getState().params).toEqual(DEFAULT_PARAMS);
  });

  it('drops the redo stack once a new edit lands', () => {
    edit('height', 120);
    usePotStore.getState().undo();
    expect(usePotStore.getState().future).toHaveLength(1);
    edit('cornerR', 12);
    expect(usePotStore.getState().future).toHaveLength(0);
  });

  it('undoes a preset application in one step', () => {
    edit('height', 120);
    usePotStore.getState().setParams({ ...DEFAULT_PARAMS, topSize: 78, height: 82 });
    usePotStore.getState().undo();
    expect(usePotStore.getState().params.height).toBe(120);
  });
});

describe('presets', () => {
  it('saves, applies and deletes', () => {
    edit('height', 111);
    usePotStore.getState().savePreset('Мой');
    const preset = usePotStore.getState().userPresets[0]!;
    expect(preset.name).toBe('Мой');
    expect(preset.params.height).toBe(111);

    usePotStore.getState().deletePreset(preset.id);
    expect(usePotStore.getState().userPresets).toHaveLength(0);
  });

  it('names an unnamed preset rather than storing an empty string', () => {
    usePotStore.getState().savePreset('   ');
    expect(usePotStore.getState().userPresets[0]!.name).toBe('Без имени');
  });

  it('sanitizes imported presets', () => {
    usePotStore.getState().importPresets([
      { id: 'x', name: 'Импортированный', params: { ...DEFAULT_PARAMS, height: 9999 } },
    ]);
    expect(usePotStore.getState().userPresets[0]!.params.height).toBe(250);
  });
});

describe('view', () => {
  it('patches only what is given', () => {
    usePotStore.getState().setView({ wireframe: true });
    expect(usePotStore.getState().view.wireframe).toBe(true);
    expect(usePotStore.getState().view.grid).toBe(true);
  });
});
