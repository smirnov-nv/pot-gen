/**
 * Slicer settings summary.
 *
 * Produces the block of text the user pastes next to Bambu Studio while
 * setting up the print. It is plain text on purpose: profiles differ between
 * slicer versions, but the numbers do not.
 *
 * @module core/slicer
 */

import type { Metrics } from './metrics';
import { computeMetrics } from './metrics';
import type { Params } from './params';

/** One line of the summary. */
export interface SlicerHint {
  /** Setting name as it reads in the slicer UI. */
  label: string;
  /** Recommended value. */
  value: string;
  /** Why — the part that is worth reading twice. */
  why?: string;
}

/** Nozzle temperature window for PETG, °C. */
const PETG_NOZZLE_C = '245–250';
/** Bed temperature window for PETG, °C. */
const PETG_BED_C = '70–80';

/**
 * Builds the recommended slicer settings for the current parameters.
 *
 * @param params - full parameter set
 * @param metrics - metrics for the same parameters; recomputed if omitted
 * @returns hints in display order
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { slicerHints } from '@core/slicer';
 * slicerHints(DEFAULT_PARAMS)[0]!.label; // "Spiral vase (режим вазы)"
 * ```
 */
export function slicerHints(params: Params, metrics: Metrics = computeMetrics(params)): SlicerHint[] {
  const shell = params.mode === 'shell';
  const walls = Math.max(1, Math.round(params.wallThickness / params.wallWidth));

  const hints: SlicerHint[] = shell
    ? [
        {
          label: 'Spiral vase (режим вазы)',
          value: 'выключить',
          why: 'shell-модель уже тонкостенная, вазе тут делать нечего',
        },
        {
          label: 'Стенок / заполнение',
          value: `${walls} / 0 %`,
          why: `${params.wallThickness} мм стенки при ширине линии ${params.wallWidth} мм`,
        },
        {
          label: 'Слоёв дна / крышки',
          value: `${Math.max(3, Math.ceil(params.bottomThickness / params.layerH))} / 0`,
          why: 'верх открытый, крышка не нужна',
        },
      ]
    : [
        {
          label: 'Spiral vase (режим вазы)',
          value: 'включить',
          why: 'модель — сплошное тело, слайсер обведёт внешний контур одной спиралью',
        },
        {
          label: 'Ширина линии стенки',
          value: `${params.wallWidth} мм`,
          why: 'в режиме вазы это и есть толщина стенки',
        },
        {
          label: 'Слоёв дна',
          value: String(params.bottomLayers),
          why: `${(params.bottomLayers * params.layerH).toFixed(2)} мм — тоньше 0.8 мм PETG протекает`,
        },
      ];

  hints.push(
    { label: 'Высота слоя', value: `${params.layerH} мм`, why: `сопло ${params.nozzle} мм` },
    {
      label: 'Температура сопла',
      value: `${PETG_NOZZLE_C} °C`,
      why: 'PETG: ниже — слабая межслойная адгезия, выше — стрингинг',
    },
    { label: 'Стол', value: `${PETG_BED_C} °C`, why: 'PETG липнет к гладкому PEI намертво, клей-карандаш как разделитель' },
    {
      label: 'Обдув',
      value: '30–40 %',
      why: shell
        ? 'больше не надо: тонкая стенка держится на межслойной адгезии'
        : 'одностенка держится только на межслойной адгезии, сильный обдув её убивает',
    },
    { label: 'Скорость стенки', value: `${params.speed} мм/с`, why: 'из неё же считается оценка времени' },
    { label: 'Брим', value: 'не нужен', why: 'дно широкое и плоское, PETG держится сам' },
    {
      label: 'Объектов на столе',
      value: shell ? 'сколько влезет' : '1',
      why: shell
        ? 'ради этого shell-режим и сделан: партия за одну печать'
        : 'слайсеры не дают spiral vase больше чем на один объект',
    },
    {
      label: 'Ожидаемо',
      value: `~${metrics.grams.toFixed(0)} г, ~${Math.round(metrics.minutes)} мин, ${metrics.layers} слоёв`,
      why: 'оценка грубая, сверяйтесь со слайсером',
    },
  );

  return hints;
}

/**
 * Renders the hints as plain text for the clipboard.
 *
 * @param hints - result of {@link slicerHints}
 * @returns text block, one setting per line
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { slicerHints, hintsToText } from '@core/slicer';
 * hintsToText(slicerHints(DEFAULT_PARAMS)).split('\n').length > 5; // true
 * ```
 */
export function hintsToText(hints: readonly SlicerHint[]): string {
  return hints
    .map((h) => `${h.label}: ${h.value}${h.why ? `  — ${h.why}` : ''}`)
    .join('\n');
}
