import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS, type Params } from '../src/core/params';
import { VASE_MODE_NOTES, isPrintable, validate } from '../src/core/validate';

/** Ids fired for a parameter set. */
function ids(patch: Partial<Params>): string[] {
  return validate({ ...DEFAULT_PARAMS, ...patch }).map((w) => w.id);
}

/** Level of a specific rule, or undefined when it did not fire. */
function levelOf(patch: Partial<Params>, id: string): string | undefined {
  return validate({ ...DEFAULT_PARAMS, ...patch }).find((w) => w.id === id)?.level;
}

describe('validate — the table from SPEC section 6, rule by rule', () => {
  it('is silent on the defaults', () => {
    expect(validate(DEFAULT_PARAMS)).toEqual([]);
    expect(isPrintable(validate(DEFAULT_PARAMS))).toBe(true);
  });

  it('flute period below 3 mm is an error', () => {
    // 80 waves around a 78 mm pot: ~4 mm of perimeter per wave is fine, so
    // shrink the pot instead.
    expect(levelOf({ topSize: 40, bottomSize: 34, flutes: 80, fluteAmp: 0.1 }, 'flute-period')).toBe('error');
    expect(ids({})).not.toContain('flute-period');
  });

  it('amplitude above a third of the period is a warning', () => {
    expect(levelOf({ flutes: 60, fluteAmp: 4 }, 'flute-steep')).toBe('warning');
  });

  it('extrusion wider than the nozzle can produce is an error', () => {
    // Threshold is 2x the nozzle, not the 1.8x in SPEC section 6 — see
    // MAX_WIDTH_RATIO: the specified defaults 0.75/0.4 sit at 1.875 and would
    // otherwise flag themselves.
    expect(levelOf({ nozzle: 0.4, wallWidth: 0.75 }, 'wall-too-wide')).toBeUndefined();
    expect(levelOf({ nozzle: 0.4, wallWidth: 0.85 }, 'wall-too-wide')).toBe('error');
  });

  it('extrusion narrower than the nozzle is a warning', () => {
    expect(levelOf({ nozzle: 0.6, wallWidth: 0.5 }, 'wall-too-thin')).toBe('warning');
    expect(levelOf({ nozzle: 0.4, wallWidth: 0.4 }, 'wall-too-thin')).toBeUndefined();
  });

  it('a wall over 45° from vertical is a warning', () => {
    expect(levelOf({ topSize: 200, bottomSize: 40, height: 40 }, 'overhang')).toBe('warning');
    expect(levelOf({}, 'overhang')).toBeUndefined();
  });

  it('a bottom wider than the rim is an error', () => {
    expect(levelOf({ bottomSize: 120 }, 'inverted-taper')).toBe('error');
  });

  it('twist is reported as info, not as a failure', () => {
    expect(levelOf({ twist: 0.5 }, 'twist')).toBe('info');
    expect(isPrintable(validate({ ...DEFAULT_PARAMS, twist: 0.5 }))).toBe(true);
  });

  it('a corner radius over half the base is an error', () => {
    expect(levelOf({ bottomSize: 30, cornerR: 20 }, 'corner-collapse')).toBe('error');
  });

  it('a bottom thinner than 0.8 mm is a warning', () => {
    expect(levelOf({ bottomLayers: 2, layerH: 0.2 }, 'thin-bottom')).toBe('warning');
    expect(levelOf({ bottomLayers: 4, layerH: 0.28 }, 'thin-bottom')).toBeUndefined();
  });

  it('over 500k vertices is a warning', () => {
    expect(levelOf({ seg: 1024, dz: 0.2, height: 250 }, 'heavy-mesh')).toBe('warning');
    expect(levelOf({}, 'heavy-mesh')).toBeUndefined();
  });
});

describe('validate — shell mode', () => {
  const shell: Partial<Params> = { mode: 'shell' };

  it('warns about a wall thinner than two extrusion lines', () => {
    expect(levelOf({ ...shell, wallThickness: 1.0, wallWidth: 0.75 }, 'shell-wall-thin')).toBe('warning');
    expect(levelOf({ ...shell, wallThickness: 1.6, wallWidth: 0.75 }, 'shell-wall-thin')).toBeUndefined();
  });

  it('warns about a bottom under three layers', () => {
    expect(levelOf({ ...shell, bottomThickness: 0.6, layerH: 0.28 }, 'shell-bottom-thin')).toBe('warning');
  });

  it('errors when drainage eats the base', () => {
    expect(levelOf({ ...shell, drainHoles: 12, drainDia: 15 }, 'drain-too-big')).toBe('error');
    expect(levelOf({ ...shell, drainHoles: 4, drainDia: 5 }, 'drain-too-big')).toBeUndefined();
  });

  it('errors when slots would cut through the rim', () => {
    expect(levelOf({ ...shell, slots: 4, slotHeight: 95 }, 'slots-too-tall')).toBe('error');
    expect(levelOf({ ...shell, slots: 4, slotHeight: 40 }, 'slots-too-tall')).toBeUndefined();
  });

  it('does not apply the bottom-layers rule, which is vase-specific', () => {
    expect(levelOf({ ...shell, bottomLayers: 1, layerH: 0.2 }, 'thin-bottom')).toBeUndefined();
  });
});

describe('warning ordering and notes', () => {
  it('puts errors first and info last', () => {
    const levels = validate({
      ...DEFAULT_PARAMS,
      bottomSize: 120,
      twist: 0.5,
      bottomLayers: 1,
      layerH: 0.2,
    }).map((w) => w.level);
    expect(levels[0]).toBe('error');
    expect(levels[levels.length - 1]).toBe('info');
  });

  it('keeps ids unique per run', () => {
    const list = ids({ bottomSize: 120, twist: 0.5, seg: 1024, dz: 0.2, height: 250 });
    expect(new Set(list).size).toBe(list.length);
  });

  it('states the two permanent vase-mode limitations', () => {
    expect(VASE_MODE_NOTES).toHaveLength(2);
    expect(VASE_MODE_NOTES[0]).toMatch(/гвозд/);
    expect(VASE_MODE_NOTES[1]).toMatch(/один объект/);
  });
});

describe('validate — shell geometry limits', () => {
  const shell: Partial<Params> = { mode: 'shell' };

  it('warns when the drainage will not fit and gets dropped', () => {
    expect(levelOf({ ...shell, bottomSize: 40, drainDia: 15 }, 'drain-no-fit')).toBe('warning');
    expect(levelOf({ ...shell }, 'drain-no-fit')).toBeUndefined();
  });
});
