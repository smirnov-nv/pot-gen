/**
 * Generates the SVG figures used by docs/geometry.md.
 *
 * Drawing these by hand would guarantee they drift from the code; every
 * figure here is rendered from the actual geometry functions, so a change in
 * the maths shows up in the pictures.
 *
 * Usage: `pnpm docs:figures` (inside the container).
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_PARAMS, type Params } from '../src/core/params';
import { baseProfile, buildRings, superellipse } from '../src/core/profile';

const OUT = fileURLToPath(new URL('../docs/figures', import.meta.url));
mkdirSync(OUT, { recursive: true });

const INK = '#8ea6c0';
const ACCENT = '#f0a860';
const MUTED = '#5a6472';

/** SVG path through a flat contour, y flipped so +y points up on screen. */
function path(pts: Float64Array): string {
  let d = '';
  for (let i = 0; i < pts.length; i += 2) {
    d += `${i === 0 ? 'M' : 'L'}${pts[i]!.toFixed(2)} ${(-pts[i + 1]!).toFixed(2)}`;
  }
  return `${d}Z`;
}

function svg(body: string, half: number, caption: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-half} ${-half} ${half * 2} ${half * 2}" width="360" height="360" role="img" aria-label="${caption}">
<title>${caption}</title>
${body}
</svg>
`;
}

/** Two contours overlaid: reference in grey, variant in accent. */
function comparison(
  file: string,
  caption: string,
  reference: Float64Array,
  variant: Float64Array,
  half: number,
): void {
  const body = [
    `<path d="${path(reference)}" fill="none" stroke="${MUTED}" stroke-width="${half / 150}" stroke-dasharray="${half / 40} ${half / 60}"/>`,
    `<path d="${path(variant)}" fill="${INK}22" stroke="${INK}" stroke-width="${half / 110}"/>`,
  ].join('\n');
  writeFileSync(join(OUT, file), svg(body, half, caption));
  console.log(`figures: ${file}`);
}

/** Side silhouette from the ring stack. */
function silhouette(file: string, caption: string, params: Params): void {
  const rings = buildRings(params);
  const radius = rings.map((ring) => {
    let r = 0;
    for (let i = 0; i < ring.pts.length; i += 2) {
      r = Math.max(r, Math.hypot(ring.pts[i]!, ring.pts[i + 1]!));
    }
    return r;
  });
  const maxR = Math.max(...radius);
  const h = params.height;
  const right = rings.map((r, i) => `${radius[i]!.toFixed(2)} ${(h - r.z).toFixed(2)}`);
  const left = rings
    .map((_, i) => rings.length - 1 - i)
    .map((i) => `${(-radius[i]!).toFixed(2)} ${(h - rings[i]!.z).toFixed(2)}`);

  const body = [
    `<path d="M${right.join('L')}L${left.join('L')}Z" fill="${INK}22" stroke="${INK}" stroke-width="${h / 220}"/>`,
    `<line x1="${-maxR * 1.1}" y1="${h}" x2="${maxR * 1.1}" y2="${h}" stroke="${ACCENT}" stroke-width="${h / 260}"/>`,
  ].join('\n');

  const doc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-maxR * 1.15} ${-h * 0.05} ${maxR * 2.3} ${h * 1.12}" width="300" height="360" role="img" aria-label="${caption}">
<title>${caption}</title>
${body}
</svg>
`;
  writeFileSync(join(OUT, file), doc);
  console.log(`figures: ${file}`);
}

const half = DEFAULT_PARAMS.topSize / 2;
const frame = half * 1.35;
const smooth = baseProfile(half, DEFAULT_PARAMS.cornerR, 0, 0, DEFAULT_PARAMS.seg);

// --- superellipse exponent --------------------------------------------------
comparison(
  'corner-r.svg',
  'Радиус угла: 4 мм против 24 мм',
  baseProfile(half, 24, 0, 0, 256),
  baseProfile(half, 4, 0, 0, 256),
  frame,
);

// --- arc-length resampling --------------------------------------------------
{
  const dense = superellipse(half, 4, 96);
  const even = baseProfile(half, 4, 0, 0, 96);
  const dots = (pts: Float64Array, color: string): string => {
    let s = '';
    for (let i = 0; i < pts.length; i += 2) {
      s += `<circle cx="${pts[i]!.toFixed(2)}" cy="${(-pts[i + 1]!).toFixed(2)}" r="${frame / 130}" fill="${color}"/>`;
    }
    return s;
  };
  const body = [
    `<path d="${path(dense)}" fill="none" stroke="${MUTED}" stroke-width="${frame / 200}"/>`,
    dots(dense, ACCENT),
    dots(even, INK),
  ].join('\n');
  writeFileSync(
    join(OUT, 'resampling.svg'),
    svg(body, frame, 'Равномерная выборка по углу (оранжевая) против выборки по длине дуги (синяя)'),
  );
  console.log('figures: resampling.svg');
}

// --- fluting ----------------------------------------------------------------
comparison('flutes.svg', 'Гофр: 32 волны против гладкой стенки', smooth, baseProfile(half, DEFAULT_PARAMS.cornerR, 32, 1.1, 256), frame);
comparison('flute-amp.svg', 'Амплитуда гофра: 0.5 мм против 2.5 мм', baseProfile(half, DEFAULT_PARAMS.cornerR, 32, 0.5, 256), baseProfile(half, DEFAULT_PARAMS.cornerR, 32, 2.5, 256), frame);

// --- profile ----------------------------------------------------------------
silhouette('taper.svg', 'Конус: дно 68 мм при кромке 90 мм', DEFAULT_PARAMS);
silhouette('taper-none.svg', 'Без конуса: горшки не вкладываются', { ...DEFAULT_PARAMS, bottomSize: 90 });
silhouette('rim-flare.svg', 'Развальцовка кромки: вылет 3 мм на 12 мм высоты', { ...DEFAULT_PARAMS, rimH: 12, rimFlare: 3 });
silhouette('twist.svg', 'Кручение 1°/мм', { ...DEFAULT_PARAMS, twist: 1 });

// --- resolution -------------------------------------------------------------
comparison('seg.svg', 'Разрешение сечения: 64 точки против 256', baseProfile(half, DEFAULT_PARAMS.cornerR, 32, 1.1, 64), baseProfile(half, DEFAULT_PARAMS.cornerR, 32, 1.1, 256), frame);

console.log('figures: готово');
