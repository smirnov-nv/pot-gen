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
  type ParamGroup,
  type ParamSpec,
  type Params,
} from '../core/params';

interface Props {
  params: Params;
  onChange: (key: ParamSpec['key'], value: number) => void;
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
  disabled,
}: Props & { group: ParamGroup; disabled: boolean }) {
  const [open, setOpen] = useState(group !== 'mesh' && group !== 'shell');
  const specs = PARAM_SCHEMA.filter((s) => s.group === group);

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
export function ParamPanel({ params, onChange }: Props) {
  return (
    <div className="h-full overflow-y-auto bg-panel">
      {GROUP_ORDER.map((group) => (
        <Section
          key={group}
          group={group}
          params={params}
          onChange={onChange}
          disabled={group === 'shell' && params.mode !== 'shell'}
        />
      ))}
    </div>
  );
}
