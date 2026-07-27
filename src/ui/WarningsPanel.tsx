/**
 * Warnings column: triggered rules plus the permanent vase-mode notes.
 *
 * @module ui/WarningsPanel
 */

import type { Warning, WarningLevel } from '../core/validate';
import { VASE_MODE_NOTES } from '../core/validate';

interface Props {
  warnings: readonly Warning[];
  /** Vase-mode notes only make sense in vase mode. */
  showVaseNotes: boolean;
}

const STYLES: Record<WarningLevel, string> = {
  error: 'border-red-800 bg-red-950/60 text-red-200',
  warning: 'border-amber-800 bg-amber-950/50 text-amber-200',
  info: 'border-sky-900 bg-sky-950/40 text-sky-200',
};

const BADGE: Record<WarningLevel, string> = {
  error: 'ошибка',
  warning: 'внимание',
  info: 'к сведению',
};

/**
 * Lists everything that will bite during the print.
 *
 * @param props - triggered warnings and the mode flag
 * @returns the panel element
 */
export function WarningsPanel({ warnings, showVaseNotes }: Props) {
  return (
    <section className="border-b border-edge px-3 py-2 text-xs">
      <h2 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
        Предупреждения
      </h2>

      {warnings.length === 0 ? (
        <p className="py-1 text-slate-500">Ничего не мешает печати.</p>
      ) : (
        <ul className="space-y-1.5">
          {warnings.map((w) => (
            <li key={w.id} className={`rounded border px-2 py-1.5 leading-snug ${STYLES[w.level]}`}>
              <span className="mr-1 text-[10px] uppercase opacity-70">{BADGE[w.level]}</span>
              {w.text}
            </li>
          ))}
        </ul>
      )}

      {showVaseNotes && (
        <div className="mt-3 rounded border border-edge bg-panelalt px-2 py-1.5 text-slate-400">
          <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">
            Ограничения режима вазы
          </div>
          <ol className="list-inside list-decimal space-y-1 leading-snug">
            {VASE_MODE_NOTES.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
