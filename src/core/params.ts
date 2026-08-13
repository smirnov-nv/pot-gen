/**
 * Parameter schema, defaults, presets and the URL codec.
 *
 * The schema is the single source of truth: the UI builds its controls from
 * it, the README parameter table is generated from it, and the URL codec
 * round-trips through it. Adding a parameter anywhere else is a bug.
 *
 * @module core/params
 */

/** Generation mode. `vase` is a closed manifold solid for spiral-vase
 * printing; `shell` is a real thin-walled pot with drainage. */
export type PotMode = 'vase' | 'shell';

/** Which model is generated, previewed and exported. */
export type PotObject = 'pot' | 'tray';

/** UI grouping for a parameter — drives the collapsible panel sections. */
export type ParamGroup = 'shape' | 'flute' | 'rim' | 'mesh' | 'print' | 'shell' | 'tray';

/**
 * Cross-section outline.
 *
 * `square` and `circle` are the linked variants of `rect` and `oval`: they use
 * one size for both axes, so the Y controls disappear from the panel instead
 * of silently doing nothing. `square` is the default and reproduces the
 * original rounded-square pot exactly — the golden fixtures depend on it.
 */
export type SectionShape = 'square' | 'rect' | 'circle' | 'oval';

/** True when the section is an ellipse rather than a rounded rectangle. */
export function isRoundShape(shape: SectionShape): boolean {
  return shape === 'circle' || shape === 'oval';
}

/** True when the section takes an independent Y size. */
export function isAnisotropicShape(shape: SectionShape): boolean {
  return shape === 'rect' || shape === 'oval';
}

/** Full parameter set of the generator. */
export interface Params {
  /** Generation mode. */
  mode: PotMode;
  /** Cross-section outline. */
  shape: SectionShape;
  /** Object the viewport, the metrics and the STL export refer to. */
  object: PotObject;

  // -- shape ---------------------------------------------------------------
  /** Outer width across the rim along X, mm. */
  topSize: number;
  /** Outer width across the base along X, mm. Smaller than `topSize` => pots nest. */
  bottomSize: number;
  /** Outer width across the rim along Y, mm. Ignored unless the shape is `rect`/`oval`. */
  topSizeY: number;
  /** Outer width across the base along Y, mm. Ignored unless the shape is `rect`/`oval`. */
  bottomSizeY: number;
  /** Total height, mm. */
  height: number;
  /** Corner radius at the rim, mm. Scaled down with the section lower on. */
  cornerR: number;
  /** Twist, degrees per mm of height. Non-zero breaks nesting. */
  twist: number;

  // -- fluting -------------------------------------------------------------
  /** Number of sine waves around the perimeter. 0 = smooth. */
  flutes: number;
  /** Radial amplitude of the fluting at the rim, mm. */
  fluteAmp: number;

  // -- rim -----------------------------------------------------------------
  /** Height of the flared lip, mm. */
  rimH: number;
  /** Extra outward offset at the very top, mm. */
  rimFlare: number;

  // -- mesh resolution -----------------------------------------------------
  /** Points per cross-section. */
  seg: number;
  /** Vertical sampling step, mm. */
  dz: number;

  // -- print settings (metrics + shell mode) -------------------------------
  /** Nozzle diameter, mm. */
  nozzle: number;
  /** Extrusion width — in vase mode this *is* the wall thickness, mm. */
  wallWidth: number;
  /** Layer height, mm. */
  layerH: number;
  /** Number of solid bottom layers. */
  bottomLayers: number;
  /** Filament density, g/cm³. */
  density: number;
  /** Effective print speed for the time estimate, mm/s. */
  speed: number;
  /** Filament price, ₽ per gram. */
  pricePerGram: number;

  // -- shell mode ----------------------------------------------------------
  /** Wall thickness in shell mode, mm. */
  wallThickness: number;
  /** Bottom thickness in shell mode, mm. */
  bottomThickness: number;
  /** Number of drainage holes in the bottom (shell mode). */
  drainHoles: number;
  /** Diameter of each drainage hole, mm. */
  drainDia: number;
  /** Number of vertical air-pruning slots (shell mode). 0 = none. */
  slots: number;
  /** Width of each slot, mm. */
  slotWidth: number;
  /** Height of each slot, mm. */
  slotHeight: number;

  // -- tray ----------------------------------------------------------------
  /** Height of the tray wall, mm. */
  trayHeight: number;
  /** Tray wall and floor thickness, mm. */
  trayWall: number;
  /** Gap per side between the pot rim and the tray wall, mm. */
  trayClearance: number;
  /** Outward splay of the tray wall over its height, mm. Lets trays stack. */
  trayFlare: number;
}

/** Keys of {@link Params} that carry a number. */
export type NumericParamKey = Exclude<keyof Params, 'mode' | 'shape' | 'object'>;

/** Outer half sizes of the section at the rim and at the base, mm. */
export interface SectionSizes {
  /** Half width at the rim along X. */
  topHalfX: number;
  /** Half width at the rim along Y. */
  topHalfY: number;
  /** Half width at the base along X. */
  bottomHalfX: number;
  /** Half width at the base along Y. */
  bottomHalfY: number;
}

/**
 * Half sizes of the section, with the Y axis resolved.
 *
 * On the linked shapes (`square`, `circle`) the Y parameters are ignored and
 * Y follows X, so every consumer can read one pair of numbers instead of
 * re-deriving the rule.
 *
 * @param p - parameters carrying the shape and the sizes
 * @returns half sizes at the rim and at the base, mm
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS, sectionSizes } from '@core/params';
 * sectionSizes({ ...DEFAULT_PARAMS, shape: 'rect', topSizeY: 140 }).topHalfY; // 70
 * ```
 */
export function sectionSizes(
  p: Pick<Params, 'shape' | 'topSize' | 'bottomSize' | 'topSizeY' | 'bottomSizeY'>,
): SectionSizes {
  const linked = !isAnisotropicShape(p.shape);
  return {
    topHalfX: p.topSize / 2,
    topHalfY: (linked ? p.topSize : p.topSizeY) / 2,
    bottomHalfX: p.bottomSize / 2,
    bottomHalfY: (linked ? p.bottomSize : p.bottomSizeY) / 2,
  };
}

/** Schema entry describing one numeric parameter. */
export interface ParamSpec {
  /** Property name in {@link Params}. */
  key: NumericParamKey;
  /** Russian label shown in the UI. */
  label: string;
  /** Unit suffix (mm, °, шт, …). Empty for dimensionless values. */
  unit: string;
  /** Inclusive lower bound. */
  min: number;
  /** Inclusive upper bound. */
  max: number;
  /** Slider/stepper increment. */
  step: number;
  /** Panel section this parameter belongs to. */
  group: ParamGroup;
  /** Russian one-line description; also used in the generated README table. */
  description: string;
  /** True when the parameter only affects shell mode. */
  shellOnly?: boolean;
  /** True when the parameter only affects the shapes with an independent Y size. */
  axisY?: boolean;
}

/**
 * Defaults — the classic European P9 nursery pot (~0.5 L).
 *
 * Values match the `pot_p9_90x90x95` preset in `potgen.py`; the golden tests
 * depend on that.
 */
export const DEFAULT_PARAMS: Readonly<Params> = Object.freeze({
  mode: 'vase',
  shape: 'square',
  object: 'pot',

  topSize: 90,
  bottomSize: 68,
  // Equal to the X sizes so that switching to `rect`/`oval` starts from the
  // current pot rather than from a jump.
  topSizeY: 90,
  bottomSizeY: 68,
  height: 95,
  cornerR: 10,
  twist: 0,

  flutes: 32,
  fluteAmp: 1.1,

  rimH: 6,
  rimFlare: 1.3,

  seg: 256,
  dz: 0.5,

  nozzle: 0.4,
  wallWidth: 0.75,
  layerH: 0.28,
  bottomLayers: 4,
  density: 1.27,
  speed: 70,
  pricePerGram: 1.5,

  wallThickness: 1.5,
  bottomThickness: 1.6,
  drainHoles: 4,
  drainDia: 5,
  slots: 0,
  slotWidth: 3,
  slotHeight: 40,

  trayHeight: 20,
  trayWall: 2,
  trayClearance: 0,
  trayFlare: 3,
});

/**
 * The parameter schema. Order matters: the UI and the generated README table
 * both follow it.
 */
export const PARAM_SCHEMA: readonly ParamSpec[] = [
  // shape
  { key: 'topSize', label: 'Ширина по кромке', unit: 'мм', min: 40, max: 200, step: 1, group: 'shape', description: 'внешняя ширина по кромке' },
  { key: 'bottomSize', label: 'Ширина по дну', unit: 'мм', min: 30, max: 190, step: 1, group: 'shape', description: 'внешняя ширина по дну' },
  { key: 'topSizeY', label: 'Глубина по кромке', unit: 'мм', min: 40, max: 200, step: 1, group: 'shape', description: 'внешний размер по кромке вдоль Y', axisY: true },
  { key: 'bottomSizeY', label: 'Глубина по дну', unit: 'мм', min: 30, max: 190, step: 1, group: 'shape', description: 'внешний размер по дну вдоль Y', axisY: true },
  { key: 'height', label: 'Высота', unit: 'мм', min: 40, max: 250, step: 1, group: 'shape', description: 'высота' },
  { key: 'cornerR', label: 'Радиус угла', unit: 'мм', min: 2, max: 40, step: 0.5, group: 'shape', description: 'радиус угла по кромке' },
  { key: 'twist', label: 'Кручение', unit: '°/мм', min: -2, max: 2, step: 0.05, group: 'shape', description: 'кручение' },

  // fluting
  { key: 'flutes', label: 'Число волн', unit: 'шт', min: 0, max: 80, step: 4, group: 'flute', description: 'число волн гофра, 0 = гладко' },
  { key: 'fluteAmp', label: 'Амплитуда', unit: 'мм', min: 0, max: 4, step: 0.05, group: 'flute', description: 'амплитуда гофра' },

  // rim
  { key: 'rimH', label: 'Высота кромки', unit: 'мм', min: 0, max: 20, step: 0.5, group: 'rim', description: 'высота развальцованной кромки' },
  { key: 'rimFlare', label: 'Вылет кромки', unit: 'мм', min: 0, max: 5, step: 0.05, group: 'rim', description: 'вылет кромки наружу' },

  // mesh
  { key: 'seg', label: 'Точек на сечение', unit: 'шт', min: 64, max: 1024, step: 32, group: 'mesh', description: 'точек на сечение' },
  { key: 'dz', label: 'Шаг по высоте', unit: 'мм', min: 0.2, max: 2, step: 0.05, group: 'mesh', description: 'шаг по высоте' },

  // print
  { key: 'nozzle', label: 'Сопло', unit: 'мм', min: 0.2, max: 1.2, step: 0.05, group: 'print', description: 'диаметр сопла' },
  { key: 'wallWidth', label: 'Ширина экструзии', unit: 'мм', min: 0.2, max: 1.5, step: 0.05, group: 'print', description: 'ширина экструзии = толщина стенки в режиме вазы' },
  { key: 'layerH', label: 'Высота слоя', unit: 'мм', min: 0.08, max: 0.6, step: 0.02, group: 'print', description: 'высота слоя' },
  { key: 'bottomLayers', label: 'Слоёв дна', unit: 'шт', min: 1, max: 12, step: 1, group: 'print', description: 'сплошных слоёв дна' },
  { key: 'density', label: 'Плотность', unit: 'г/см³', min: 0.9, max: 2, step: 0.01, group: 'print', description: 'плотность филамента (PETG 1.27)' },
  { key: 'speed', label: 'Скорость', unit: 'мм/с', min: 10, max: 300, step: 5, group: 'print', description: 'эффективная скорость для оценки времени' },
  { key: 'pricePerGram', label: 'Цена филамента', unit: '₽/г', min: 0, max: 20, step: 0.1, group: 'print', description: 'цена филамента за грамм' },

  // shell
  { key: 'wallThickness', label: 'Толщина стенки', unit: 'мм', min: 0.4, max: 5, step: 0.05, group: 'shell', description: 'толщина стенки в режиме shell', shellOnly: true },
  { key: 'bottomThickness', label: 'Толщина дна', unit: 'мм', min: 0.4, max: 6, step: 0.05, group: 'shell', description: 'толщина дна в режиме shell', shellOnly: true },
  { key: 'drainHoles', label: 'Дренажных отверстий', unit: 'шт', min: 0, max: 12, step: 1, group: 'shell', description: 'число дренажных отверстий в дне', shellOnly: true },
  { key: 'drainDia', label: 'Диаметр отверстия', unit: 'мм', min: 2, max: 15, step: 0.5, group: 'shell', description: 'диаметр дренажного отверстия', shellOnly: true },
  { key: 'slots', label: 'Щелей', unit: 'шт', min: 0, max: 16, step: 4, group: 'shell', description: 'вертикальные щели для воздушной обрезки корней', shellOnly: true },
  { key: 'slotWidth', label: 'Ширина щели', unit: 'мм', min: 1, max: 10, step: 0.5, group: 'shell', description: 'ширина щели', shellOnly: true },
  { key: 'slotHeight', label: 'Высота щели', unit: 'мм', min: 5, max: 200, step: 1, group: 'shell', description: 'высота щели', shellOnly: true },

  // tray
  { key: 'trayHeight', label: 'Высота бортика', unit: 'мм', min: 5, max: 60, step: 1, group: 'tray', description: 'высота бортика поддона' },
  { key: 'trayWall', label: 'Толщина стенки', unit: 'мм', min: 0.8, max: 5, step: 0.1, group: 'tray', description: 'толщина стенки и дна поддона' },
  { key: 'trayClearance', label: 'Зазор на сторону', unit: 'мм', min: 0, max: 40, step: 1, group: 'tray', description: 'зазор на сторону между кромкой горшка и стенкой поддона' },
  { key: 'trayFlare', label: 'Развал стенок', unit: 'мм', min: 0, max: 15, step: 0.5, group: 'tray', description: 'развал стенок наружу, чтобы поддоны штабелировались' },
] as const;

/** Russian titles of the parameter groups, in panel order. */
export const GROUP_TITLES: Readonly<Record<ParamGroup, string>> = Object.freeze({
  shape: 'Форма',
  flute: 'Гофр',
  rim: 'Кромка',
  mesh: 'Сетка',
  print: 'Печать',
  shell: 'Shell-режим',
  tray: 'Поддон',
});

/** Lookup of schema entries by key. */
const SPEC_BY_KEY = new Map<NumericParamKey, ParamSpec>(
  PARAM_SCHEMA.map((s) => [s.key, s]),
);

/**
 * Schema entry for a parameter.
 *
 * @param key - parameter name
 * @returns the schema entry
 * @throws {Error} if the key is not in the schema — that means the schema and
 *   {@link Params} drifted apart
 *
 * @example
 * ```ts
 * import { specOf } from '@core/params';
 * specOf('topSize').max; // 200
 * ```
 */
export function specOf(key: NumericParamKey): ParamSpec {
  const spec = SPEC_BY_KEY.get(key);
  if (!spec) throw new Error(`no schema entry for parameter "${key}"`);
  return spec;
}

/** A named parameter set. */
export interface Preset {
  /** Stable id used in the URL and in localStorage. */
  id: string;
  /** Russian display name. */
  name: string;
  /** Full parameter set. */
  params: Params;
}

/**
 * Built-in presets. Both mirror the `PRESETS` dict in `potgen.py` so the
 * golden tests can compare against it directly.
 */
export const BUILTIN_PRESETS: readonly Preset[] = [
  {
    id: 'p9',
    name: 'P9 90×90×95',
    params: { ...DEFAULT_PARAMS },
  },
  {
    id: 'small',
    name: 'Small 78×78×82',
    params: {
      ...DEFAULT_PARAMS,
      topSize: 78,
      bottomSize: 58,
      height: 82,
      cornerR: 9,
      flutes: 28,
      fluteAmp: 1.0,
      rimH: 5,
      rimFlare: 1.2,
    },
  },
];

/**
 * Clamps a value into the schema range and snaps it to the step grid.
 *
 * Snapping matters for `flutes`: the fluting only keeps 4-fold symmetry when
 * the wave count is a multiple of 4, and the step encodes exactly that.
 *
 * @param key - parameter name
 * @param value - raw value, possibly out of range or off-grid
 * @returns a value inside `[min, max]` aligned to `step`
 *
 * @example
 * ```ts
 * import { clampParam } from '@core/params';
 * clampParam('flutes', 31); // 32
 * clampParam('topSize', 1e6); // 200
 * ```
 */
export function clampParam(key: NumericParamKey, value: number): number {
  const spec = specOf(key);
  if (!Number.isFinite(value)) return DEFAULT_PARAMS[key];
  const snapped = Math.round(value / spec.step) * spec.step;
  const clamped = Math.min(spec.max, Math.max(spec.min, snapped));
  // Step grids like 0.05 accumulate float noise; 6 digits is well beyond any
  // meaningful print resolution.
  return Math.round(clamped * 1e6) / 1e6;
}

/**
 * Normalises an arbitrary object into a valid parameter set.
 *
 * Unknown keys are dropped, missing keys fall back to {@link DEFAULT_PARAMS},
 * and every numeric value goes through {@link clampParam}. Used for URL
 * hashes, imported JSON and persisted state — all three are untrusted input.
 *
 * @param raw - candidate object
 * @returns a complete, in-range parameter set
 *
 * @example
 * ```ts
 * import { sanitizeParams } from '@core/params';
 * sanitizeParams({ topSize: 500, nope: 1 }).topSize; // 200
 * ```
 */
export function sanitizeParams(raw: unknown): Params {
  const out: Params = { ...DEFAULT_PARAMS };
  if (typeof raw !== 'object' || raw === null) return out;
  const src = raw as Record<string, unknown>;

  // Non-numeric fields are not in PARAM_SCHEMA — they are handled by hand.
  if (src['mode'] === 'shell' || src['mode'] === 'vase') out.mode = src['mode'];
  if (src['object'] === 'pot' || src['object'] === 'tray') out.object = src['object'];

  const shape = src['shape'];
  if (shape === 'square' || shape === 'rect' || shape === 'circle' || shape === 'oval') {
    out.shape = shape;
  }

  for (const spec of PARAM_SCHEMA) {
    const v = src[spec.key];
    if (typeof v === 'number') out[spec.key] = clampParam(spec.key, v);
    else if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v);
      if (Number.isFinite(n)) out[spec.key] = clampParam(spec.key, n);
    }
  }
  return out;
}

/**
 * Encodes parameters into a URL hash payload.
 *
 * Only values differing from {@link DEFAULT_PARAMS} are written, so a link to
 * the default pot stays short and a future added parameter does not
 * invalidate old links.
 *
 * @param params - parameter set to share
 * @returns hash payload without the leading `#`
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS, encodeParams } from '@core/params';
 * encodeParams({ ...DEFAULT_PARAMS, height: 120 }); // "height=120"
 * ```
 */
export function encodeParams(params: Params): string {
  const parts: string[] = [];
  if (params.mode !== DEFAULT_PARAMS.mode) parts.push(`mode=${params.mode}`);
  if (params.shape !== DEFAULT_PARAMS.shape) parts.push(`shape=${params.shape}`);
  if (params.object !== DEFAULT_PARAMS.object) parts.push(`object=${params.object}`);
  for (const spec of PARAM_SCHEMA) {
    const v = params[spec.key];
    if (v !== DEFAULT_PARAMS[spec.key]) parts.push(`${spec.key}=${v}`);
  }
  return parts.join('&');
}

/**
 * Decodes a URL hash payload produced by {@link encodeParams}.
 *
 * Anything unparseable falls back to the default value rather than throwing:
 * a mangled link should still open the app.
 *
 * @param hash - hash payload, with or without the leading `#`
 * @returns a complete parameter set
 *
 * @example
 * ```ts
 * import { decodeParams } from '@core/params';
 * decodeParams('#height=120').height; // 120
 * ```
 */
export function decodeParams(hash: string): Params {
  const payload = hash.startsWith('#') ? hash.slice(1) : hash;
  const raw: Record<string, unknown> = {};
  for (const pair of payload.split('&')) {
    if (!pair) continue;
    const eq = pair.indexOf('=');
    if (eq < 0) continue;
    raw[decodeURIComponent(pair.slice(0, eq))] = decodeURIComponent(pair.slice(eq + 1));
  }
  return sanitizeParams(raw);
}

/**
 * Builds the STL file name from the parameters.
 *
 * The tray is named by its inner footprint — the number that decides which pot
 * fits into it — while the pot is named by its rim and its flute count.
 *
 * @param params - parameter set being exported
 * @returns file name such as `pot_90x90x95_f32.stl` or `tray_110x110x20.stl`
 *
 * @example
 * ```ts
 * import { DEFAULT_PARAMS, stlFileName } from '@core/params';
 * stlFileName(DEFAULT_PARAMS); // "pot_90x90x95_f32.stl"
 * stlFileName({ ...DEFAULT_PARAMS, object: 'tray', trayClearance: 10 }); // "tray_110x110x20.stl"
 * ```
 */
export function stlFileName(params: Params): string {
  const n = (v: number): string => String(Math.round(v));
  const sizes = sectionSizes(params);
  if (params.object === 'tray') {
    // Same inner-size rule as `trayDimensions` in core/tray; kept inline so the
    // parameter module stays a leaf with no imports.
    const innerX = n(sizes.topHalfX * 2 + 2 * params.trayClearance);
    const innerY = n(sizes.topHalfY * 2 + 2 * params.trayClearance);
    return `tray_${innerX}x${innerY}x${n(params.trayHeight)}.stl`;
  }
  const base =
    `pot_${n(sizes.topHalfX * 2)}x${n(sizes.topHalfY * 2)}x${n(params.height)}` +
    `_f${n(params.flutes)}`;
  return params.mode === 'shell' ? `${base}_shell.stl` : `${base}.stl`;
}
