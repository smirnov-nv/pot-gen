/**
 * Left-hand parameter panel.
 *
 * Controls are generated from `PARAM_SCHEMA`; there is no hand-written list
 * of fields anywhere, so a new parameter shows up here the moment it is added
 * to the schema.
 *
 * @module ui/ParamPanel
 */

import { useState } from 'react';
import {
  GROUP_TITLES,
  PARAM_SCHEMA,
  isAnisotropicShape,
  type ParamGroup,
  type ParamSpec,
  type Params,
  type SectionShape,
} from '../core/params';

interface Props {
  params: Params;
  onChange: (key: ParamSpec['key'], value: number) => void;
  onShapeChange: (shape: SectionShape) => void;
}

/** Section shapes in display order, with their Russian labels. */
const SHAPES: readonly (readonly [SectionShape, string, string])[] = [
  ['square', 'Квадрат', 'квадрат со скруглёнными углами — классический рассадный горшок'],
  ['rect', 'Прямоугольник', 'разные размеры по X и Y, углы скруглены'],
  ['circle', 'Круг', 'круглое сечение; радиус угла не применяется'],
  ['oval', 'Овал', 'эллипс с разными полуосями; радиус угла не применяется'],
];

/** Segmented control choosing the cross-section outline. */
function ShapePicker({
  shape,
  onChange,
}: {
  shape: SectionShape;
  onChange: (s: SectionShape) => void;
}) {
  return (
    <div className="px-3 py-1.5">
      <span className="mb-1 block text-[10px] uppercase tracking-wide text-slate-500">Сечение</span>
      <div className="grid grid-cols-4 overflow-hidden rounded border border-edge text-[11px]">
        {SHAPES.map(([key, label, title]) => (
          <button
            key={key}
            title={title}
            className={`px-1 py-1 ${
              shape === key ? 'bg-sky-600 text-white' : 'bg-panelalt text-slate-300'
            }`}
            onClick={() => onChange(key)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Panel sections in display order. */
const GROUP_ORDER: ParamGroup[] = ['shape', 'flute', 'rim', 'mesh', 'print', 'shell'];

function Field({
  spec,
  value,
  onChange,
}: {
  spec: ParamSpec;
  value: number;
  onChange: (v: number) => void;
}) {
  // While the box is being typed into, it shows exactly what was typed. Feeding
  // the clamped-and-snapped value back on every keystroke would make the field
  // unusable: "150" in a 40..250 field becomes 40 → 405 → 250, and "0.75" in a
  // 0.05-grid field never survives its own decimal point. The draft is dropped
  // on blur, when the canonical value takes over again.
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <label className="block px-3 py-1.5" title={spec.description}>
      <span className="field-label">
        <span className="text-slate-300">{spec.label}</span>
        <span className="flex items-center gap-1">
          <input
            className="num-input"
            type="number"
            value={draft ?? String(value)}
            min={spec.min}
            max={spec.max}
            step={spec.step}
            onChange={(e) => {
              const raw = e.target.value;
              setDraft(raw);
              // An empty or half-typed box ("", "-", "0.") is an intermediate
              // state, not a new value: the parameter keeps the last one.
              const parsed = Number(raw);
              if (raw.trim() !== '' && Number.isFinite(parsed)) onChange(parsed);
            }}
            onBlur={() => setDraft(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setDraft(null);
            }}
          />
          <span className="w-8 text-[10px] text-slate-500">{spec.unit}</span>
        </span>
      </span>
      <input
        className="mt-1 w-full accent-sky-500"
        type="range"
        value={value}
        min={spec.min}
        max={spec.max}
        step={spec.step}
        onChange={(e) => {
          setDraft(null);
          onChange(Number(e.target.value));
        }}
      />
    </label>
  );
}

function Section({
  group,
  params,
  onChange,
  onShapeChange,
  disabled,
}: Props & { group: ParamGroup; disabled: boolean }) {
  const [open, setOpen] = useState(group !== 'mesh' && group !== 'shell');
  // The Y sizes exist for every shape but only mean something on the ones with
  // two independent axes; showing them under "Круг" would invite editing a
  // number that changes nothing.
  const specs = PARAM_SCHEMA.filter(
    (s) => s.group === group && (!s.axisY || isAnisotropicShape(params.shape)),
  );

  return (
    <section className="border-b border-edge">
      <button
        className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium
          uppercase tracking-wide text-slate-400 hover:text-slate-200"
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          {GROUP_TITLES[group]}
          {disabled && <span className="ml-2 normal-case text-slate-600">(только в shell)</span>}
        </span>
        <span className="text-slate-600">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className={disabled ? 'pointer-events-none pb-2 opacity-40' : 'pb-2'}>
          {group === 'shape' && <ShapePicker shape={params.shape} onChange={onShapeChange} />}
          {specs.map((spec) => (
            <Field
              key={spec.key}
              spec={spec}
              value={params[spec.key]}
              onChange={(v) => onChange(spec.key, v)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Renders every parameter, grouped and collapsible.
 *
 * @param props - current parameters and the change handler
 * @returns the panel element
 */
export function ParamPanel({ params, onChange, onShapeChange }: Props) {
  return (
    <div className="h-full overflow-y-auto bg-panel">
      {GROUP_ORDER.map((group) => (
        <Section
          key={group}
          group={group}
          params={params}
          onChange={onChange}
          onShapeChange={onShapeChange}
          disabled={group === 'shell' && params.mode !== 'shell'}
        />
      ))}
    </div>
  );
}
