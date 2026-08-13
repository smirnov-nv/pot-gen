/**
 * Application shell: header, parameter panel, viewport, metrics column.
 *
 * Data flows one way — store → core (rings, metrics, validation) → panels —
 * and the only writer is the store.
 *
 * @module ui/App
 */

import { useCallback, useMemo, useState } from 'react';
import { computeMetrics } from '../core/metrics';
import { stlFileName } from '../core/params';
import { buildRings } from '../core/profile';
import { trayMetrics } from '../core/tray';
import { validate } from '../core/validate';
import { usePotStore } from '../store/usePotStore';
import { MetricsPanel } from './MetricsPanel';
import { ParamPanel } from './ParamPanel';
import { PresetManager } from './PresetManager';
import { Section2D } from './Section2D';
import { SlicerHints } from './SlicerHints';
import { Viewport3D } from './Viewport3D';
import { WarningsPanel } from './WarningsPanel';
import { useMeshWorker } from './useMeshWorker';
import { useUndoShortcuts } from './useUndoShortcuts';
import { useUrlSync } from './useUrlSync';

/** Triggers a browser download for the generated file. */
function download(buffer: ArrayBuffer, name: string): void {
  const url = URL.createObjectURL(new Blob([buffer], { type: 'model/stl' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  // Revoking immediately would race the download in Safari; a tick is enough.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function App() {
  const params = usePotStore((s) => s.params);
  const view = usePotStore((s) => s.view);
  const setParam = usePotStore((s) => s.setParam);
  const setMode = usePotStore((s) => s.setMode);
  const setObject = usePotStore((s) => s.setObject);
  const setParams = usePotStore((s) => s.setParams);
  const setView = usePotStore((s) => s.setView);
  const undo = usePotStore((s) => s.undo);
  const redo = usePotStore((s) => s.redo);
  const canUndo = usePotStore((s) => s.past.length > 0);
  const canRedo = usePotStore((s) => s.future.length > 0);

  const mesh = useMeshWorker(params);
  const [exportError, setExportError] = useState<string | null>(null);

  useUrlSync(params, setParams);
  useUndoShortcuts(undo, redo);

  // Rings are cheap next to the full mesh and are needed by both the metrics
  // and the 2D views, so they are built once here rather than in each.
  const rings = useMemo(() => buildRings(params), [params]);
  const metrics = useMemo(() => computeMetrics(params, rings), [params, rings]);
  const warnings = useMemo(() => validate(params, metrics), [params, metrics]);
  const tray = useMemo(() => trayMetrics(params), [params]);
  const isTray = params.object === 'tray';

  const exportSTL = useCallback(async () => {
    setExportError(null);
    try {
      download(await mesh.requestSTL(params), stlFileName(params));
    } catch (error) {
      setExportError(error instanceof Error ? error.message : String(error));
    }
  }, [mesh, params]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-edge bg-panel px-4 py-2">
        <h1 className="text-sm font-semibold text-slate-100">Генератор горшков</h1>

        <div className="flex overflow-hidden rounded border border-edge text-xs">
          {(['pot', 'tray'] as const).map((o) => (
            <button
              key={o}
              className={`px-2.5 py-1 ${
                params.object === o ? 'bg-emerald-700 text-white' : 'bg-panelalt text-slate-300'
              }`}
              onClick={() => setObject(o)}
              title={
                o === 'pot'
                  ? 'Сам горшок'
                  : 'Неглубокий поддон под горшок: сплошное дно, без дренажа'
              }
            >
              {o === 'pot' ? 'Горшок' : 'Поддон'}
            </button>
          ))}
        </div>

        {/* The mode is a property of the pot; the tray is printed as an
            ordinary object either way, so the toggle greys out with it. */}
        <div
          className={`flex overflow-hidden rounded border border-edge text-xs ${
            isTray ? 'opacity-40' : ''
          }`}
          title={isTray ? 'Режим относится к горшку, поддон печатается как обычная модель' : undefined}
        >
          {(['vase', 'shell'] as const).map((m) => (
            <button
              key={m}
              className={`px-2.5 py-1 ${
                params.mode === m ? 'bg-sky-600 text-white' : 'bg-panelalt text-slate-300'
              }`}
              onClick={() => setMode(m)}
              title={
                m === 'vase'
                  ? 'Сплошное тело под spiral vase: один горшок за печать'
                  : 'Настоящая тонкостенная модель с дренажом: партия за печать'
              }
            >
              {m === 'vase' ? 'Режим вазы' : 'Shell'}
            </button>
          ))}
        </div>

        <div className="flex overflow-hidden rounded border border-edge text-xs">
          {(['3d', '2d'] as const).map((t) => (
            <button
              key={t}
              className={`px-2.5 py-1 ${
                view.tab === t ? 'bg-slate-700 text-white' : 'bg-panelalt text-slate-300'
              }`}
              onClick={() => setView({ tab: t })}
            >
              {t === '3d' ? '3D' : '2D'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-xs">
          <button className="btn" onClick={undo} disabled={!canUndo} title="Ctrl+Z">
            ↶
          </button>
          <button className="btn" onClick={redo} disabled={!canRedo} title="Ctrl+Shift+Z">
            ↷
          </button>
        </div>

        <PresetManager params={params} />

        {view.tab === '3d' && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={view.wireframe}
                onChange={(e) => setView({ wireframe: e.target.checked })}
              />
              каркас
            </label>
            <label className="flex items-center gap-1 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={view.section}
                onChange={(e) => setView({ section: e.target.checked })}
              />
              разрез XZ
            </label>
            <label className="flex items-center gap-1 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={view.grid}
                onChange={(e) => setView({ grid: e.target.checked })}
              />
              стол
            </label>
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs tabular-nums text-slate-500">
            {mesh.triangleCount.toLocaleString('ru')} тр. · {Math.round(mesh.ms)} мс
          </span>
          <button className="btn" onClick={exportSTL} disabled={mesh.stlProgress !== null}>
            {mesh.stlProgress === null ? 'Скачать STL' : `STL… ${Math.round(mesh.stlProgress * 100)} %`}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-72 shrink-0 border-r border-edge">
          <ParamPanel params={params} onChange={setParam} />
        </aside>

        <main className="relative min-w-0 flex-1">
          {view.tab === '3d' ? (
            <Viewport3D
              positions={mesh.positions}
              view={view}
              height={isTray ? tray.height : params.height}
              width={isTray ? tray.outerWidth : params.topSize}
            />
          ) : (
            <Section2D params={params} rings={rings} />
          )}

          {view.tab === '3d' && mesh.busy && (
            <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-xs text-slate-300">
              {mesh.phase || 'Считаю'}… {Math.round(mesh.progress * 100)} %
            </div>
          )}
          {(mesh.error ?? exportError) && (
            <div className="absolute bottom-3 left-3 rounded bg-red-900/80 px-2 py-1 text-xs text-red-100">
              {mesh.error ?? exportError}
            </div>
          )}
        </main>

        <aside className="w-80 shrink-0 overflow-y-auto border-l border-edge bg-panel">
          <MetricsPanel
            metrics={metrics}
            params={params}
            triangleCount={mesh.triangleCount}
            tray={tray}
          />
          <WarningsPanel warnings={warnings} showVaseNotes={!isTray && params.mode === 'vase'} />
          <SlicerHints params={params} metrics={metrics} />
        </aside>
      </div>
    </div>
  );
}
