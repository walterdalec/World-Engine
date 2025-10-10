// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/battle/hex/aoe.test.ts
// Purpose: Comprehensive test suite for AoE template generators
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { axial, axialKey, CUBE_DIRS } from './coords';
import type { Axial } from './coords';
import {
  aoeCircle,
  aoeDonut,
  aoeLine,
  aoeBoltBetween,
  aoeCone,
  circleKeys,
  donutKeys,
  lineKeys,
  coneKeys,
  toKeySet,
  fromKeySet,
  setUnion,
  setIntersect,
  setDiff,
  filterByLOS,
  clipLineByBlockers,
  dirDiff,
  dominantDirectionIndex,
} from './aoe';

const origin = axial(0, 0);

/** Formula for disk size: 1 + 3*R*(R+1) */
function countDisk(R: number): number {
  return 1 + 3 * R * (R + 1);
}

describe('AoE - Circle/Disk Sizes', () => {
  it('computes correct sizes for radius 0-4', () => {
    for (let r = 0; r <= 4; r++) {
      expect(aoeCircle(origin, r).length).toBe(countDisk(r));
    }
  });

  it('radius 0 returns only center', () => {
    const disk = aoeCircle(origin, 0);
    expect(disk.length).toBe(1);
    expect(disk[0]).toEqual(origin);
  });

  it('radius 1 returns 7 hexes (center + 6 neighbors)', () => {
    const disk = aoeCircle(origin, 1);
    expect(disk.length).toBe(7);
    expect(disk.some(h => h.q === 0 && h.r === 0)).toBe(true);
  });

  it('radius 2 returns 19 hexes', () => {
    expect(aoeCircle(origin, 2).length).toBe(19);
  });
});

describe('AoE - Donut/Annulus', () => {
  it('computes donut size correctly (min=2, max=3)', () => {
    const donut = aoeDonut(origin, { min: 2, max: 3 });
    const expected = countDisk(3) - countDisk(1); // Ring at R=2 + R=3
    expect(donut.length).toBe(expected);
  });

  it('excludes center and inner ring', () => {
    const donut = aoeDonut(origin, { min: 2, max: 3 });
    expect(donut.some(h => h.q === 0 && h.r === 0)).toBe(false); // No origin
    expect(donut.some(h => h.q === 1 && h.r === 0)).toBe(false); // No R=1 ring
  });

  it('min=0 returns full disk', () => {
    const donut = aoeDonut(origin, { min: 0, max: 2 });
    expect(donut.length).toBe(countDisk(2));
  });

  it('min=max returns single ring', () => {
    const donut = aoeDonut(origin, { min: 2, max: 2 });
    expect(donut.length).toBe(12); // Ring at R=2
  });

  it('max=0 with includeOrigin returns only origin', () => {
    const donut = aoeDonut(origin, { min: 0, max: 0, includeOrigin: true });
    expect(donut.length).toBe(1);
    expect(donut[0]).toEqual(origin);
  });

  it('max=0 without includeOrigin returns empty', () => {
    const donut = aoeDonut(origin, { min: 0, max: 0, includeOrigin: false });
    expect(donut.length).toBe(0);
  });

  it('invalid specs return empty array', () => {
    expect(aoeDonut(origin, { min: -1, max: 2 }).length).toBe(0);
    expect(aoeDonut(origin, { min: 3, max: 2 }).length).toBe(0);
    expect(aoeDonut(origin, { min: 2, max: -1 }).length).toBe(0);
  });
});

describe('AoE - Line/Beam Thickness', () => {
  it('thickness=1 creates single-file line', () => {
    const thin = aoeLine(origin, { dir: 0, length: 3, thickness: 1 });
    expect(thin.length).toBe(4); // Origin + 3 steps
  });

  it('thickness=3 creates wider beam than thickness=1', () => {
    const thin = aoeLine(origin, { dir: 0, length: 3, thickness: 1 });
    const thick = aoeLine(origin, { dir: 0, length: 3, thickness: 3 });
    expect(thick.length).toBeGreaterThan(thin.length);
  });

  it('includes endpoint at correct position (dir=0, length=3)', () => {
    const line = aoeLine(origin, { dir: 0, length: 3, thickness: 1 });
    expect(line.some(h => h.q === 3 && h.r === 0)).toBe(true);
  });

  it('includes origin by default', () => {
    const line = aoeLine(origin, { dir: 0, length: 2, thickness: 1 });
    expect(line.some(h => h.q === 0 && h.r === 0)).toBe(true);
  });

  it('excludes origin when includeOrigin=false', () => {
    const line = aoeLine(origin, { dir: 0, length: 2, thickness: 1, includeOrigin: false });
    expect(line.some(h => h.q === 0 && h.r === 0)).toBe(false);
  });

  it('different directions produce different lines', () => {
    const line0 = aoeLine(origin, { dir: 0, length: 2, thickness: 1 });
    const line1 = aoeLine(origin, { dir: 1, length: 2, thickness: 1 });
    // Lines should differ in hex positions
    const keys0 = new Set(line0.map(axialKey));
    const keys1 = new Set(line1.map(axialKey));
    const overlap = Array.from(keys0).filter(k => keys1.has(k));
    expect(overlap.length).toBeLessThan(line0.length); // Not identical
  });

  it('thickness=2 adds lateral hexes', () => {
    const line = aoeLine(origin, { dir: 0, length: 2, thickness: 2 });
    expect(line.length).toBeGreaterThan(3); // More than thin line
  });
});

describe('AoE - Bolt Between Points', () => {
  const a = axial(0, 0);
  const b = axial(3, 0);

  it('includes start and end points', () => {
    const bolt = aoeBoltBetween(a, b);
    expect(bolt[0]).toEqual(a);
    expect(bolt[bolt.length - 1]).toEqual(b);
  });

  it('truncates to maxLength correctly', () => {
    const full = aoeBoltBetween(a, b);
    const cut = aoeBoltBetween(a, b, 1);
    expect(cut.length).toBe(2); // Origin + 1 step
    expect(full.length).toBeGreaterThan(cut.length);
  });

  it('maxLength=0 returns only origin', () => {
    const bolt = aoeBoltBetween(a, b, 0);
    expect(bolt.length).toBe(1);
    expect(bolt[0]).toEqual(a);
  });

  it('no maxLength returns full line', () => {
    const bolt = aoeBoltBetween(a, b);
    expect(bolt.length).toBe(4); // (0,0), (1,0), (2,0), (3,0)
  });

  it('diagonal bolt works correctly', () => {
    const bolt = aoeBoltBetween(axial(0, 0), axial(2, 2));
    expect(bolt.length).toBeGreaterThan(2);
    expect(bolt[0]).toEqual(axial(0, 0));
    expect(bolt[bolt.length - 1]).toEqual(axial(2, 2));
  });
});

describe('AoE - Cone Aperture', () => {
  it('widen=0 creates narrow cone', () => {
    const narrow = aoeCone(origin, { dir: 0, radius: 3, widen: 0 });
    expect(narrow.length).toBeGreaterThan(0);
  });

  it('widen=1 (medium) is wider than widen=0 (narrow)', () => {
    const narrow = aoeCone(origin, { dir: 0, radius: 3, widen: 0 });
    const medium = aoeCone(origin, { dir: 0, radius: 3, widen: 1 });
    expect(medium.length).toBeGreaterThan(narrow.length);
  });

  it('widen=2 (wide) is wider than widen=1 (medium)', () => {
    const medium = aoeCone(origin, { dir: 0, radius: 3, widen: 1 });
    const wide = aoeCone(origin, { dir: 0, radius: 3, widen: 2 });
    expect(wide.length).toBeGreaterThan(medium.length);
  });

  it('excludes origin by default', () => {
    const cone = aoeCone(origin, { dir: 0, radius: 3, widen: 1 });
    expect(cone.some(h => h.q === 0 && h.r === 0)).toBe(false);
  });

  it('includes origin when includeOrigin=true', () => {
    const cone = aoeCone(origin, { dir: 0, radius: 3, widen: 1, includeOrigin: true });
    expect(cone.some(h => h.q === 0 && h.r === 0)).toBe(true);
  });

  it('different directions produce different cones', () => {
    const cone0 = aoeCone(origin, { dir: 0, radius: 2, widen: 1 });
    const cone3 = aoeCone(origin, { dir: 3, radius: 2, widen: 1 }); // Opposite direction
    const keys0 = new Set(cone0.map(axialKey));
    const keys3 = new Set(cone3.map(axialKey));
    const overlap = Array.from(keys0).filter(k => keys3.has(k));
    expect(overlap.length).toBe(0); // Opposite cones should not overlap
  });

  it('radius=0 returns empty or just origin', () => {
    const cone = aoeCone(origin, { dir: 0, radius: 0, widen: 1 });
    expect(cone.length).toBe(0); // No hexes in radius 0 disk except origin
  });
});

describe('AoE - Set Utilities', () => {
  const hexes1: Axial[] = [axial(0, 0), axial(1, 0), axial(2, 0)];
  const hexes2: Axial[] = [axial(1, 0), axial(2, 0), axial(3, 0)];

  it('toKeySet converts Axial[] to Set<string>', () => {
    const keys = toKeySet(hexes1);
    expect(keys.size).toBe(3);
    expect(keys.has('0,0')).toBe(true);
    expect(keys.has('1,0')).toBe(true);
  });

  it('fromKeySet converts Set<string> to Axial[]', () => {
    const keys = new Set(['0,0', '1,0', '2,0']);
    const hexes = fromKeySet(keys);
    expect(hexes.length).toBe(3);
    expect(hexes.some(h => h.q === 0 && h.r === 0)).toBe(true);
  });

  it('setUnion combines two sets', () => {
    const set1 = toKeySet(hexes1);
    const set2 = toKeySet(hexes2);
    const union = setUnion(set1, set2);
    expect(union.size).toBe(4); // (0,0), (1,0), (2,0), (3,0)
  });

  it('setIntersect finds common elements', () => {
    const set1 = toKeySet(hexes1);
    const set2 = toKeySet(hexes2);
    const intersect = setIntersect(set1, set2);
    expect(intersect.size).toBe(2); // (1,0), (2,0)
    expect(intersect.has('1,0')).toBe(true);
    expect(intersect.has('2,0')).toBe(true);
  });

  it('setDiff finds elements in A but not B', () => {
    const set1 = toKeySet(hexes1);
    const set2 = toKeySet(hexes2);
    const diff = setDiff(set1, set2);
    expect(diff.size).toBe(1); // (0,0) only
    expect(diff.has('0,0')).toBe(true);
  });

  it('setIntersect with no overlap returns empty', () => {
    const set1 = toKeySet([axial(0, 0), axial(1, 0)]);
    const set2 = toKeySet([axial(2, 0), axial(3, 0)]);
    const intersect = setIntersect(set1, set2);
    expect(intersect.size).toBe(0);
  });
});

describe('AoE - Convenience Key Helpers', () => {
  it('circleKeys returns correct size', () => {
    const keys = circleKeys(origin, 2);
    expect(keys.size).toBe(countDisk(2));
  });

  it('donutKeys returns correct size', () => {
    const keys = donutKeys(origin, { min: 2, max: 3 });
    const expected = countDisk(3) - countDisk(1);
    expect(keys.size).toBe(expected);
  });

  it('lineKeys returns correct structure', () => {
    const keys = lineKeys(origin, { dir: 0, length: 3, thickness: 1 });
    expect(keys.size).toBeGreaterThan(0);
    expect(keys.has('0,0')).toBe(true); // Origin included by default
  });

  it('coneKeys returns correct structure', () => {
    const keys = coneKeys(origin, { dir: 0, radius: 3, widen: 1 });
    expect(keys.size).toBeGreaterThan(0);
    expect(keys.has('0,0')).toBe(false); // Origin excluded by default
  });
});

describe('AoE - Direction Utilities', () => {
  it('dirDiff computes minimal circular distance', () => {
    expect(dirDiff(0, 0)).toBe(0);
    expect(dirDiff(0, 1)).toBe(1);
    expect(dirDiff(0, 2)).toBe(2);
    expect(dirDiff(0, 3)).toBe(3);
    expect(dirDiff(0, 4)).toBe(2); // Wrap around: 0→4 = 2 steps
    expect(dirDiff(0, 5)).toBe(1); // Wrap around: 0→5 = 1 step
    expect(dirDiff(5, 0)).toBe(1); // Symmetric
  });

  it('dominantDirectionIndex finds correct direction', () => {
    // Direction 0: (+1, -1, 0) in cube space
    const dir0 = dominantDirectionIndex({ x: 2, y: -2, z: 0 });
    expect(dir0).toBe(0);

    // Direction 3: (-1, +1, 0) in cube space (opposite of 0)
    const dir3 = dominantDirectionIndex({ x: -2, y: 2, z: 0 });
    expect(dir3).toBe(3);
  });

  it('dominantDirectionIndex handles unit vectors', () => {
    for (let i = 0; i < 6; i++) {
      const dir = dominantDirectionIndex(CUBE_DIRS[i]);
      expect(dir).toBe(i);
    }
  });
});

describe('AoE - LOS Filtering', () => {
  const mockLOS = {
    hasLineOfSight: (a: { q: number; r: number }, b: { q: number; r: number }) => {
      // Simple mock: Block if target is at (2,0)
      return !(b.q === 2 && b.r === 0);
    },
  };

  it('filterByLOS removes blocked hexes', () => {
    const cells: Axial[] = [axial(0, 0), axial(1, 0), axial(2, 0), axial(3, 0)];
    const filtered = filterByLOS(origin, cells, mockLOS);
    expect(filtered.length).toBe(3); // (2,0) blocked
    expect(filtered.some(h => h.q === 2 && h.r === 0)).toBe(false);
  });

  it('filterByLOS keeps visible hexes', () => {
    const cells: Axial[] = [axial(0, 0), axial(1, 0)];
    const filtered = filterByLOS(origin, cells, mockLOS);
    expect(filtered.length).toBe(2);
  });

  it('filterByLOS with no blockers returns all', () => {
    const mockClearLOS = {
      hasLineOfSight: () => true,
    };
    const cells: Axial[] = [axial(0, 0), axial(1, 0), axial(2, 0)];
    const filtered = filterByLOS(origin, cells, mockClearLOS);
    expect(filtered.length).toBe(3);
  });
});

describe('AoE - Clip Line by Blockers', () => {
  const isWall = (h: { q: number; r: number }) => h.q === 2 && h.r === 0;

  it('stops at first blocker and includes it by default', () => {
    const line: Axial[] = [axial(0, 0), axial(1, 0), axial(2, 0), axial(3, 0)];
    const clipped = clipLineByBlockers(origin, line, isWall);
    expect(clipped.length).toBe(3); // (0,0), (1,0), (2,0)
    expect(clipped[clipped.length - 1]).toEqual(axial(2, 0));
  });

  it('stops at first blocker and excludes it when includeBlockedCell=false', () => {
    const line: Axial[] = [axial(0, 0), axial(1, 0), axial(2, 0), axial(3, 0)];
    const clipped = clipLineByBlockers(origin, line, isWall, false);
    expect(clipped.length).toBe(2); // (0,0), (1,0)
    expect(clipped.some(h => h.q === 2 && h.r === 0)).toBe(false);
  });

  it('returns full line if no blockers', () => {
    const line: Axial[] = [axial(0, 0), axial(1, 0), axial(3, 0)]; // No (2,0)
    const clipped = clipLineByBlockers(origin, line, isWall);
    expect(clipped.length).toBe(3);
  });

  it('handles blocker at first cell', () => {
    const line: Axial[] = [axial(2, 0), axial(3, 0)];
    const clipped = clipLineByBlockers(origin, line, isWall);
    expect(clipped.length).toBe(1); // Only (2,0)
    expect(clipped[0]).toEqual(axial(2, 0));
  });

  it('empty line returns empty', () => {
    const clipped = clipLineByBlockers(origin, [], isWall);
    expect(clipped.length).toBe(0);
  });
});
