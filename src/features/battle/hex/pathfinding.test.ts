// ──────────────────────────────────────────────────────────────────────────────
// Canvas #6 Tests: Pathfinding (A* + ZoC + Multi-target + Smoothing)
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import { axialKey } from './coords';
import { axialDistance } from './math';
import type { Axial, AxialLike } from './coords';
import {
    aStar,
    aStarUniform,
    aStarToAny,
    smoothPathByLOS,
    type AStarOptions,
    type MoveCostFn,
} from './pathfinding';

/** Helper: diamond-shaped passable region (origin-centered) */
function diamondPassable(size: number) {
    return (h: { q: number; r: number }) =>
        Math.abs(h.q) <= size && Math.abs(h.r) <= size && Math.abs(h.q + h.r) <= size;
}

/** Helper: verify path continuity (each step is a neighbor) */
function isPathContinuous(path: Axial[]): boolean {
    for (let i = 1; i < path.length; i++) {
        if (axialDistance(path[i - 1], path[i]) !== 1) return false;
    }
    return true;
}

/** Helper: verify path endpoints */
function checkEndpoints(path: Axial[] | null, start: AxialLike, goal: AxialLike): boolean {
    if (!path) return false;
    const s = path[0];
    const e = path[path.length - 1];
    return s.q === start.q && s.r === start.r && e.q === goal.q && e.r === goal.r;
}

//#region Basic A* Tests
describe('Canvas #6 — Basic A* on Uniform Grid', () => {
    it('finds straight horizontal path', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 3, r: 0 };
        const res = aStarUniform(S, G, diamondPassable(5));
        expect(res.path).not.toBeNull();
        expect(checkEndpoints(res.path, S, G)).toBe(true);
        expect(isPathContinuous(res.path!)).toBe(true);
        expect(res.cost).toBe(3);
    });

    it('finds diagonal path', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 2, r: 2 };
        const res = aStarUniform(S, G, diamondPassable(5));
        expect(res.path).not.toBeNull();
        expect(checkEndpoints(res.path, S, G)).toBe(true);
        expect(res.cost).toBe(4); // Hex diagonal = 4 steps
    });

    it('returns self-path when start == goal', () => {
        const S: Axial = { q: 1, r: 1 };
        const res = aStarUniform(S, S, diamondPassable(5));
        expect(res.path).toEqual([S]);
        expect(res.cost).toBe(0);
        expect(res.expanded).toBe(0);
    });

    it('returns null when goal is impassable', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 10, r: 10 }; // Outside diamond
        const res = aStarUniform(S, G, diamondPassable(5));
        expect(res.path).toBeNull();
        expect(res.reason).toBe('no-path');
    });

    it('returns null when no path exists (blocked region)', () => {
        const S: Axial = { q: -2, r: 0 };
        const G: Axial = { q: 2, r: 0 };
        const diamond = diamondPassable(3);
        const passable = (h: AxialLike) => diamond(h) && h.q !== 0; // Wall at q=0 within bounded region
        const res = aStarUniform(S, G, passable);
        expect(res.path).toBeNull();
        expect(res.reason).toBe('no-path');
    });
});
//#endregion

//#region Edge Blocker Tests
describe('Canvas #6 — Edge Blockers (Walls/Doors/Rivers)', () => {
    it('stops crossing a blocked edge', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 2, r: 0 };
        const opts: AStarOptions = {
            edgeBlocker: (from, to) => from.q === 0 && from.r === 0 && to.q === 1 && to.r === 0,
        };
        const res = aStarUniform(S, G, diamondPassable(5), opts);
        // Direct path blocked but alternate routes exist through (0,1) or (1,-1)
        expect(res.path).not.toBeNull();
        expect(res.cost).toBeGreaterThan(2); // Must take detour
    });

    it('finds alternate route around blocked edge', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 2, r: 0 };
        const passable = diamondPassable(5);
        const opts: AStarOptions = {
            edgeBlocker: (from, to) => from.q === 1 && from.r === 0 && to.q === 2 && to.r === 0,
        };
        const res = aStarUniform(S, G, passable, opts);
        expect(res.path).not.toBeNull();
        expect(checkEndpoints(res.path, S, G)).toBe(true);
        // Path must detour around blocked edge
        expect(res.cost).toBeGreaterThan(2);
    });

    it('respects bidirectional edge blocks', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 1, r: 0 };
        const opts: AStarOptions = {
            edgeBlocker: (from, to) =>
                (from.q === 0 && to.q === 1 && from.r === 0 && to.r === 0) ||
                (from.q === 1 && to.q === 0 && from.r === 0 && to.r === 0),
        };
        const res = aStarUniform(S, G, diamondPassable(5), opts);
        // Direct edge blocked both ways but alternate routes exist through (0,1) or (1,-1)
        expect(res.path).not.toBeNull();
        expect(res.cost).toBe(2); // Via (0,1) or (1,-1)
    });
});
//#endregion

//#region Occupancy Tests
describe('Canvas #6 — Occupancy Checks', () => {
    it('allows entering occupied goal hex (default UX)', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 1, r: 0 };
        const occ = (h: AxialLike) => h.q === 1 && h.r === 0;
        const res = aStarUniform(S, G, diamondPassable(5), { isOccupied: occ });
        expect(res.path).not.toBeNull();
        expect(checkEndpoints(res.path, S, G)).toBe(true);
    });

    it('routes around occupied hexes in path', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 3, r: 0 };
        const occ = (h: AxialLike) => h.q === 1 && h.r === 0; // Block direct route
        const res = aStarUniform(S, G, diamondPassable(5), { isOccupied: occ });
        expect(res.path).not.toBeNull();
        expect(checkEndpoints(res.path, S, G)).toBe(true);
        // Verify path doesn't include blocked hex (except potentially goal)
        const blockedInPath = res.path!.some((h) => h.q === 1 && h.r === 0 && !(h.q === G.q && h.r === G.r));
        expect(blockedInPath).toBe(false);
    });

    it('returns null when all paths blocked by occupancy', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 2, r: 0 };
        const occ = (h: AxialLike) => h.q === 1; // Block all q=1 hexes
        const res = aStarUniform(S, G, diamondPassable(2), { isOccupied: occ });
        expect(res.path).toBeNull();
    });
});
//#endregion

//#region Variable Cost Tests
describe('Canvas #6 — Variable Movement Costs', () => {
    it('prefers low-cost path over short high-cost path', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 2, r: 0 };
        const costFn: MoveCostFn = (h) => {
            if (h.q === 1 && h.r === 0) return 10; // High cost on direct route
            return 1;
        };
        const res = aStar(S, G, costFn);
        expect(res.path).not.toBeNull();
        // Path should detour to avoid expensive hex
        const expensiveInPath = res.path!.some((h) => h.q === 1 && h.r === 0);
        expect(expensiveInPath).toBe(false);
    });

    it('handles fractional costs correctly', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 2, r: 0 };
        const costFn: MoveCostFn = (_h) => 0.5;
        const res = aStar(S, G, costFn);
        expect(res.path).not.toBeNull();
        expect(res.cost).toBe(1.0); // 2 steps * 0.5
    });

    it('treats Infinity cost as impassable', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 2, r: 0 };
        const passable = diamondPassable(3);
        const costFn: MoveCostFn = (h) => {
            if (!passable(h)) return Infinity;
            return h.q === 1 ? Infinity : 1;
        };
        const res = aStar(S, G, costFn);
        expect(res.path).toBeNull();
    });

    it('treats negative cost as impassable', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 2, r: 0 };
        const passable = diamondPassable(3);
        const costFn: MoveCostFn = (h) => {
            if (!passable(h)) return Infinity;
            return h.q === 1 ? -5 : 1;
        };
        const res = aStar(S, G, costFn);
        expect(res.path).toBeNull();
    });
});
//#endregion

//#region Zones of Control (ZoC) Tests
describe('Canvas #6 — Zones of Control (ZoC)', () => {
    it('applies ZoC penalty to adjacent hexes', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 3, r: 0 };
        const zoc = new Set([axialKey({ q: 1, r: 0 })]);
        const resNormal = aStarUniform(S, G, diamondPassable(5));
        const resZoC = aStarUniform(S, G, diamondPassable(5), { zocHexes: zoc, zocPenalty: 2 });
        expect(resZoC.cost).toBeGreaterThan(resNormal.cost);
    });

    it('stops expansion when entering ZoC with stopOnZoCEnter', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 4, r: 0 }; // Goal beyond ZoC
        const zoc = new Set([axialKey({ q: 2, r: 0 })]);
        const res = aStarUniform(S, G, diamondPassable(5), {
            zocHexes: zoc,
            zocPenalty: 0,
            stopOnZoCEnter: true,
        });
        // Can reach hexes adjacent to ZoC but cannot expand beyond them
        // ZoC at (2,0) makes (3,0) and (1,0) sealed - path can reach them but not expand from them
        // Goal at (4,0) requires expanding from (3,0), which is sealed, so unreachable
        expect(res.path).toBeNull();
    });

    it('allows bypassing ZoC when alternate routes exist', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 4, r: 0 };
        const zoc = new Set([axialKey({ q: 2, r: 0 })]);
        const res = aStarUniform(S, G, diamondPassable(5), {
            zocHexes: zoc,
            zocPenalty: 3,
            stopOnZoCEnter: false,
        });
        expect(res.path).not.toBeNull();
        // Path should route around ZoC to avoid penalty
        // Path may or may not go adjacent depending on cost tradeoffs
        expect(res.cost).toBeGreaterThan(4); // Base cost with detour/penalty
    });

    it('handles multiple ZoC sources', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 3, r: 0 };
        const zoc = new Set([axialKey({ q: 1, r: 0 }), axialKey({ q: 2, r: 0 })]);
        const res = aStarUniform(S, G, diamondPassable(5), { zocHexes: zoc, zocPenalty: 2 });
        expect(res.path).not.toBeNull();
        expect(res.cost).toBeGreaterThan(3); // Multiple penalties accumulated
    });
});
//#endregion

//#region Heuristic Tuning Tests
describe('Canvas #6 — Heuristic Tuning', () => {
    it('Dijkstra mode (heuristicScale=0) explores more nodes', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 5, r: 0 };
        const resAStar = aStarUniform(S, G, diamondPassable(6), { heuristicScale: 1 });
        const resDijkstra = aStarUniform(S, G, diamondPassable(6), { heuristicScale: 0 });
        expect(resDijkstra.expanded).toBeGreaterThanOrEqual(resAStar.expanded);
    });

    it('greedy mode (heuristicScale>1) explores fewer nodes', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 5, r: 0 };
        const resNormal = aStarUniform(S, G, diamondPassable(6), { heuristicScale: 1 });
        const resGreedy = aStarUniform(S, G, diamondPassable(6), { heuristicScale: 2 });
        expect(resGreedy.expanded).toBeLessThanOrEqual(resNormal.expanded);
    });

    it('minStepCost affects heuristic admissibility', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 3, r: 0 };
        const costFn: MoveCostFn = (_h) => 0.5;
        const res = aStar(S, G, costFn, { minStepCost: 0.5 });
        expect(res.path).not.toBeNull();
        expect(res.cost).toBeCloseTo(1.5, 2); // 3 steps * 0.5
    });

    it('tie-breaking produces deterministic paths', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 5, r: 0 };
        const res1 = aStarUniform(S, G, diamondPassable(6), { tieBreakEpsilon: 1e-3 });
        const res2 = aStarUniform(S, G, diamondPassable(6), { tieBreakEpsilon: 1e-3 });
        expect(res1.path).toEqual(res2.path); // Same path with same epsilon
    });
});
//#endregion

//#region Multi-Target Search Tests
describe('Canvas #6 — Multi-Target Search (aStarToAny)', () => {
    it('finds path to nearest goal', () => {
        const S: Axial = { q: 0, r: 0 };
        const goals: Axial[] = [
            { q: 5, r: 0 },
            { q: 2, r: 0 },
            { q: 4, r: 1 },
        ];
        const costFn: MoveCostFn = (_h) => 1;
        const res = aStarToAny(S, goals, costFn, { minStepCost: 1 });
        expect(res.path).not.toBeNull();
        expect(res.goal).toEqual(goals[1]); // Nearest at distance 2
        expect(res.cost).toBe(2);
    });

    it('returns null when no goals are reachable', () => {
        const S: Axial = { q: 0, r: 0 };
        const goals: Axial[] = [
            { q: 10, r: 10 },
            { q: -10, r: -10 },
        ];
        const passable = diamondPassable(5); // Goals are outside the bounded region
        const costFn: MoveCostFn = (h) => (passable(h) ? 1 : Infinity);
        const res = aStarToAny(S, goals, costFn, {});
        expect(res.path).toBeNull();
        expect(res.goal).toBeUndefined();
    });

    it('handles empty goal list gracefully', () => {
        const S: Axial = { q: 0, r: 0 };
        const res = aStarToAny(S, [], (_h) => 1, {});
        expect(res.path).toBeNull();
        expect(res.reason).toBe('blocked');
    });

    it('prefers low-cost goal over closer high-cost goal', () => {
        const S: Axial = { q: 0, r: 0 };
        const goals: Axial[] = [
            { q: 2, r: 0 }, // Closer but expensive route
            { q: 0, r: 3 }, // Farther but cheap route
        ];
        const costFn: MoveCostFn = (h) => {
            if (h.q > 0 && h.r === 0) return 10; // High cost on q-axis
            return 1;
        };
        const res = aStarToAny(S, goals, costFn);
        expect(res.path).not.toBeNull();
        // Should reach cheaper goal despite longer distance
        expect(res.goal).toEqual(goals[1]);
    });

    it('respects ZoC in multi-target search', () => {
        const S: Axial = { q: 0, r: 0 };
        const goals: Axial[] = [
            { q: 3, r: 0 },
            { q: 0, r: 3 },
        ];
        const zoc = new Set([axialKey({ q: 1, r: 0 })]);
        const res = aStarToAny(S, goals, (_h) => 1, { zocHexes: zoc, zocPenalty: 5 });
        expect(res.path).not.toBeNull();
        // Should prefer goal without ZoC penalty
        expect(res.goal).toEqual(goals[1]);
    });
});
//#endregion

//#region LOS Smoothing Tests
describe('Canvas #6 — LOS Path Smoothing', () => {
    it('reduces waypoints when LOS is clear', () => {
        const path: Axial[] = [
            { q: 0, r: 0 },
            { q: 1, r: 0 },
            { q: 2, r: 0 },
            { q: 3, r: 0 },
        ];
        const los = (_a: AxialLike, _b: AxialLike) => true; // Always clear
        const smooth = smoothPathByLOS(path, los);
        expect(smooth.length).toBeLessThan(path.length);
        expect(smooth[0]).toEqual(path[0]);
        expect(smooth[smooth.length - 1]).toEqual(path[path.length - 1]);
    });

    it('preserves waypoints when LOS is blocked', () => {
        const path: Axial[] = [
            { q: 0, r: 0 },
            { q: 1, r: 0 },
            { q: 2, r: 0 },
            { q: 3, r: 0 },
        ];
        const los = (_a: AxialLike, _b: AxialLike) => false; // Always blocked
        const smooth = smoothPathByLOS(path, los);
        expect(smooth).toEqual(path); // No changes
    });

    it('handles paths with 2 or fewer waypoints', () => {
        const shortPath: Axial[] = [
            { q: 0, r: 0 },
            { q: 1, r: 0 },
        ];
        const los = (_a: AxialLike, _b: AxialLike) => true;
        const smooth = smoothPathByLOS(shortPath, los);
        expect(smooth).toEqual(shortPath);
    });

    it('integrates with aStar via hasLineOfSight option', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 4, r: 0 };
        const los = (_a: AxialLike, _b: AxialLike) => true;
        const res = aStarUniform(S, G, diamondPassable(5), { hasLineOfSight: los });
        expect(res.path).not.toBeNull();
        // Smoothed path should be shorter than unsmoothed
        expect(res.path!.length).toBeLessThanOrEqual(5);
    });

    it('correctly skips intermediate waypoints with partial LOS', () => {
        const path: Axial[] = [
            { q: 0, r: 0 },
            { q: 1, r: 0 },
            { q: 2, r: 0 },
            { q: 2, r: 1 },
            { q: 3, r: 1 },
        ];
        const los = (a: AxialLike, b: AxialLike) => {
            // LOS clear only for straight segments
            return a.r === b.r || a.q === b.q;
        };
        const smooth = smoothPathByLOS(path, los);
        expect(smooth.length).toBeLessThan(path.length);
        expect(smooth[0]).toEqual(path[0]);
        expect(smooth[smooth.length - 1]).toEqual(path[path.length - 1]);
    });
});
//#endregion

//#region Node Limit Tests
describe('Canvas #6 — Node Limit Safety', () => {
    it('respects nodeLimit and returns early', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 10, r: 10 };
        const res = aStarUniform(S, G, diamondPassable(20), { nodeLimit: 10 });
        expect(res.path).toBeNull();
        expect(res.reason).toBe('node-limit');
        expect(res.closedSize).toBeLessThanOrEqual(10);
    });

    it('allows unlimited expansion by default', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 5, r: 0 };
        const res = aStarUniform(S, G, diamondPassable(6));
        expect(res.path).not.toBeNull();
        expect(res.reason).toBeUndefined();
    });

    it('nodeLimit applies to multi-target search', () => {
        const S: Axial = { q: 0, r: 0 };
        const goals: Axial[] = [
            { q: 10, r: 10 },
            { q: -10, r: -10 },
        ];
        const res = aStarToAny(S, goals, (_h) => 1, { nodeLimit: 10 });
        expect(res.path).toBeNull();
        expect(res.reason).toBe('node-limit');
    });
});
//#endregion

//#region Integration Tests (Multiple Systems)
describe('Canvas #6 — Integration Tests', () => {
    it('combines variable costs + ZoC + edge blockers', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 5, r: 0 };
        const costFn: MoveCostFn = (h) => (Math.abs(h.r) > 1 ? 3 : 1);
        const zoc = new Set([axialKey({ q: 2, r: 0 })]);
        const edgeBlocker = (from: AxialLike, to: AxialLike) => from.q === 3 && to.q === 4 && from.r === 0 && to.r === 0;
        const res = aStar(S, G, costFn, { zocHexes: zoc, zocPenalty: 2, edgeBlocker });
        expect(res.path).not.toBeNull();
        expect(checkEndpoints(res.path, S, G)).toBe(true);
    });

    it('combines occupancy + multi-target + smoothing', () => {
        const S: Axial = { q: 0, r: 0 };
        const goals: Axial[] = [
            { q: 3, r: 0 },
            { q: 0, r: 3 },
        ];
        const occ = (h: AxialLike) => h.q === 1 && h.r === 0;
        const los = (_a: AxialLike, _b: AxialLike) => true;
        const res = aStarToAny(S, goals, (_h) => 1, { isOccupied: occ, hasLineOfSight: los });
        expect(res.path).not.toBeNull();
        expect(res.goal).toBeDefined();
    });

    it('handles complex pathfinding scenario', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 8, r: 0 };
        const costFn: MoveCostFn = (h) => {
            if (h.q === 4) return 5; // Expensive corridor
            return 1;
        };
        const zoc = new Set([axialKey({ q: 6, r: 0 })]);
        const edgeBlocker = (from: AxialLike, to: AxialLike) => from.q === 2 && to.q === 3 && from.r === 0 && to.r === 0;
        const res = aStar(S, G, costFn, {
            zocHexes: zoc,
            zocPenalty: 3,
            edgeBlocker,
            heuristicScale: 1.2,
            tieBreakEpsilon: 1e-3,
        });
        expect(res.path).not.toBeNull();
        expect(checkEndpoints(res.path, S, G)).toBe(true);
        expect(isPathContinuous(res.path!)).toBe(true);
    });
});
//#endregion

//#region Statistics & Performance Tests
describe('Canvas #6 — Search Statistics', () => {
    it('tracks visited and expanded node counts', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 5, r: 0 };
        const res = aStarUniform(S, G, diamondPassable(6));
        expect(res.visited).toBeGreaterThan(0);
        expect(res.expanded).toBeGreaterThan(0);
        expect(res.expanded).toBeLessThanOrEqual(res.visited);
        expect(res.closedSize).toBe(res.expanded);
    });

    it('reports zero expanded for immediate start==goal', () => {
        const S: Axial = { q: 1, r: 1 };
        const res = aStarUniform(S, S, diamondPassable(5));
        expect(res.expanded).toBe(0);
        expect(res.visited).toBe(1);
    });

    it('provides cost for successful paths', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 3, r: 0 };
        const res = aStarUniform(S, G, diamondPassable(5));
        expect(res.cost).toBe(3);
        expect(res.path!.length).toBe(4); // 4 waypoints for 3 steps
    });

    it('returns Infinity cost when no path exists', () => {
        const S: Axial = { q: 0, r: 0 };
        const G: Axial = { q: 20, r: 20 };
        const res = aStarUniform(S, G, diamondPassable(5));
        expect(res.cost).toBe(Infinity);
        expect(res.path).toBeNull();
    });
});
//#endregion
