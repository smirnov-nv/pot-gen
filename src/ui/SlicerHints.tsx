/**
 * Recommended slicer settings with a copy button.
 *
 * @module ui/SlicerHints
 */

import { useState } from 'react';
import type { Metrics } from '../core/metrics';
import type { Params } from '../core/params';
import { hintsToText, slicerHints } from '../core/slicer';

interface Props {
  params: Params;
  metrics: Metrics;
}

/**
 * Settings summary for the current parameters.
 *
 * @param props - parameters and their metrics
 * @returns the panel element
 */
export function SlicerHints({ params, metrics }: Props) {
  const hints = slicerHints(params, metrics);
  const [copied, setCopied] = useState(false);

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(hintsToText(hints));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied; the text is on screen anyway.
      setCopied(false);
    }
  };

  return (
    <section className="px-3 py-2 text-xs">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Настройки слайсера
        </h2>
        <button className="btn py-0.5" onClick={copy}>
          {copied ? 'скопировано' : 'копировать'}
        </button>
      </div>

      <dl className="space-y-1">
        {hints.map((h) => (
          <div key={h.label} className="leading-snug">
            <dt className="inline text-slate-400">{h.label}: </dt>
            <dd className="inline text-slate-100">{h.value}</dd>
            {h.why && <div className="text-[11px] text-slate-500">{h.why}</div>}
          </div>
        ))}
      </dl>
    </section>
  );
}
