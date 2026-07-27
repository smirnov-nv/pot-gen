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

/** Outer envelope radius of a ring — what a silhouette actually shows. */
function envelope(ring: Ring): number {
  let r = 0;
  for (let i = 0; i < ring.pts.length; i += 2) {
    r = Math.max(r, Math.hypot(ring.pts[i]!, ring.pts[i + 1]!));
  }
  return r;
}

function TopView({ params, rings }: Props) {
  const bottom = rings[0]!;
  const top = rings[rings.length - 1]!;
  const half = envelope(top) * 1.08;
  const holes = drainPoints(params);

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
      </svg>
      <div className="mt-1 flex gap-3 text-[11px] text-slate-500">
        <span className="text-[#8ea6c0]">— кромка</span>
        <span className="text-[#f0a860]">- - дно</span>
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
  const radii = rings.map(envelope);
  const maxR = Math.max(...radii) * 1.08;
  const h = params.height;

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
      </svg>
      <div className="mt-1 flex gap-3 text-[11px] text-slate-500">
        <span className="text-[#8ea6c0]">— огибающая (гребни гофра)</span>
        <span className="text-[#f0a860]">— сечение по оси X</span>
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
