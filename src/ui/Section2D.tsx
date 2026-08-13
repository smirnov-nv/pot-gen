/**
 * 2D views: cross-section from above (rim over base) and the side profile.
 *
 * Drawn as SVG rather than canvas — the contours are a few hundred points,
 * SVG scales with the window for free, and the result can be saved straight
 * out of the browser.
 *
 * @module ui/Section2D
 */

import { drainPoints } from '../core/drainage';
import type { Params } from '../core/params';
import type { Ring } from '../core/profile';

interface Props {
  params: Params;
  rings: readonly Ring[];
}

/** SVG path through a flat `[x, y, …]` contour, closed. */
function contourPath(pts: Float64Array): string {
  let d = '';
  for (let i = 0; i < pts.length; i += 2) {
    d += `${i === 0 ? 'M' : 'L'}${pts[i]!.toFixed(3)} ${(-pts[i + 1]!).toFixed(3)}`;
  }
  return `${d}Z`;
}

/** Outer envelope radius of a ring — the widest point in any direction. */
function envelope(ring: Ring): number {
  let r = 0;
  for (let i = 0; i < ring.pts.length; i += 2) {
    r = Math.max(r, Math.hypot(ring.pts[i]!, ring.pts[i + 1]!));
  }
  return r;
}

/** Half extents of a ring along each axis, mm. */
function extents(ring: Ring): { x: number; y: number } {
  let x = 0;
  let y = 0;
  for (let i = 0; i < ring.pts.length; i += 2) {
    x = Math.max(x, Math.abs(ring.pts[i]!));
    y = Math.max(y, Math.abs(ring.pts[i + 1]!));
  }
  return { x, y };
}

/** Millimetres as the views label them: whole numbers, no trailing noise. */
function mm(v: number): string {
  return v.toFixed(v < 10 ? 1 : 0);
}

/** Colour of the dimension lines and their labels. */
const DIM = '#64748b';

/**
 * One dimension line with end ticks and a centred label.
 *
 * Horizontal spans `from`…`to` at `at`; vertical spans them at `x = at`. All
 * coordinates are already in SVG space (y down), so the callers negate.
 */
function Dimension({
  axis,
  from,
  to,
  at,
  label,
  size,
}: {
  axis: 'x' | 'y';
  from: number;
  to: number;
  at: number;
  label: string;
  size: number;
}) {
  const horizontal = axis === 'x';
  const tick = size * 0.4;
  const [x1, y1, x2, y2] = horizontal ? [from, at, to, at] : [at, from, at, to];

  return (
    <g stroke={DIM} strokeWidth={size / 12} fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      {horizontal ? (
        <>
          <line x1={from} y1={at - tick} x2={from} y2={at + tick} />
          <line x1={to} y1={at - tick} x2={to} y2={at + tick} />
        </>
      ) : (
        <>
          <line x1={at - tick} y1={from} x2={at + tick} y2={from} />
          <line x1={at - tick} y1={to} x2={at + tick} y2={to} />
        </>
      )}
      <text
        x={horizontal ? (from + to) / 2 : at}
        y={(horizontal ? at : (from + to) / 2) - tick * 0.8}
        // Vertical dimensions read along their own line: centred text would
        // otherwise sit right on top of it.
        transform={horizontal ? undefined : `rotate(-90 ${at} ${(from + to) / 2})`}
        fill={DIM}
        stroke="none"
        fontSize={size}
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  );
}

function TopView({ params, rings }: Props) {
  const bottom = rings[0]!;
  const top = rings[rings.length - 1]!;
  // Room above and to the right for the dimension lines.
  const half = envelope(top) * 1.22;
  const holes = drainPoints(params);
  const rim = extents(top);
  const base = extents(bottom);
  const size = half / 11;

  return (
    <figure className="flex min-h-0 flex-1 flex-col">
      <figcaption className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">
        Сечение сверху — кромка и дно наложены
      </figcaption>
      <svg viewBox={`${-half} ${-half} ${half * 2} ${half * 2}`} className="min-h-0 flex-1">
        <g stroke="#3b4250" strokeWidth={half / 300}>
          <line x1={-half} y1={0} x2={half} y2={0} />
          <line x1={0} y1={-half} x2={0} y2={half} />
        </g>
        <path d={contourPath(top.pts)} fill="#8ea6c022" stroke="#8ea6c0" strokeWidth={half / 160} />
        <path
          d={contourPath(bottom.pts)}
          fill="none"
          stroke="#f0a860"
          strokeWidth={half / 200}
          strokeDasharray={`${half / 40} ${half / 60}`}
        />
        {holes.map((h) => (
          <g key={`${h.x},${h.y}`}>
            <circle cx={h.x} cy={-h.y} r={params.drainDia / 2} fill="#f0606022" stroke="#f06060" strokeWidth={half / 250} />
            <circle cx={h.x} cy={-h.y} r={half / 120} fill="#f06060" />
          </g>
        ))}
        <Dimension
          axis="x"
          from={-rim.x}
          to={rim.x}
          at={-half * 0.86}
          label={`${mm(rim.x * 2)} мм`}
          size={size}
        />
        <Dimension
          axis="y"
          from={-rim.y}
          to={rim.y}
          at={half * 0.86}
          label={`${mm(rim.y * 2)} мм`}
          size={size}
        />
      </svg>
      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-500">
        <span className="text-[#8ea6c0]">
          — кромка {mm(rim.x * 2)}×{mm(rim.y * 2)}
        </span>
        <span className="text-[#f0a860]">
          - - дно {mm(base.x * 2)}×{mm(base.y * 2)}
        </span>
        {holes.length > 0 && (
          <span className="text-[#f06060]">
            ● дренаж {params.mode === 'vase' ? '(бить гвоздём после печати)' : '(в модели)'}
          </span>
        )}
      </div>
    </figure>
  );
}

function SideView({ params, rings }: Props) {
  // Seen from +Y, so the silhouette is the X extent of every ring. The
  // envelope radius would draw the diagonal of the section instead — wider
  // than the pot ever is from this side, and it would not match the label.
  const radii = rings.map((r) => extents(r).x);
  const maxR = Math.max(...radii) * 1.25;
  const h = params.height;
  const size = h / 13;

  const right = rings.map((r, i) => `${radii[i]!.toFixed(3)} ${(h - r.z).toFixed(3)}`);
  const left = [...rings].reverse().map((r, i) => {
    const idx = rings.length - 1 - i;
    return `${(-radii[idx]!).toFixed(3)} ${(h - r.z).toFixed(3)}`;
  });
  const silhouette = `M${right.join('L')}L${left.join('L')}Z`;

  // Section through the XZ plane: point 0 of every ring lies on +X.
  const section = rings.map((r) => `${r.pts[0]!.toFixed(3)} ${(h - r.z).toFixed(3)}`);

  return (
    <figure className="flex min-h-0 flex-1 flex-col">
      <figcaption className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">
        Профиль сбоку — огибающая и сечение по XZ
      </figcaption>
      <svg viewBox={`${-maxR} ${-h * 0.06} ${maxR * 2} ${h * 1.12}`} className="min-h-0 flex-1">
        <line x1={-maxR} y1={h} x2={maxR} y2={h} stroke="#3b4250" strokeWidth={h / 400} />
        <path d={silhouette} fill="#8ea6c022" stroke="#8ea6c0" strokeWidth={h / 300} />
        <path d={`M${section.join('L')}`} fill="none" stroke="#f0a860" strokeWidth={h / 350} />
        <Dimension
          axis="y"
          from={0}
          to={h}
          at={-maxR * 0.88}
          label={`${mm(h)} мм`}
          size={size}
        />
        <Dimension
          axis="x"
          from={-radii[rings.length - 1]!}
          to={radii[rings.length - 1]!}
          at={-h * 0.02}
          label={`${mm(radii[rings.length - 1]! * 2)} мм`}
          size={size}
        />
      </svg>
      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-500">
        <span className="text-[#8ea6c0]">— огибающая по X (гребни гофра)</span>
        <span className="text-[#f0a860]">— сечение по оси X</span>
        <span>высота {mm(h)}</span>
      </div>
    </figure>
  );
}

/**
 * Both 2D views side by side.
 *
 * @param props - parameters and the ring stack
 * @returns the view element
 */
export function Section2D({ params, rings }: Props) {
  if (rings.length < 2) return null;
  return (
    <div className="flex h-full gap-4 p-4">
      <TopView params={params} rings={rings} />
      <SideView params={params} rings={rings} />
    </div>
  );
}
