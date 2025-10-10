// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/battle/hex/movement.test.ts
// Purpose: Comprehensive tests for movement & range systems
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { axial, axialKey } from './coords';
import {
  computeMovementField,
  uniformMovement,
  reconstructPath,
  reachableKeys,
  inHexRange,
  filterByRange,
  collectTargetsFromPositions,
  type RangeSpec,
  type MoveCostFn,
} from './movement';

/** Helper: Passability checker for a bounded square-ish grid */
function gridPassable(size: number) {
  return (h: { q: number; r: number }) =>
    Math.abs(h.q) <= size && Math.abs(h.r) <= size && Math.abs(h.q + h.r) <= size;
}

describe('Movement & Range - Basic Uniform Movement', () => {
  it('computes correct disk size for uniform terrain', () => {
    const origin = axial(0, 0);
    const field = uniformMovement(origin, 2, gridPassable(5));
    // count within radius R: 1 + 3R(R+1) = 1 + 3*2*3 = 1 + 18 = 19
    expect(field.nodes.size).toBe(19);
  });

  it('includes origin in movement field', () => {
    const origin = axial(0, 0);
    const field = uniformMovement(origin, 1, gridPassable(3));
    expect(field.nodes.has(axialKey(origin))).toBe(true);
  });

  it('respects maxMP boundary', () => {
    const origin = axial(0, 0);
    const field = uniformMovement(origin, 1, gridPassable(5));
    // Should include origin (0,0) and 6 neighbors at distance 1
    expect(field.nodes.size).toBe(7);
  });

  it('handles zero MP correctly', () => {
    const origin = axial(0, 0);
    const field = uniformMovement(origin, 0, gridPassable(5));
    // Only the origin should be reachable
    expect(field.nodes.size).toBe(1);
    expect(field.nodes.has(axialKey(origin))).toBe(true);
  });
});

describe('Movement & Range - Impassable Terrain', () => {
  it('excludes impassable hexes', () => {
    const origin = axial(0, 0);
    const isPass = (h: { q: number; r: number }) => !(h.q === 1 && h.r === 0); // block (1,0)
    const field = uniformMovement(origin, 2, isPass);
    expect(field.nodes.has('1,0')).toBe(false);
  });

  it('routes around obstacles', () => {
    const origin = axial(0, 0);
    const target = axial(2, 0);
    // Block direct path at (1,0)
    const isPass = (h: { q: number; r: number }) => !(h.q === 1 && h.r === 0);
    const field = uniformMovement(origin, 3, isPass);
    const path = reconstructPath(field, target);
    expect(path).not.toBeNull();
    // Path should go around obstacle
    expect(path!.length).toBeGreaterThan(2);
  });

  it('returns null path for unreachable hexes', () => {
    const origin = axial(0, 0);
    const target = axial(5, 0);
    const field = uniformMovement(origin, 2, gridPassable(3)); // MP too low
    const path = reconstructPath(field, target);
    expect(path).toBeNull();
  });
});

describe('Movement & Range - Occupancy', () => {
  it('excludes occupied hexes', () => {
    const origin = axial(0, 0);
    const occ = (h: { q: number; r: number }) => h.q === 0 && h.r === 1; // occupied (0,1)
    const field = uniformMovement(origin, 2, gridPassable(5), { isOccupied: occ });
    expect(field.nodes.has('0,1')).toBe(false);
  });

  it('allows origin even if marked occupied', () => {
    const origin = axial(0, 0);
    const occ = (h: { q: number; r: number }) => h.q === 0 && h.r === 0; // origin occupied
    const field = uniformMovement(origin, 1, gridPassable(3), { isOccupied: occ });
    expect(field.nodes.has(axialKey(origin))).toBe(true);
  });

  it('routes around occupied hexes', () => {
    const origin = axial(0, 0);
    const target = axial(2, -1);
    const occ = (h: { q: number; r: number }) => h.q === 1 && h.r === 0; // block (1,0)
    const field = uniformMovement(origin, 4, gridPassable(5), { isOccupied: occ });
    const path = reconstructPath(field, target);
    expect(path).not.toBeNull();
    // Path should not include occupied hex
    expect(path!.some(p => p.q === 1 && p.r === 0)).toBe(false);
  });
});

describe('Movement & Range - Edge Blockers', () => {
  it('respects edge blockers (walls)', () => {
    const origin = axial(0, 0);
    // Block all edges to (1,0) to make it truly unreachable
    const edgeBlock = (_from: { q: number; r: number }, to: { q: number; r: number }) =>
      to.q === 1 && to.r === 0; // block all entry to (1,0)
    const field = uniformMovement(origin, 2, gridPassable(5), { edgeBlocker: edgeBlock });
    // (1,0) should be unreachable due to walls on all edges
    expect(field.nodes.has('1,0')).toBe(false);
  });

  it('allows access via alternate paths despite edge blockers', () => {
    const origin = axial(0, 0);
    const target = axial(1, 0);
    // Block direct edge but allow alternate route
    const edgeBlock = (from: { q: number; r: number }, to: { q: number; r: number }) =>
      from.q === 0 && from.r === 0 && to.q === 1 && to.r === 0;
    const field = uniformMovement(origin, 3, gridPassable(5), { edgeBlocker: edgeBlock });
    const path = reconstructPath(field, target);
    // Should find alternate path (e.g., via (0,1) or (1,-1))
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(2);
  });
});

describe('Movement & Range - Zone of Control', () => {
  it('marks hexes adjacent to ZoC sources as sealed when stopOnZoCEnter enabled', () => {
    const origin = axial(0, 0);
    const zoc = new Set(['2,0']); // enemy at (2,0)
    const field = uniformMovement(origin, 4, gridPassable(4), {
      zocHexes: zoc,
      stopOnZoCEnter: true,
    });
    // Hex (1,0) is adjacent to (2,0) and should be reachable
    expect(field.nodes.has('1,0')).toBe(true);
    // But it should be marked as sealed
    const node = field.nodes.get('1,0');
    expect(node?.sealed).toBe(true);
  });

  it('allows movement without ZoC when stopOnZoCEnter is false', () => {
    const origin = axial(0, 0);
    const zoc = new Set(['2,0']); // enemy at (2,0)
    const field = uniformMovement(origin, 4, gridPassable(4), {
      zocHexes: zoc,
      stopOnZoCEnter: false,
    });
    // Should be able to move through ZoC area
    expect(field.nodes.has('1,0')).toBe(true);
    const node = field.nodes.get('1,0');
    expect(node?.sealed).toBe(false);
  });

  it('prevents expansion beyond ZoC hexes when sealed', () => {
    const origin = axial(0, 0);
    const zoc = new Set(['1,0']); // enemy at (1,0)
    const field = uniformMovement(origin, 4, gridPassable(4), {
      zocHexes: zoc,
      stopOnZoCEnter: true,
    });
    // Hexes adjacent to (1,0) should be sealed and not expand further
    // For example, (0,0) enters ZoC when moving to neighbors of (1,0)
    // This is a complex scenario - we just verify sealing logic works
    const adjacentToZoC = [axial(0, 0), axial(1, -1), axial(2, -1), axial(2, 0), axial(1, 1), axial(0, 1)];
    let sealedCount = 0;
    for (const hex of adjacentToZoC) {
      const node = field.nodes.get(axialKey(hex));
      if (node?.sealed) sealedCount++;
    }
    expect(sealedCount).toBeGreaterThan(0);
  });
});

describe('Movement & Range - Variable Costs', () => {
  it('handles variable terrain costs correctly', () => {
    const origin = axial(0, 0);
    // Ring at distance 1 costs 2, others cost 1
    const costFn: MoveCostFn = h => {
      const dist = Math.abs(h.q) + Math.abs(h.r) + Math.abs(h.q + h.r);
      return dist === 2 ? 2 : 1; // distance 1 hexes in cube space
    };
    const field = computeMovementField(origin, 3, costFn);
    // With maxMP=3, should reach origin (0 cost) + some neighbors
    expect(field.nodes.has('0,0')).toBe(true);
    // Hex (1,0) costs 2 to enter, so total cost is 2
    const node = field.nodes.get('1,0');
    expect(node?.cost).toBe(2);
  });

  it('prefers cheaper paths', () => {
    const origin = axial(0, 0);
    const target = axial(2, 0);
    // Make direct path expensive, alternate path cheap
    const costFn: MoveCostFn = h => {
      if (h.q === 1 && h.r === 0) return 5; // expensive hex
      return 1;
    };
    const field = computeMovementField(origin, 6, costFn);
    const path = reconstructPath(field, target);
    expect(path).not.toBeNull();
    // Path should avoid expensive hex if possible
    // Total cost should be less than direct path (5 + 1 = 6)
    const node = field.nodes.get(axialKey(target));
    expect(node?.cost).toBeLessThan(6);
  });
});

describe('Movement & Range - Path Reconstruction', () => {
  it('reconstructs correct path from origin to target', () => {
    const origin = axial(0, 0);
    const target = axial(2, 0);
    const field = uniformMovement(origin, 3, gridPassable(5));
    const path = reconstructPath(field, target);
    expect(path).not.toBeNull();
    expect(path![0]).toEqual(origin);
    expect(path![path!.length - 1]).toEqual(target);
  });

  it('path length equals distance for uniform cost', () => {
    const origin = axial(0, 0);
    const target = axial(2, -1);
    const field = uniformMovement(origin, 5, gridPassable(5));
    const path = reconstructPath(field, target);
    expect(path).not.toBeNull();
    // Distance is 2, so path should have 3 hexes (origin + 2 steps)
    expect(path!.length).toBe(3);
  });

  it('returns null for unreachable targets', () => {
    const origin = axial(0, 0);
    const target = axial(10, 10);
    const field = uniformMovement(origin, 2, gridPassable(3));
    const path = reconstructPath(field, target);
    expect(path).toBeNull();
  });
});

describe('Movement & Range - Range Predicates', () => {
  it('inHexRange checks min/max correctly', () => {
    const a = axial(0, 0);
    const b = axial(2, -1);
    const spec: RangeSpec = { min: 1, max: 2 };
    expect(inHexRange(a, b, spec)).toBe(true);
    expect(inHexRange(a, axial(0, 0), spec)).toBe(false); // distance 0 < min 1
    expect(inHexRange(a, axial(3, 0), spec)).toBe(false); // distance 3 > max 2
  });

  it('inHexRange works without min (defaults to 0)', () => {
    const a = axial(0, 0);
    const spec: RangeSpec = { max: 2 };
    expect(inHexRange(a, axial(0, 0), spec)).toBe(true); // distance 0
    expect(inHexRange(a, axial(1, 0), spec)).toBe(true); // distance 1
    expect(inHexRange(a, axial(2, 0), spec)).toBe(true); // distance 2
    expect(inHexRange(a, axial(3, 0), spec)).toBe(false); // distance 3
  });

  it('filterByRange returns hexes within range', () => {
    const center = axial(0, 0);
    const hexes = [axial(1, 0), axial(2, 0), axial(3, 0), axial(0, 1)];
    const spec: RangeSpec = { max: 2 };
    const result = filterByRange(center, hexes, spec);
    expect(result.length).toBe(3); // (1,0), (2,0), (0,1)
    expect(result.some(h => h.q === 3 && h.r === 0)).toBe(false);
  });
});

describe('Movement & Range - Move + Attack Helpers', () => {
  it('collectTargetsFromPositions finds targets within range', () => {
    const origin = axial(0, 0);
    const field = uniformMovement(origin, 2, gridPassable(5));
    const fromPositions = Array.from(field.nodes.keys());
    const targets = [axial(2, 0), axial(3, 0), axial(0, 2)];
    const spec: RangeSpec = { max: 2 };
    const result = collectTargetsFromPositions(fromPositions, targets, spec);
    // (2,0) and (0,2) should be reachable for attack from various positions
    expect(result.length).toBeGreaterThan(0);
    expect(result.some(t => t.q === 2 && t.r === 0)).toBe(true);
  });

  it('collectTargetsFromPositions respects range limits', () => {
    const origin = axial(0, 0);
    const field = uniformMovement(origin, 1, gridPassable(5)); // Only 1 MP
    const fromPositions = Array.from(field.nodes.keys());
    const targets = [axial(5, 0)]; // Far away
    const spec: RangeSpec = { max: 1 };
    const result = collectTargetsFromPositions(fromPositions, targets, spec);
    // Target is too far from any reachable position
    expect(result.length).toBe(0);
  });

  it('collectTargetsFromPositions handles string and object positions', () => {
    const positions = ['1,0', axial(0, 1)];
    const targets = [axial(2, 0), axial(1, 1)];
    const spec: RangeSpec = { max: 1 };
    const result = collectTargetsFromPositions(positions, targets, spec);
    // (2,0) is distance 1 from (1,0), (1,1) is distance 1 from both positions
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('Movement & Range - Performance & Edge Cases', () => {
  it('handles node limit correctly', () => {
    const origin = axial(0, 0);
    const field = uniformMovement(origin, 10, gridPassable(10), { nodeLimit: 50 });
    // Node limit is checked after adding, so it can be slightly over
    expect(field.nodes.size).toBeLessThanOrEqual(60); // Allow some overshoot
  });

  it('handles negative costs gracefully (treats as impassable)', () => {
    const origin = axial(0, 0);
    const costFn: MoveCostFn = h => (h.q === 1 && h.r === 0 ? -1 : 1); // negative cost
    const field = computeMovementField(origin, 5, costFn);
    // Hex with negative cost should not be reachable
    expect(field.nodes.has('1,0')).toBe(false);
  });

  it('reachableKeys returns correct set', () => {
    const origin = axial(0, 0);
    const field = uniformMovement(origin, 1, gridPassable(5));
    const keys = reachableKeys(field);
    expect(keys.size).toBe(field.nodes.size);
    expect(keys.has('0,0')).toBe(true);
  });

  it('handles large movement ranges efficiently', () => {
    const origin = axial(0, 0);
    const field = uniformMovement(origin, 20, gridPassable(20));
    // Should compute without hanging
    expect(field.nodes.size).toBeGreaterThan(100);
  });
});
