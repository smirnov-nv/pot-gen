/**
 * Printability rules.
 *
 * Every rule carries the reason, not just a verdict: the point is to teach
 * why a combination fails on the machine, so the next set of parameters is a
 * better guess rather than another blind attempt.
 *
 * @module core/validate
 */

import { drainRingRadius } from './drainage';
import type { Metrics } from './metrics';
import { computeMetrics } from './metrics';
import type { Params } from './params';
import { isRoundShape, sectionSizes } from './params';
import { estimateVertexCount } from './mesh';

/** Severity of a rule. `error` means it will not print. */
export type WarningLevel = 'error' | 'warning' | 'info';

/** One triggered rule. */
export interface Warning {
  /** Stable identifier, used in tests and as a React key. */
  id: string;
  /** Severity. */
  level: WarningLevel;
  /** Russian explanation of what goes wrong. */
  text: string;
}

/** Vertex budget above which the STL becomes unpleasant to handle. */
const VERTEX_BUDGET = 500_000;

/** Minimum wavelength a 0.4 nozzle can still resolve, mm. */
const MIN_FLUTE_PERIOD_MM = 3;

/**
 * Largest extrusion width a nozzle can produce, as a multiple of its
 * diameter.
 *
 * SPEC section 6 puts this at 1.8, but SPEC section 4 also ships the default
 * pair 0.75 mm / 0.4 mm = 1.875, so the specified defaults would trip their
 * own error. 0.75 on a 0.4 nozzle is routine in vase mode (Bambu's own vase
 * profile goes there), so the limit is the one the hardware actually has:
 * twice the nozzle diameter.
 */
const MAX_WIDTH_RATIO = 2.0;

/**
 * Rim aspect ratio above which the long wall stops holding its shape.
 *
 * 2.5:1 is where a 90 mm-class pot grows a flat span longer than its own
 * height; below that the corners still brace the wall.
 */
const MAX_ASPECT_RATIO = 2.5;

/**
 * Static notes about vase mode that are always true and always worth
 * repeating. Rendered as a permanent block under the warnings.
 */
export const VASE_MODE_NOTES: readonly string[] = [
  'Дренажные отверстия в режиме вазы не сделать — контур непрерывный. ' +
    'Горячий гвоздь 4 мм, 4 отверстия после печати.',
  'Bambu Studio / PrusaSlicer не дают spiral vase больше чем на один объект ' +
    'на столе. Партии печатаются последовательно.',
];

/**
 * Runs every rule against a parameter set.
 *
 * Order is by severity, then by declaration: errors first, so the panel
 * leads with what actually blocks the print.
 *
 * @param params - full parameter set
 * @param metrics - metrics for the same parameters; recomputed if omitted
 * @returns triggered warnings, most severe first
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { validate } from '@core/validate';
 * validate({ ...DEFAULT_PARAMS, bottomSize: 120 }).some((w) => w.level === 'error'); // true
 * ```
 */
export function validate(params: Params, metrics: Metrics = computeMetrics(params)): Warning[] {
  const out: Warning[] = [];
  const add = (id: string, level: WarningLevel, text: string): void => {
    out.push({ id, level, text });
  };

  const shell = params.mode === 'shell';

  if (params.flutes > 0 && metrics.flutePeriod < MIN_FLUTE_PERIOD_MM) {
    add(
      'flute-period',
      'error',
      `Период гофра ${metrics.flutePeriod.toFixed(1)} мм — сопло не отработает волну, получится каша. ` +
        'Уменьшите число волн или увеличьте горшок.',
    );
  }

  if (params.flutes > 0 && params.fluteAmp > metrics.flutePeriod / 3) {
    add(
      'flute-steep',
      'warning',
      `Амплитуда ${params.fluteAmp} мм при периоде ${metrics.flutePeriod.toFixed(1)} мм — ` +
        'слишком крутая волна, будут артефакты.',
    );
  }

  if (params.wallWidth > params.nozzle * MAX_WIDTH_RATIO) {
    add(
      'wall-too-wide',
      'error',
      `Ширина экструзии ${params.wallWidth} мм недостижима для сопла ${params.nozzle} мм ` +
        `(предел ≈ ${(params.nozzle * MAX_WIDTH_RATIO).toFixed(2)} мм).`,
    );
  }

  if (params.wallWidth < params.nozzle) {
    add(
      'wall-too-thin',
      'warning',
      `Ширина экструзии ${params.wallWidth} мм меньше сопла ${params.nozzle} мм — ` +
        'пойдёт продавливание, стенка будет рваной.',
    );
  }

  if (metrics.wallAngleDeg > 45) {
    add(
      'overhang',
      'warning',
      `Угол стенки ${metrics.wallAngleDeg.toFixed(1)}° от вертикали — свес, в режиме вазы поедет.`,
    );
  }

  const sizes = sectionSizes(params);
  if (sizes.bottomHalfX > sizes.topHalfX || sizes.bottomHalfY > sizes.topHalfY) {
    add(
      'inverted-taper',
      'error',
      'Дно шире кромки — обратный конус, вложение невозможно, да и печатать это свесом.',
    );
  }

  // Aspect ratio of the rim. A long flat wall has nothing bracing it: in vase
  // mode it is a single extrusion line and it bows inward as the pot cools.
  const aspect =
    Math.max(sizes.topHalfX, sizes.topHalfY) / Math.max(1e-6, Math.min(sizes.topHalfX, sizes.topHalfY));
  if (aspect > MAX_ASPECT_RATIO) {
    add(
      'aspect-extreme',
      'warning',
      `Сечение вытянуто ${aspect.toFixed(1)}:1 — длинная стенка ничем не раскреплена ` +
        'и втянется внутрь при остывании. Добавьте гофр или сократите разницу сторон.',
    );
  }

  if (params.twist !== 0) {
    add('twist', 'info', 'При кручении вложение работать не будет — горшки не сложатся в стопку.');
  }

  // An ellipse has no corners; the radius is not applied there at all, so the
  // rule would be a lie.
  const narrowBottomHalf = Math.min(sizes.bottomHalfX, sizes.bottomHalfY);
  if (!isRoundShape(params.shape) && params.cornerR > narrowBottomHalf) {
    add(
      'corner-collapse',
      'error',
      `Радиус угла ${params.cornerR} мм больше половины дна (${narrowBottomHalf} мм) — углы схлопываются.`,
    );
  }

  if (!shell && params.bottomLayers * params.layerH < 0.8) {
    add(
      'thin-bottom',
      'warning',
      `Дно ${(params.bottomLayers * params.layerH).toFixed(2)} мм — PETG протечёт по дну, ` +
        'ставьте не меньше 0.8 мм.',
    );
  }

  const vertices = estimateVertexCount(params);
  if (vertices > VERTEX_BUDGET) {
    add(
      'heavy-mesh',
      'warning',
      `${Math.round(vertices / 1000)}k вершин — тяжёлый STL, слайсер и превью будут тормозить.`,
    );
  }

  if (shell) {
    if (params.wallThickness < params.wallWidth * 2) {
      add(
        'shell-wall-thin',
        'warning',
        `Стенка ${params.wallThickness} мм — меньше двух ниток по ${params.wallWidth} мм, ` +
          'слайсер сведёт её к одной и прочности не будет.',
      );
    }

    if (params.bottomThickness < params.layerH * 3) {
      add(
        'shell-bottom-thin',
        'warning',
        `Дно ${params.bottomThickness} мм — меньше трёх слоёв по ${params.layerH} мм, протечёт.`,
      );
    }

    if (params.drainHoles > 0) {
      // Holes sit on a circle inside the bottom; if their footprint eats the
      // whole base there is nothing left to print on.
      const holeArea = params.drainHoles * Math.PI * (params.drainDia / 2) ** 2;
      if (holeArea > metrics.bottomArea * 0.4) {
        add(
          'drain-too-big',
          'error',
          `Дренаж съедает ${Math.round((holeArea / metrics.bottomArea) * 100)} % дна — дно развалится.`,
        );
      }
    }

    // Cavity half-width, as the mesh builder derives it. Holes that reach the
    // cavity wall are silently dropped by the builder, so say so here.
    const cavityHalf = narrowBottomHalf - params.wallThickness - params.fluteAmp;
    if (params.drainHoles > 0 && drainRingRadius(params) + params.drainDia / 2 >= cavityHalf - 1) {
      add(
        'drain-no-fit',
        'warning',
        `Дренаж ⌀${params.drainDia} мм не помещается в дно — отверстия не будут вырезаны. ` +
          'Уменьшите диаметр или увеличьте дно.',
      );
    }

    if (params.slots > 0 && params.slotHeight > params.height - params.rimH) {
      add(
        'slots-too-tall',
        'error',
        `Щели ${params.slotHeight} мм выше стенки под кромкой (${params.height - params.rimH} мм) — ` +
          'разрежут кромку.',
      );
    }
  }
  // Vase mode has no drainage rule here on purpose: it is not a property of
  // one parameter set but of the mode, and it lives in VASE_MODE_NOTES.

  const order: Record<WarningLevel, number> = { error: 0, warning: 1, info: 2 };
  return out.sort((a, b) => order[a.level] - order[b.level]);
}

/**
 * True when nothing blocks the print.
 *
 * @param warnings - result of {@link validate}
 * @returns `false` if any error-level rule fired
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS } from '@core/params';
 * import { isPrintable, validate } from '@core/validate';
 * isPrintable(validate(DEFAULT_PARAMS)); // true
 * ```
 */
export function isPrintable(warnings: readonly Warning[]): boolean {
  return !warnings.some((w) => w.level === 'error');
}
