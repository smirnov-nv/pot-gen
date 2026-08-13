// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS, type Params } from '../src/core/params';
import { usePotStore } from '../src/store/usePotStore';
import { App } from '../src/ui/App';

/**
 * Smoke test of the whole UI tree in a real (jsdom) DOM.
 *
 * Catches the class of breakage typecheck cannot: a component that throws on
 * first render, a panel wired to a field that no longer exists, a warning that
 * never reaches the screen. Rendering client-side rather than through
 * `renderToString` is deliberate — during server rendering zustand serves its
 * *initial* state, so every case would render the defaults.
 *
 * The 2D tab is used throughout: it exercises every panel and the geometry,
 * but not the WebGL canvas, which jsdom cannot provide.
 */

interface Globals {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
  ResizeObserver?: unknown;
  Worker?: unknown;
}
const g = globalThis as unknown as Globals;

g.IS_REACT_ACT_ENVIRONMENT = true;

// jsdom has neither of these; react-three-fiber needs the first even to be
// imported, and the mesh hook constructs the second on mount.
g.ResizeObserver ??= class {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
};
g.Worker ??= class {
  onmessage: unknown = null;
  postMessage(): void {}
  terminate(): void {}
};

/** Mounts the app with the given parameters and returns the rendered HTML. */
function mount(patch: Partial<Params> = {}, tab: '2d' | '3d' = '2d'): string {
  usePotStore.setState({
    params: { ...DEFAULT_PARAMS, ...patch },
    past: [],
    future: [],
    userPresets: [],
    view: { tab, wireframe: false, section: false, grid: true },
  });

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(<App />));
  const html = container.innerHTML;
  act(() => root.unmount());
  container.remove();
  return html;
}

beforeEach(() => {
  window.location.hash = '';
});

describe('App', () => {
  it('renders the parameter panel, metrics, warnings and the 2D views', () => {
    const html = mount();

    expect(html).toContain('Генератор горшков');
    expect(html).toContain('Ширина по кромке');
    expect(html).toContain('Полезный объём');
    expect(html).toContain('Предупреждения');
    expect(html).toContain('Настройки слайсера');
    expect(html).toContain('Ограничения режима вазы');
    expect(html).toContain('Сечение сверху');
    expect(html).toContain('Профиль сбоку');
  });

  it('shows live metrics rather than placeholders', () => {
    const html = mount();
    expect(html).toMatch(/0\.\d\d л/);
    expect(html).toContain('339');
  });

  it('writes the parameters into the URL hash', () => {
    mount({ height: 123 });
    expect(window.location.hash).toContain('height=123');
  });

  it('drops the vase-mode notes in shell mode and enables the shell group', () => {
    const html = mount({ mode: 'shell', slots: 4 });
    expect(html).not.toContain('Ограничения режима вазы');
    expect(html).toContain('Shell-режим');
    // The group is collapsed by default but no longer marked unavailable.
    expect(html).not.toContain('(только в shell)');
    // Slicer hints switch to the shell variant.
    expect(html).toContain('Стенок / заполнение');
  });

  it('shows the Y sizes only on the shapes that have two axes', () => {
    expect(mount()).not.toContain('Глубина по кромке');
    const oval = mount({ shape: 'oval', topSizeY: 60, bottomSizeY: 45 });
    expect(oval).toContain('Глубина по кромке');
    expect(oval).toContain('Овал');
  });

  it('surfaces validation errors for an impossible pot', () => {
    expect(mount({ bottomSize: 120 })).toContain('обратный конус');
  });

  it('marks the drainage points on the bottom view', () => {
    expect(mount()).toContain('дренаж');
  });

  it('mounts the 3D canvas on the 3D tab', () => {
    expect(mount({}, '3d')).toContain('<canvas');
  });
});
