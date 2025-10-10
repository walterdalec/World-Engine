// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/battle/hex/pathfinding.ts
// Canvas #6: Hex-grid A* pathfinding with pluggable movement costs, blockers,
//            occupancy, and Zones of Control (ZoC). Includes heuristic tuning,
//            tie-breaking for prettier paths, optional LOS-based smoothing, and
//            multi-target search. Pure math — no rendering or engine types.
//
// Depends on: coords.ts (Canvas #1), math.ts (Canvas #2), los.ts (Canvas #4)
// ──────────────────────────────────────────────────────────────────────────────

import type { Axial, AxialLike } from './coords';
import { axialKey } from './coords';
import { axialNeighbors, axialDistance } from './math';

//#region Types
export type MP = number;

/** Return ENTER cost for a hex. Infinity/NaN/negative => impassable. */
export type MoveCostFn = (_hex: AxialLike) => number;
export type EdgeBlockerFn = (_from: AxialLike, _to: AxialLike) => boolean;
export type IsOccupiedFn = (_hex: AxialLike) => boolean;
export type HasLineOfSightFn = (_from: AxialLike, _to: AxialLike) => boolean;

export interface AStarOptions {
    /** Heuristic scale; 1 = classic A*, 0 = Dijkstra, >1 = greedier. */
    heuristicScale?: number;
    /** Lower bound on per-hex move cost for admissible heuristic; default 1. */
    minStepCost?: number;
    /** Tie-break factor (ε) to prefer straighter paths; default 1e-3. */
    tieBreakEpsilon?: number;
    /** Forbids transitions along blocked edges (walls/doors/rivers). */
    edgeBlocker?: EdgeBlockerFn;
    /** Blocks entry into currently occupied hexes (except start/goal allowances via caller). */
    isOccupied?: IsOccupiedFn;
    /** Zones of Control: hex keys that exert ZoC into their neighbors. */
    zocHexes?: Set<string>;
    /** Additional cost when moving *from* or *into* a hex adjacent to ZoC source. */
    zocPenalty?: number;
    /** If true, once you step into ZoC, you cannot step further (stop-on-enter). */
    stopOnZoCEnter?: boolean;
    /** Optional hard expansion cap to avoid worst-case blowups. */
    nodeLimit?: number;
    /** Optional LOS fn for path smoothing (string-pulling). */
    hasLineOfSight?: HasLineOfSightFn;
}

export interface PathNode {
    pos: Axial;
    g: number; // cost from start
    f: number; // g + h
    parent?: Axial;
    sealed?: boolean; // if ZoC-locked (no further expansion)
}

export interface PathResult {
    path: Axial[] | null;
    cost: number;
    visited: number;
    expanded: number;
    closedSize: number;
    reason?: 'blocked' | 'node-limit' | 'no-path';
}
//#endregion

//#region Min-heap (binary)
class Heap<T> {
    private a: { k: number; tiebreak: number; v: T }[] = [];
    size() {
        return this.a.length;
    }
    push(k: number, tiebreak: number, v: T) {
        this.a.push({ k, tiebreak, v });
        this.up(this.a.length - 1);
    }
    pop(): T | undefined {
        const a = this.a;
        if (!a.length) return undefined;
        const top = a[0].v;
        const last = a.pop()!;
        if (a.length) {
            a[0] = last;
            this.down(0);
        }
        return top;
    }
    private lt(i: number, j: number) {
        const a = this.a;
        return a[i].k === a[j].k ? a[i].tiebreak < a[j].tiebreak : a[i].k < a[j].k;
    }
    private up(i: number) {
        let idx = i;
        while (idx) {
            const p = (idx - 1) >> 1;
            if (this.lt(p, idx)) break;
            [this.a[p], this.a[idx]] = [this.a[idx], this.a[p]];
            idx = p;
        }
    }
    private down(i: number) {
        let idx = i;
        for (; ;) {
            const l = idx * 2 + 1;
            const r = l + 1;
            let m = idx;
            if (l < this.a.length && !this.lt(m, l)) m = l;
            if (r < this.a.length && !this.lt(m, r)) m = r;
            if (m === idx) break;
            [this.a[m], this.a[idx]] = [this.a[idx], this.a[m]];
            idx = m;
        }
    }
}
//#endregion

//#region Core A*
/**
 * A* pathfinding from start to goal with pluggable movement costs.
 * 
 * @param start - Starting hex position
 * @param goal - Target hex position
 * @param costFn - Function returning ENTER cost for each hex (Infinity = impassable)
 * @param opts - Pathfinding options (heuristics, blockers, ZoC, etc.)
 * @returns PathResult with path, cost, and search statistics
 */
export function aStar(
    start: AxialLike,
    goal: AxialLike,
    costFn: MoveCostFn,
    opts: AStarOptions = {},
): PathResult {
    const heuristicScale = opts.heuristicScale ?? 1;
    const minStep = Math.max(1e-9, opts.minStepCost ?? 1);
    const eps = opts.tieBreakEpsilon ?? 1e-3;
    const edgeBlocker = opts.edgeBlocker || ((_from, _to) => false);
    const isOccupied = opts.isOccupied || ((_hex) => false);
    const zoc = opts.zocHexes || new Set<string>();
    const zocPenalty = opts.zocPenalty ?? 0;
    const stopOnZoCEnter = !!opts.stopOnZoCEnter;
    const nodeLimit = opts.nodeLimit ?? Infinity;

    const S: Axial = { q: start.q, r: start.r };
    const G: Axial = { q: goal.q, r: goal.r };
    const sKey = axialKey(S);
    const gKey = axialKey(G);

    // Early exit: start == goal
    if (sKey === gKey) return { path: [S], cost: 0, visited: 1, expanded: 0, closedSize: 0 };

    const open = new Heap<string>();
    const nodes = new Map<string, PathNode>();
    const closed = new Set<string>();

    const h0 = axialDistance(S, G) * minStep * heuristicScale;
    nodes.set(sKey, { pos: S, g: 0, f: h0 });
    open.push(h0, 0, sKey);

    let visited = 0;
    let expanded = 0;

    while (open.size()) {
        const key = open.pop()!;
        const cur = nodes.get(key)!;
        if (closed.has(key)) continue;
        closed.add(key);
        expanded++;

        if (key === gKey) {
            // Reconstruct path
            const path: Axial[] = [];
            let n: PathNode | undefined = cur;
            while (n) {
                path.push(n.pos);
                if (!n.parent) break;
                n = nodes.get(axialKey(n.parent));
            }
            path.reverse();
            const result: PathResult = { path, cost: cur.g, visited, expanded, closedSize: closed.size };
            // Optional LOS smoothing
            if (opts.hasLineOfSight && path.length > 2) {
                result.path = smoothPathByLOS(path, opts.hasLineOfSight);
            }
            return result;
        }

        // Don't expand if this node is sealed by ZoC
        if (cur.sealed) continue;

        // Expand neighbors
        const neighbors = axialNeighbors(cur.pos);
        for (let i = 0; i < neighbors.length; i++) {
            const nb = neighbors[i];
            const nbKey = axialKey(nb);
            if (closed.has(nbKey)) continue;
            if (edgeBlocker(cur.pos, nb)) continue;
            // Allow stepping into the goal even if occupied (common UX), caller can override by isOccupied
            if (isOccupied(nb) && nbKey !== gKey) continue;

            const stepCost = costFn(nb);
            if (!Number.isFinite(stepCost) || stepCost < 0) continue;

            let seal = false;
            let extra = 0;
            if (zoc.size) {
                const nbAdj = axialNeighbors(nb);
                const entersZoC = nbAdj.some((h) => zoc.has(axialKey(h)));
                if (entersZoC) {
                    if (stopOnZoCEnter) seal = true;
                    extra += zocPenalty;
                }
            }

            const tentativeG = cur.g + stepCost + extra;
            const prev = nodes.get(nbKey);
            if (!prev || tentativeG < prev.g) {
                const h = axialDistance(nb, G) * minStep * heuristicScale;
                // Tie-break nudges paths to be straighter by adding an epsilon * cross-product proxy
                // Here we use distance from start + distance to goal as a gentle bias.
                const tiebreak = eps * (axialDistance(S, nb) + axialDistance(nb, G));
                const f = tentativeG + h + tiebreak;
                nodes.set(nbKey, { pos: { q: nb.q, r: nb.r }, g: tentativeG, f, parent: cur.pos, sealed: seal });
                open.push(f, tiebreak, nbKey);
                visited++;
            }
        }
    }

    return { path: null, cost: Infinity, visited, expanded, closedSize: closed.size, reason: 'no-path' };
}
//#endregion

//#region Multi-target search
/**
 * A* pathfinding from start to the nearest goal in a set of targets.
 * 
 * @param start - Starting hex position
 * @param goals - Array of potential goal positions
 * @param costFn - Function returning ENTER cost for each hex
 * @param opts - Pathfinding options
 * @returns PathResult with the reached goal included
 */
export function aStarToAny(
    start: AxialLike,
    goals: AxialLike[],
    costFn: MoveCostFn,
    opts: AStarOptions = {},
): PathResult & { goal?: Axial } {
    if (!goals.length)
        return { path: null, cost: Infinity, visited: 0, expanded: 0, closedSize: 0, reason: 'blocked' };

    const goalKeys = new Set(goals.map(axialKey));

    // Multi-goal heuristic: distance to nearest goal
    const heuristic = (h: AxialLike) => {
        let best = Number.POSITIVE_INFINITY;
        for (let i = 0; i < goals.length; i++) {
            best = Math.min(best, axialDistance(h, goals[i]));
        }
        return best;
    };

    const minStep = Math.max(1e-9, opts.minStepCost ?? 1);
    const scale = opts.heuristicScale ?? 1;
    const eps = opts.tieBreakEpsilon ?? 1e-3;
    const edgeBlocker = opts.edgeBlocker || ((_from, _to) => false);
    const isOccupied = opts.isOccupied || ((_hex) => false);
    const zoc = opts.zocHexes || new Set<string>();
    const zocPenalty = opts.zocPenalty ?? 0;
    const stopOnZoCEnter = !!opts.stopOnZoCEnter;
    const nodeLimit = opts.nodeLimit ?? Infinity;

    const S: Axial = { q: start.q, r: start.r };
    const sKey = axialKey(S);
    const open = new Heap<string>();
    const nodes = new Map<string, PathNode>();
    const closed = new Set<string>();

    const h0 = heuristic(S) * minStep * scale;
    nodes.set(sKey, { pos: S, g: 0, f: h0 });
    open.push(h0, 0, sKey);

    let visited = 0;
    let expanded = 0;

    while (open.size()) {
        const key = open.pop()!;
        const cur = nodes.get(key)!;
        if (closed.has(key)) continue;

        // Check node limit BEFORE expanding
        if (closed.size >= nodeLimit) {
            return { path: null, cost: Infinity, visited, expanded, closedSize: closed.size, reason: 'node-limit' };
        }

        closed.add(key);
        expanded++;

        if (goalKeys.has(key)) {
            const path: Axial[] = [];
            let n: PathNode | undefined = cur;
            while (n) {
                path.push(n.pos);
                if (!n.parent) break;
                n = nodes.get(axialKey(n.parent));
            }
            path.reverse();
            const result: PathResult & { goal?: Axial } = {
                path,
                cost: cur.g,
                visited,
                expanded,
                closedSize: closed.size,
                goal: cur.pos,
            };
            if (opts.hasLineOfSight && path.length > 2) result.path = smoothPathByLOS(path, opts.hasLineOfSight);
            return result;
        }

        // Don't expand if this node is sealed by ZoC
        if (cur.sealed) continue;

        const neighbors = axialNeighbors(cur.pos);
        for (let i = 0; i < neighbors.length; i++) {
            const nb = neighbors[i];
            const nbKey = axialKey(nb);
            if (closed.has(nbKey)) continue;
            if (edgeBlocker(cur.pos, nb)) continue;
            if (isOccupied(nb) && !goalKeys.has(nbKey)) continue;
            const stepCost = costFn(nb);
            if (!Number.isFinite(stepCost) || stepCost < 0) continue;

            let seal = false;
            let extra = 0;
            if (zoc.size) {
                const nbAdj = axialNeighbors(nb);
                const entersZoC = nbAdj.some((h) => zoc.has(axialKey(h)));
                if (entersZoC) {
                    if (stopOnZoCEnter) seal = true;
                    extra += zocPenalty;
                }
            }

            const tentativeG = cur.g + stepCost + extra;
            const prev = nodes.get(nbKey);
            if (!prev || tentativeG < prev.g) {
                const h = heuristic(nb) * minStep * scale;
                const tiebreak = eps * (axialDistance(S, nb) + h);
                const f = tentativeG + h + tiebreak;
                nodes.set(nbKey, { pos: { q: nb.q, r: nb.r }, g: tentativeG, f, parent: cur.pos, sealed: seal });
                open.push(f, tiebreak, nbKey);
                visited++;
            }
        }
    }

    return { path: null, cost: Infinity, visited, expanded, closedSize: closed.size, reason: 'no-path' };
}
//#endregion

//#region Smoothing (optional)
/**
 * Simplify a path by greedily skipping waypoints when LOS stays clear.
 * String-pulling algorithm for cleaner movement.
 * 
 * @param path - Original A* path with all waypoints
 * @param hasLOS - Line-of-sight check function
 * @returns Smoothed path with fewer waypoints
 */
export function smoothPathByLOS(path: Axial[], hasLOS: HasLineOfSightFn): Axial[] {
    if (path.length <= 2) return path.slice();
    const out: Axial[] = [];
    let i = 0;
    while (i < path.length) {
        out.push(path[i]);
        // Find farthest j we can see directly from i
        let j = path.length - 1;
        while (j > i + 1 && !hasLOS(path[i], path[j])) j--;
        i = j;
        if (i === path.length - 1) break;
    }
    // ensure target included
    if (out[out.length - 1] !== path[path.length - 1]) out.push(path[path.length - 1]);
    return out;
}
//#endregion

//#region Convenience wrappers
/**
 * Uniform-cost pathfinding (all passable hexes cost 1).
 * Simplified interface for basic grid pathfinding.
 * 
 * @param start - Starting hex position
 * @param goal - Target hex position
 * @param isPassable - Function returning true if hex is passable
 * @param opts - Pathfinding options (excluding costFn)
 * @returns PathResult with path and statistics
 */
export function aStarUniform(
    start: AxialLike,
    goal: AxialLike,
    isPassable: (_hex: AxialLike) => boolean,
    opts: Omit<AStarOptions, 'edgeBlocker'> & { edgeBlocker?: EdgeBlockerFn } = {},
): PathResult {
    const costFn: MoveCostFn = (h) => (isPassable(h) ? 1 : Infinity);
    return aStar(start, goal, costFn, opts);
}
//#endregion
