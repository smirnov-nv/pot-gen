import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS, type Params } from '../src/core/params';
import { buildMesh } from '../src/core/build';
import { meshBounds, meshVolume, type Mesh } from '../src/core/mesh';
import { buildShellMesh } from '../src/core/shell';
import { buildVaseMesh } from '../src/core/mesh';

const shell = (patch: Partial<Params> = {}): Params => ({
  ...DEFAULT_PARAMS,
  mode: 'shell',
  // Coarse sampling keeps the manifold check quick; the topology is the same.
  seg: 128,
  dz: 2,
  ...patch,
});

/** Directed-edge report — see tests/mesh.test.ts for the reasoning. */
function manifoldReport(mesh: Mesh): { unmatched: number; duplicated: number } {
  const p = mesh.positions;
  const ids = new Map<string, number>();
  const idOf = (i: number): number => {
    const key = `${p[i]!},${p[i + 1]!},${p[i + 2]!}`;
    let id = ids.get(key);
    if (id === undefined) {
      id = ids.size;
      ids.set(key, id);
    }
    return id;
  };

  const seen = new Set<string>();
  const edges: [number, number][] = [];
  let duplicated = 0;
  for (let t = 0; t < p.length; t += 9) {
    const a = idOf(t);
    const b = idOf(t + 3);
    const c = idOf(t + 6);
    for (const [u, v] of [[a, b], [b, c], [c, a]] as [number, number][]) {
      const key = `${u}>${v}`;
      if (seen.has(key)) duplicated++;
      seen.add(key);
      edges.push([u, v]);
    }
  }
  let unmatched = 0;
  for (const [u, v] of edges) if (!seen.has(`${v}>${u}`)) unmatched++;
  return { unmatched, duplicated };
}

describe('shell mesh', () => {
  it('is a closed manifold with consistent winding', () => {
    const report = manifoldReport(buildShellMesh(shell()));
    expect(report.duplicated).toBe(0);
    expect(report.unmatched).toBe(0);
  });

  it('stays manifold without drainage and without slots', () => {
    const report = manifoldReport(buildShellMesh(shell({ drainHoles: 0, slots: 0 })));
    expect(report.duplicated).toBe(0);
    expect(report.unmatched).toBe(0);
  });

  it('stays manifold with slots cut through the wall', () => {
    const report = manifoldReport(buildShellMesh(shell({ slots: 4, slotWidth: 4, slotHeight: 40 })));
    expect(report.duplicated).toBe(0);
    expect(report.unmatched).toBe(0);
  });

  it('has outward normals', () => {
    expect(meshVolume(buildShellMesh(shell()))).toBeGreaterThan(0);
    expect(meshVolume(buildShellMesh(shell({ slots: 4 })))).toBeGreaterThan(0);
    expect(meshVolume(buildShellMesh(shell({ drainHoles: 0 })))).toBeGreaterThan(0);
  });

  it('encloses far less material than the solid vase model', () => {
    const solid = meshVolume(buildVaseMesh(shell()));
    const hollow = meshVolume(buildShellMesh(shell()));
    expect(hollow).toBeLessThan(solid * 0.35);
    expect(hollow).toBeGreaterThan(solid * 0.02);
  });

  it('keeps the same outer envelope as vase mode', () => {
    const a = meshBounds(buildVaseMesh(shell()));
    const b = meshBounds(buildShellMesh(shell()));
    for (let i = 0; i < 3; i++) {
      expect(b.min[i]!).toBeCloseTo(a.min[i]!, 6);
      expect(b.max[i]!).toBeCloseTo(a.max[i]!, 6);
    }
  });

  it('removes material when holes and slots are added', () => {
    const plain = meshVolume(buildShellMesh(shell({ drainHoles: 0, slots: 0 })));
    const drained = meshVolume(buildShellMesh(shell({ drainHoles: 6, drainDia: 6, slots: 0 })));
    const slotted = meshVolume(buildShellMesh(shell({ drainHoles: 0, slots: 8, slotWidth: 5 })));
    expect(drained).toBeLessThan(plain);
    expect(slotted).toBeLessThan(plain);
  });

  it('drops drainage that will not fit rather than emitting a broken bottom', () => {
    const tight = shell({ bottomSize: 32, drainHoles: 8, drainDia: 14 });
    const mesh = buildShellMesh(tight);
    expect(meshVolume(mesh)).toBeGreaterThan(0);
    expect(manifoldReport(mesh).unmatched).toBe(0);
  });

  it('survives a wall thicker than the pot', () => {
    const mesh = buildShellMesh(shell({ wallThickness: 5, bottomSize: 30, topSize: 40 }));
    expect(meshVolume(mesh)).toBeGreaterThan(0);
  });

  it('is what buildMesh dispatches to in shell mode', () => {
    expect(buildMesh(shell()).triangleCount).toBe(buildShellMesh(shell()).triangleCount);
    expect(buildMesh({ ...shell(), mode: 'vase' }).triangleCount).toBe(
      buildVaseMesh(shell()).triangleCount,
    );
  });
});
