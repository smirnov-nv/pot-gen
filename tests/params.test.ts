import { describe, expect, it } from 'vitest';
import {
  BUILTIN_PRESETS,
  DEFAULT_PARAMS,
  PARAM_SCHEMA,
  clampParam,
  decodeParams,
  encodeParams,
  sanitizeParams,
  specOf,
  stlFileName,
} from '../src/core/params';

describe('schema', () => {
  it('covers every numeric field of Params exactly once', () => {
    const keys = PARAM_SCHEMA.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);

    // The schema describes numeric fields only; `mode` and `shape` are enums
    // and are carried by hand through the store, the codec and the UI.
    const paramKeys = Object.keys(DEFAULT_PARAMS).filter(
      (k) => typeof DEFAULT_PARAMS[k as keyof typeof DEFAULT_PARAMS] === 'number',
    );
    expect([...keys].sort()).toEqual(paramKeys.sort());
  });

  it('keeps defaults inside their own declared range', () => {
    for (const spec of PARAM_SCHEMA) {
      const v = DEFAULT_PARAMS[spec.key];
      expect(v, spec.key).toBeGreaterThanOrEqual(spec.min);
      expect(v, spec.key).toBeLessThanOrEqual(spec.max);
    }
  });

  it('throws on an unknown key', () => {
    // @ts-expect-error deliberately outside the schema
    expect(() => specOf('nope')).toThrow();
  });
});

describe('clampParam', () => {
  it('clamps to the range', () => {
    expect(clampParam('topSize', 1e6)).toBe(200);
    expect(clampParam('topSize', -5)).toBe(40);
  });

  it('snaps flutes to multiples of four so 4-fold symmetry survives', () => {
    expect(clampParam('flutes', 31)).toBe(32);
    expect(clampParam('flutes', 30)).toBe(32);
    expect(clampParam('flutes', 29)).toBe(28);
  });

  it('falls back to the default on NaN', () => {
    expect(clampParam('height', Number.NaN)).toBe(DEFAULT_PARAMS.height);
  });

  it('does not leave float noise on the step grid', () => {
    expect(clampParam('fluteAmp', 1.1000000000000003)).toBe(1.1);
  });
});

describe('sanitizeParams', () => {
  it('drops unknown keys and fills the rest with defaults', () => {
    const p = sanitizeParams({ topSize: 120, bogus: 'x' });
    expect(p.topSize).toBe(120);
    expect(p.height).toBe(DEFAULT_PARAMS.height);
    expect('bogus' in p).toBe(false);
  });

  it('accepts numeric strings (URL hashes carry strings)', () => {
    expect(sanitizeParams({ height: '120' }).height).toBe(120);
  });

  it('rejects a bogus mode', () => {
    expect(sanitizeParams({ mode: 'wat' }).mode).toBe('vase');
    expect(sanitizeParams({ mode: 'shell' }).mode).toBe('shell');
  });

  it('survives junk input', () => {
    expect(sanitizeParams(null)).toEqual(DEFAULT_PARAMS);
    expect(sanitizeParams('nope')).toEqual(DEFAULT_PARAMS);
  });
});

describe('url codec', () => {
  it('emits nothing for the defaults', () => {
    expect(encodeParams({ ...DEFAULT_PARAMS })).toBe('');
  });

  it('round-trips a modified set', () => {
    const params = { ...DEFAULT_PARAMS, mode: 'shell' as const, height: 120, flutes: 40 };
    expect(decodeParams(encodeParams(params))).toEqual(params);
  });

  it('tolerates a mangled hash', () => {
    expect(decodeParams('#height=120&garbage&=&x=1').height).toBe(120);
  });

  it('accepts a hash with or without the leading #', () => {
    expect(decodeParams('#height=120')).toEqual(decodeParams('height=120'));
  });
});

describe('presets', () => {
  it('are sanitized and unique', () => {
    const ids = BUILTIN_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const preset of BUILTIN_PRESETS) {
      expect(sanitizeParams(preset.params)).toEqual(preset.params);
    }
  });
});

describe('stlFileName', () => {
  it('encodes size and flute count', () => {
    expect(stlFileName(DEFAULT_PARAMS)).toBe('pot_90x90x95_f32.stl');
  });

  it('marks shell exports', () => {
    expect(stlFileName({ ...DEFAULT_PARAMS, mode: 'shell' })).toBe('pot_90x90x95_f32_shell.stl');
  });
});
