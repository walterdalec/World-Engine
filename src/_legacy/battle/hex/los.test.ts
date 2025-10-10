// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/battle/hex/los.test.ts
// Purpose: Comprehensive tests for Line-of-Sight & Raycast systems
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { axial, axialKey } from './coords';
import {
    traceRay,
    hasLineOfSight,
    visibleWithinRadius,
    coverBetween,
    type LOSOptions,
    type BlocksSightAtFn,
    type BlocksSightEdgeFn,
} from './los';

// Helper factories
const wallAt = (q: number, r: number): BlocksSightAtFn => (h: { q: number; r: number }) =>
    h.q === q && h.r === r;

const edgeBlock =
    (fq: number, fr: number, tq: number, tr: number): BlocksSightEdgeFn =>
        (from: { q: number; r: number }, to: { q: number; r: number }) =>
            from.q === fq && from.r === fr && to.q === tq && to.r === tr;

describe('LOS - Basic Tile Blocking', () => {
    it('blocks LOS when wall is on the path', () => {
        const a = axial(0, 0);
        const b = axial(3, 0);
        const opts: LOSOptions = { blocksAt: wallAt(1, 0) };
        expect(hasLineOfSight(a, b, opts)).toBe(false);
    });

    it('allows LOS when no obstacles', () => {
        const a = axial(0, 0);
        const b = axial(3, 0);
        const opts: LOSOptions = { blocksAt: wallAt(5, 5) }; // wall far away
        expect(hasLineOfSight(a, b, opts)).toBe(true);
    });

    it('provides detailed ray info when blocked', () => {
        const a = axial(0, 0);
        const b = axial(3, 0);
        const opts: LOSOptions = { blocksAt: wallAt(1, 0) };
        const ray = traceRay(a, b, opts);
        expect(ray.clear).toBe(false);
        expect(ray.blockedBy).toBe('tile');
        expect(ray.steps.some(s => s.blockedTile)).toBe(true);
    });

    it('identifies blocking step correctly', () => {
        const a = axial(0, 0);
        const b = axial(3, 0);
        const opts: LOSOptions = { blocksAt: wallAt(1, 0) };
        const ray = traceRay(a, b, opts);
        const blockingStep = ray.steps.find(s => s.blockedTile);
        expect(blockingStep).toBeDefined();
        expect(blockingStep!.hex.q).toBe(1);
        expect(blockingStep!.hex.r).toBe(0);
    });
});

describe('LOS - Edge Blocking', () => {
    it('blocks LOS when wall is on the edge', () => {
        const a = axial(0, 0);
        const b = axial(2, 0);
        const opts: LOSOptions = { blocksEdge: edgeBlock(0, 0, 1, 0) };
        expect(hasLineOfSight(a, b, opts)).toBe(false);
    });

    it('allows LOS when edge is clear', () => {
        const a = axial(0, 0);
        const b = axial(2, 0);
        const opts: LOSOptions = { blocksEdge: edgeBlock(5, 5, 6, 6) }; // edge far away
        expect(hasLineOfSight(a, b, opts)).toBe(true);
    });

    it('reports edge blocking in raycast', () => {
        const a = axial(0, 0);
        const b = axial(2, 0);
        const opts: LOSOptions = { blocksEdge: edgeBlock(0, 0, 1, 0) };
        const ray = traceRay(a, b, opts);
        expect(ray.clear).toBe(false);
        expect(ray.blockedBy).toBe('edge');
        expect(ray.steps.some(s => s.blockedEdge)).toBe(true);
    });

    it('handles multiple edges correctly', () => {
        const a = axial(0, 0);
        const b = axial(3, 0);
        const blocksMultiple: BlocksSightEdgeFn = (from, to) =>
            (from.q === 0 && from.r === 0 && to.q === 1 && to.r === 0) ||
            (from.q === 1 && from.r === 0 && to.q === 2 && to.r === 0);
        const opts: LOSOptions = { blocksEdge: blocksMultiple };
        const ray = traceRay(a, b, opts);
        expect(ray.clear).toBe(false);
        // Should block at first edge
        expect(ray.blockedBy).toBe('edge');
    });
});

describe('LOS - Soft Cover', () => {
    it('accumulates soft cover from mid hexes', () => {
        const a = axial(0, 0);
        const b = axial(3, 0);
        const opts: LOSOptions = {
            softCoverAt: h => (h.q === 1 && h.r === 0 ? 0.5 : 0),
        };
        const ray = traceRay(a, b, opts);
        expect(ray.coverSum).toBeGreaterThan(0);
        expect(ray.coverPenalty).toBeGreaterThan(0);
    });

    it('does not accumulate cover from start or target', () => {
        const a = axial(0, 0);
        const b = axial(1, 0);
        const opts: LOSOptions = {
            softCoverAt: h => (h.q === 0 || h.q === 1 ? 1.0 : 0), // both endpoints
        };
        const ray = traceRay(a, b, opts);
        // No mid hexes, so no cover
        expect(ray.coverSum).toBe(0);
        expect(ray.coverPenalty).toBe(0);
    });

    it('caps soft cover at maxSoftCover', () => {
        const a = axial(0, 0);
        const b = axial(10, 0);
        const opts: LOSOptions = {
            softCoverAt: () => 1.0, // All mid hexes have max cover
            maxSoftCover: 3.0,
        };
        const ray = traceRay(a, b, opts);
        expect(ray.coverSum).toBeLessThanOrEqual(3.0);
    });

    it('computes penalty with exponential falloff', () => {
        const a = axial(0, 0);
        const b = axial(3, 0);
        const opts: LOSOptions = {
            softCoverAt: h => (h.q === 1 && h.r === 0 ? 1.0 : 0),
            softCoverK: 0.7,
        };
        const ray = traceRay(a, b, opts);
        // Penalty = 1 - e^(-0.7 * 1.0) ≈ 0.503
        expect(ray.coverPenalty).toBeGreaterThan(0.4);
        expect(ray.coverPenalty).toBeLessThan(0.6);
    });

    it('handles zero cover correctly', () => {
        const a = axial(0, 0);
        const b = axial(3, 0);
        const opts: LOSOptions = {
            softCoverAt: () => 0,
        };
        const ray = traceRay(a, b, opts);
        expect(ray.coverSum).toBe(0);
        expect(ray.coverPenalty).toBe(0);
    });
});

describe('LOS - Opaque Target Visibility', () => {
    it('sees opaque target when seeOpaqueTarget=true (default)', () => {
        const a = axial(0, 0);
        const b = axial(1, 0);
        const opts: LOSOptions = { blocksAt: wallAt(1, 0), seeOpaqueTarget: true };
        expect(hasLineOfSight(a, b, opts)).toBe(true);
    });

    it('does not see opaque target when seeOpaqueTarget=false', () => {
        const a = axial(0, 0);
        const b = axial(1, 0);
        const opts: LOSOptions = { blocksAt: wallAt(1, 0), seeOpaqueTarget: false };
        expect(hasLineOfSight(a, b, opts)).toBe(false);
    });

    it('blocks on mid opaque hex regardless of seeOpaqueTarget', () => {
        const a = axial(0, 0);
        const b = axial(3, 0);
        const opts: LOSOptions = { blocksAt: wallAt(1, 0), seeOpaqueTarget: true };
        expect(hasLineOfSight(a, b, opts)).toBe(false);
    });
});

describe('LOS - Elevation Blocking', () => {
    it('blocks when elevation rises above sight line', () => {
        const a = axial(0, 0);
        const b = axial(3, 0);
        const elevations = new Map<string, number>([
            ['0,0', 0],
            ['1,0', 2], // tall obstacle
            ['2,0', 0],
            ['3,0', 0],
        ]);
        const opts: LOSOptions = {
            elevationAt: h => elevations.get(`${h.q},${h.r}`) ?? 0,
        };
        const ray = traceRay(a, b, opts);
        expect(ray.clear).toBe(false);
        expect(ray.blockedBy).toBe('elevation');
    });

    it('allows LOS when elevation stays below sight line', () => {
        const a = axial(0, 0);
        const b = axial(3, 0);
        const elevations = new Map<string, number>([
            ['0,0', 0],
            ['1,0', 0], // flat
            ['2,0', 0],
            ['3,0', 0],
        ]);
        const opts: LOSOptions = {
            elevationAt: h => elevations.get(`${h.q},${h.r}`) ?? 0,
        };
        const ray = traceRay(a, b, opts);
        expect(ray.clear).toBe(true);
    });

    it('handles uphill shots correctly', () => {
        const a = axial(0, 0);
        const b = axial(3, 0);
        const elevations = new Map<string, number>([
            ['0,0', 0],
            ['1,0', 1],
            ['2,0', 2],
            ['3,0', 3],
        ]);
        const opts: LOSOptions = {
            elevationAt: h => elevations.get(`${h.q},${h.r}`) ?? 0,
        };
        const ray = traceRay(a, b, opts);
        // Sight line interpolates 0->3, mid hexes at 1,2 are on the line
        expect(ray.clear).toBe(true);
    });

    it('stores elevation data in ray steps', () => {
        const a = axial(0, 0);
        const b = axial(2, 0);
        const elevations = new Map<string, number>([
            ['0,0', 0],
            ['1,0', 1],
            ['2,0', 0],
        ]);
        const opts: LOSOptions = {
            elevationAt: h => elevations.get(`${h.q},${h.r}`) ?? null,
        };
        const ray = traceRay(a, b, opts);
        expect(ray.steps[0].elevation).toBe(0);
        expect(ray.steps[1].elevation).toBe(1);
        expect(ray.steps[2].elevation).toBe(0);
    });
});

describe('LOS - Combined Blocking', () => {
    it('reports first blocker when multiple types present', () => {
        const a = axial(0, 0);
        const b = axial(3, 0);
        const opts: LOSOptions = {
            blocksAt: wallAt(2, 0),
            blocksEdge: edgeBlock(0, 0, 1, 0),
        };
        const ray = traceRay(a, b, opts);
        expect(ray.clear).toBe(false);
        // Edge is checked first in traversal
        expect(ray.blockedBy).toBe('edge');
    });

    it('combines soft cover with hard blocking', () => {
        const a = axial(0, 0);
        const b = axial(3, 0);
        const opts: LOSOptions = {
            blocksAt: wallAt(2, 0),
            softCoverAt: h => (h.q === 1 && h.r === 0 ? 0.5 : 0),
        };
        const ray = traceRay(a, b, opts);
        expect(ray.clear).toBe(false);
        expect(ray.coverSum).toBeGreaterThan(0); // Still accumulated before blocking
    });
});

describe('LOS - Visibility Field', () => {
    it('computes visibility within radius without blockers', () => {
        const a = axial(0, 0);
        const vis = visibleWithinRadius(a, 2);
        // Without blockers, all disk cells are visible: 1 + 3*2*(2+1) = 19
        expect(vis.size).toBe(19);
    });

    it('includes origin in visibility field', () => {
        const a = axial(0, 0);
        const vis = visibleWithinRadius(a, 2);
        expect(vis.has(axialKey(a))).toBe(true);
    });

    it('respects blockers in visibility field', () => {
        const a = axial(0, 0);
        const opts: LOSOptions = { blocksAt: wallAt(1, 0) };
        const vis = visibleWithinRadius(a, 2, opts);

        // With default seeOpaqueTarget=true, the wall at (1,0) IS visible
        expect(vis.has('1,0')).toBe(true); // Wall itself is visible as opaque target

        // But hexes strictly behind the wall should be blocked
        expect(vis.size).toBeLessThan(19);
        expect(vis.has('2,0')).toBe(false); // Behind the wall
    });

    it('handles zero radius correctly', () => {
        const a = axial(0, 0);
        const vis = visibleWithinRadius(a, 0);
        expect(vis.size).toBe(1);
        expect(vis.has(axialKey(a))).toBe(true);
    });

    it('handles large radius efficiently', () => {
        const a = axial(0, 0);
        const vis = visibleWithinRadius(a, 10);
        // Should complete without hanging
        expect(vis.size).toBeGreaterThan(100);
    });
});

describe('LOS - Cover Between Convenience', () => {
    it('returns cover result with penalty', () => {
        const a = axial(0, 0);
        const b = axial(3, 0);
        const opts: LOSOptions = {
            softCoverAt: h => (h.q === 1 && h.r === 0 ? 0.5 : 0),
        };
        const cv = coverBetween(a, b, opts);
        expect(cv.penalty).toBeGreaterThan(0);
        expect(cv.sum).toBeGreaterThan(0);
        expect(cv.clear).toBe(true);
    });

    it('includes blocking info', () => {
        const a = axial(0, 0);
        const b = axial(3, 0);
        const opts: LOSOptions = { blocksAt: wallAt(1, 0) };
        const cv = coverBetween(a, b, opts);
        expect(cv.clear).toBe(false);
        expect(cv.blockedBy).toBe('tile');
    });

    it('provides debug steps', () => {
        const a = axial(0, 0);
        const b = axial(2, 0);
        const cv = coverBetween(a, b);
        expect(cv.debug).toBeDefined();
        expect(cv.debug!.length).toBe(3); // start, mid, target
    });
});

describe('LOS - Ray Step Structure', () => {
    it('tags steps correctly', () => {
        const a = axial(0, 0);
        const b = axial(3, 0);
        const ray = traceRay(a, b);
        expect(ray.steps[0].kind).toBe('start');
        expect(ray.steps[1].kind).toBe('mid');
        expect(ray.steps[2].kind).toBe('mid');
        expect(ray.steps[3].kind).toBe('target');
    });

    it('provides correct indices', () => {
        const a = axial(0, 0);
        const b = axial(2, 0);
        const ray = traceRay(a, b);
        expect(ray.steps[0].index).toBe(0);
        expect(ray.steps[1].index).toBe(1);
        expect(ray.steps[2].index).toBe(2);
    });

    it('handles adjacent hexes (no mid steps)', () => {
        const a = axial(0, 0);
        const b = axial(1, 0);
        const ray = traceRay(a, b);
        expect(ray.steps.length).toBe(2);
        expect(ray.steps[0].kind).toBe('start');
        expect(ray.steps[1].kind).toBe('target');
        expect(ray.coverSum).toBe(0); // No mid steps
    });

    it('handles same hex (self LOS)', () => {
        const a = axial(0, 0);
        const b = axial(0, 0);
        const ray = traceRay(a, b);
        expect(ray.steps.length).toBe(1);
        expect(ray.steps[0].kind).toBe('start'); // Single hex is start (and implicitly target)
        expect(ray.clear).toBe(true);
    });
});

describe('LOS - Edge Cases', () => {
    it('handles null elevation gracefully', () => {
        const a = axial(0, 0);
        const b = axial(2, 0);
        const opts: LOSOptions = {
            elevationAt: () => null,
        };
        const ray = traceRay(a, b, opts);
        expect(ray.clear).toBe(true);
    });

    it('handles undefined elevation gracefully', () => {
        const a = axial(0, 0);
        const b = axial(2, 0);
        const opts: LOSOptions = {
            elevationAt: () => undefined,
        };
        const ray = traceRay(a, b, opts);
        expect(ray.clear).toBe(true);
    });

    it('clamps soft cover to [0,1]', () => {
        const a = axial(0, 0);
        const b = axial(3, 0);
        const opts: LOSOptions = {
            softCoverAt: h => (h.q === 1 && h.r === 0 ? 5.0 : -1.0), // Out of bounds
        };
        const ray = traceRay(a, b, opts);
        // Should clamp to 1.0 max per hex
        expect(ray.steps[1].softCover).toBe(1.0);
    });

    it('handles negative soft cover k correctly', () => {
        const a = axial(0, 0);
        const b = axial(3, 0);
        const opts: LOSOptions = {
            softCoverAt: h => (h.q === 1 && h.r === 0 ? 1.0 : 0),
            softCoverK: -0.5, // Invalid but should not crash
        };
        const ray = traceRay(a, b, opts);
        // With negative k, exp(-(-0.5)*1) = exp(0.5) > 1, so 1-exp(0.5) is negative
        // But we clamp to [0,1] implicitly via Math.max in penalty computation
        expect(ray.coverPenalty).toBeGreaterThanOrEqual(0);
    });
});
