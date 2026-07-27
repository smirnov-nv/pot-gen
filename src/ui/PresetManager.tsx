/**
 * Presets, JSON import/export and the share link.
 *
 * @module ui/PresetManager
 */

import { useRef, useState } from 'react';
import { BUILTIN_PRESETS, type Params, type Preset, encodeParams, sanitizeParams } from '../core/params';
import { usePotStore } from '../store/usePotStore';

interface Props {
  params: Params;
}

/** Downloads a JSON file with the given name. */
function downloadJSON(data: unknown, name: string): void {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Preset bar: apply, save, delete, import, export, share.
 *
 * @param props - current parameters
 * @returns the toolbar element
 */
export function PresetManager({ params }: Props) {
  const userPresets = usePotStore((s) => s.userPresets);
  const setParams = usePotStore((s) => s.setParams);
  const savePreset = usePotStore((s) => s.savePreset);
  const deletePreset = usePotStore((s) => s.deletePreset);
  const importPresets = usePotStore((s) => s.importPresets);

  const fileInput = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState('');
  const [shared, setShared] = useState(false);

  const all: Preset[] = [...BUILTIN_PRESETS, ...userPresets];

  const apply = (id: string): void => {
    setSelected(id);
    const preset = all.find((p) => p.id === id);
    if (preset) setParams(preset.params);
  };

  const share = async (): Promise<void> => {
    const url = `${window.location.origin}${window.location.pathname}#${encodeParams(params)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1500);
    } catch {
      // Clipboard denied — the hash is in the address bar regardless.
      setShared(false);
    }
  };

  const importFile = async (file: File): Promise<void> => {
    const text = await file.text();
    const data: unknown = JSON.parse(text);
    // Accept both a preset list and a bare parameter set, since that is what
    // people end up pasting around.
    if (Array.isArray(data)) {
      importPresets(data as Preset[]);
    } else if (data && typeof data === 'object' && 'presets' in data) {
      importPresets((data as { presets: Preset[] }).presets);
    } else {
      setParams(sanitizeParams(data));
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <select
        className="rounded border border-edge bg-panelalt px-1.5 py-1 text-slate-200"
        value={selected}
        onChange={(e) => apply(e.target.value)}
      >
        <option value="">Пресеты…</option>
        {all.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <button
        className="btn"
        onClick={() => {
          const name = window.prompt('Название пресета');
          if (name !== null) savePreset(name);
        }}
      >
        Сохранить
      </button>

      <button
        className="btn"
        disabled={!selected || BUILTIN_PRESETS.some((p) => p.id === selected)}
        onClick={() => {
          deletePreset(selected);
          setSelected('');
        }}
      >
        Удалить
      </button>

      <button className="btn" onClick={() => downloadJSON(userPresets, 'potgen-presets.json')}>
        Экспорт JSON
      </button>

      <button className="btn" onClick={() => fileInput.current?.click()}>
        Импорт JSON
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void importFile(file);
          e.target.value = '';
        }}
      />

      <button className="btn" onClick={share}>
        {shared ? 'ссылка скопирована' : 'Ссылка'}
      </button>
    </div>
  );
}
