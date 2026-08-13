/**
 * Metrics column.
 *
 * @module ui/MetricsPanel
 */

import type { Metrics } from '../core/metrics';
import { STACK_LIMIT_MM } from '../core/metrics';
import type { Params } from '../core/params';
import type { TrayMetrics } from '../core/tray';

interface Props {
  metrics: Metrics;
  params: Params;
  /** Triangle count of the mesh currently on screen. */
  triangleCount: number;
  /** Tray figures; shown instead of the pot ones when the tray is selected. */
  tray: TrayMetrics;
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1" title={hint}>
      <span className="text-slate-400">{label}</span>
      <span className="tabular-nums text-slate-100">{value}</span>
    </div>
  );
}

/**
 * Live numbers for the current parameters.
 *
 * @param props - metrics, parameters and mesh size
 * @returns the panel element
 */
export function MetricsPanel({ metrics, params, triangleCount, tray }: Props) {
  const stack = params.height + (metrics.nestingCount - 1) * metrics.nestingPitch;

  // The tray shares almost nothing with the pot: no nesting, no fluting, no
  // substrate. Showing the pot's numbers next to a tray on screen would be
  // worse than showing none.
  if (params.object === 'tray') {
    return (
      <section className="border-b border-edge px-3 py-2 text-xs">
        <h2 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Метрики поддона
        </h2>
        <Row
          label="Внутри"
          value={`${tray.innerWidth.toFixed(0)} × ${tray.innerWidth.toFixed(0)} мм`}
          hint={`Кромка горшка ${params.topSize} мм плюс зазор ${params.trayClearance} мм на сторону`}
        />
        <Row
          label="Снаружи"
          value={`${tray.outerWidth.toFixed(0)} × ${tray.outerWidth.toFixed(0)} × ${tray.height.toFixed(0)} мм`}
          hint="Габарит по дну; сверху шире на развал стенок"
        />
        <Row
          label="Ёмкость"
          value={`${tray.capacityL.toFixed(2)} л`}
          hint="Сколько воды держит поддон, залитый до кромки"
        />
        <Row label="Филамент" value={`${tray.grams.toFixed(0)} г`} hint="По объёму модели и плотности филамента" />
        <Row label="Стоимость" value={`${tray.cost.toFixed(1)} ₽`} hint={`${params.pricePerGram} ₽/г`} />
        <Row label="Слоёв" value={String(tray.layers)} hint={`при высоте слоя ${params.layerH} мм`} />
        <Row
          label="Время печати"
          value={`~${Math.round(tray.minutes)} мин`}
          hint="Грубая оценка: слои × периметр × число стенок / скорость"
        />
        <Row label="Треугольников" value={triangleCount.toLocaleString('ru')} />
      </section>
    );
  }

  return (
    <section className="border-b border-edge px-3 py-2 text-xs">
      <h2 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">Метрики</h2>
      <Row
        label="Полезный объём"
        value={`${metrics.usableVolumeL.toFixed(2)} л`}
        hint="Субстрат до уровня 12 мм ниже кромки, с поправкой на толщину стенки"
      />
      <Row label="Филамент" value={`${metrics.grams.toFixed(0)} г`} hint="Стенка + дно, по плотности филамента" />
      <Row label="Стоимость" value={`${metrics.cost.toFixed(1)} ₽`} hint={`${params.pricePerGram} ₽/г`} />
      <Row label="Слоёв" value={String(metrics.layers)} hint={`при высоте слоя ${params.layerH} мм`} />
      <Row
        label="Время печати"
        value={`~${Math.round(metrics.minutes)} мин`}
        hint="Грубая оценка: слои × средний периметр / скорость. Сверяйтесь со слайсером"
      />
      <Row
        label="Шаг вложения"
        value={`${metrics.nestingPitch.toFixed(1)} мм`}
        hint="Насколько растёт стопка при добавлении горшка — измерено опусканием копии до касания"
      />
      <Row
        label="В стопку 250 мм"
        value={`${metrics.nestingCount} шт (${stack.toFixed(0)} мм)`}
        hint={`Высота ${STACK_LIMIT_MM} мм — рабочая высота стола`}
      />
      <Row
        label="Угол стенки"
        value={`${metrics.wallAngleDeg.toFixed(1)}°`}
        hint="От вертикали. Больше 45° — свес"
      />
      <Row
        label="Период гофра"
        value={metrics.flutePeriod === Infinity ? 'гладко' : `${metrics.flutePeriod.toFixed(1)} мм`}
        hint="Длина волны по гладкому контуру кромки"
      />
      <Row label="Треугольников" value={triangleCount.toLocaleString('ru')} />
    </section>
  );
}
