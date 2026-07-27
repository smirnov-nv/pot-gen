/**
 * Application shell: header, parameter panel, viewport, metrics column.
 *
 * @module ui/App
 */

import { useCallback, useMemo, useState } from 'react';
import { computeMetrics } from '../core/metrics';
import { stlFileName } from '../core/params';
import { validate } from '../core/validate';
import { usePotStore } from '../store/usePotStore';
import { ParamPanel } from './ParamPanel';
import { Viewport3D } from './Viewport3D';
import { useMeshWorker } from './useMeshWorker';

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
  const setView = usePotStore((s) => s.setView);

  const mesh = useMeshWorker(params);
  const [exportError, setExportError] = useState<string | null>(null);

  const metrics = useMemo(() => computeMetrics(params), [params]);
  const warnings = useMemo(() => validate(params, metrics), [params, metrics]);

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
      <header className="flex items-center gap-3 border-b border-edge bg-panel px-4 py-2">
        <h1 className="text-sm font-semibold text-slate-100">Генератор горшков</h1>

        <div className="flex overflow-hidden rounded border border-edge text-xs">
          {(['vase', 'shell'] as const).map((m) => (
            <button
              key={m}
              className={`px-2.5 py-1 ${
                params.mode === m ? 'bg-sky-600 text-white' : 'bg-panelalt text-slate-300'
              }`}
              onClick={() => setMode(m)}
            >
              {m === 'vase' ? 'Режим вазы' : 'Shell'}
            </button>
          ))}
        </div>

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
          <input type="checkbox" checked={view.grid} onChange={(e) => setView({ grid: e.target.checked })} />
          стол
        </label>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs tabular-nums text-slate-500">
            {mesh.triangleCount.toLocaleString('ru')} треугольников · {Math.round(mesh.ms)} мс
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
          <Viewport3D
            positions={mesh.positions}
            view={view}
            height={params.height}
            width={params.topSize}
          />
          {mesh.busy && (
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

        <aside className="w-80 shrink-0 overflow-y-auto border-l border-edge bg-panel p-3 text-xs">
          <div className="tabular-nums text-slate-300">
            <div>Объём: {metrics.usableVolumeL.toFixed(2)} л</div>
            <div>Филамент: {metrics.grams.toFixed(0)} г</div>
            <div>Слоёв: {metrics.layers}</div>
            <div>Время: ~{Math.round(metrics.minutes)} мин</div>
          </div>
          <ul className="mt-3 space-y-1">
            {warnings.map((w) => (
              <li key={w.id} className="text-slate-400">
                {w.text}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
