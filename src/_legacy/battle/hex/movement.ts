// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/battle/hex/movement.ts
// Purpose: Movement & Range systems built on coords.ts + math.ts.
//          - Dijkstra/Uniform-cost reachability under MP budget
//          - Terrain costs, impassables, occupancy, edge blockers (walls)
//          - Optional Zones of Control (ZoC) rules
//          - Path reconstruction for UI/AI
//          - Ability range predicates and move+attack helpers
//
// This layer is purely mathematical/systemic. No rendering. No game-specific
// unit data structures. Feed it minimal lambdas (costFn, blockers, zoc) so it
// can run inside tests and engine logic without UI.
// ──────────────────────────────────────────────────────────────────────────────

import type { Axial, AxialLike } from './coords';
import { axial, axialKey } from './coords';
import { axialDistance, axialNeighbors } from './math';

//#region Types
export type MP = number;

/** Terrain/Tile movement cost. Return Infinity for impassable. */
export type MoveCostFn = (_hex: AxialLike) => number;
/** Whether the edge between two adjacent hexes is blocked (e.g., wall). */
export type EdgeBlockerFn = (_from: AxialLike, _to: AxialLike) => boolean;
/** Whether a hex is currently occupied (blocking movement). */
export type IsOccupiedFn = (_hex: AxialLike) => boolean;
/** A set of hex keys that exert ZoC (usually enemy units). */
export type ZoCSet = Set<string>;

export interface MovementOptions {
    /** Additional edge blocker (walls/doors/rivers). Defaults to none. */
    edgeBlocker?: EdgeBlockerFn;
    /** Current occupancy function. Defaults to none. */
    isOccupied?: IsOccupiedFn;
    /** Hexes whose adjacency exerts ZoC. Defaults to empty. */
    zocHexes?: ZoCSet;
    /** If true, once you step into ZoC you may not step out further this turn. */
    stopOnZoCEnter?: boolean;
    /** Optional hard cap on explored frontier for perf (sane default is unlimited). */
    nodeLimit?: number;
}

export interface MoveNode {
    pos: Axial;
    /** Total MP spent to reach this hex. */
    cost: MP;
    /** Parent hex in the cheapest path (for reconstruction). */
    parent?: Axial;
    /** Whether the node is sealed (no further expansion) due to ZoC rule. */
    sealed?: boolean;
}

export interface MovementField {
    origin: Axial;
    maxMP: MP;
    /** Map key is axialKey(pos). */
    nodes: Map<string, MoveNode>;
}
//#endregion

//#region Priority Queue (binary heap, by cost)
class MinHeap<T> {
    private a: { k: number; v: T }[] = [];
    get size() {
        return this.a.length;
    }
    push(k: number, v: T) {
        const a = this.a;
        a.push({ k, v });
        this.up(a.length - 1);
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
    private up(i: number) {
        const a = this.a;
        while (i) {
            const p = (i - 1) >> 1;
            if (a[p].k <= a[i].k) break;
            [a[p], a[i]] = [a[i], a[p]];
            i = p;
        }
    }
    private down(i: number) {
        const a = this.a;
        for (; ;) {
            const l = i * 2 + 1;
            const r = l + 1;
            let m = i;
            if (l < a.length && a[l].k < a[m].k) m = l;
            if (r < a.length && a[r].k < a[m].k) m = r;
            if (m === i) break;
            [a[m], a[i]] = [a[i], a[m]];
            i = m;
        }
    }
}
//#endregion

//#region Core Movement Solver (Dijkstra)
/**
 * Compute all reachable hexes within maxMP using Dijkstra (uniform-cost search).
 *
 * - `costFn` returns per-hex ENTER cost (cost to enter target hex).
 * - `edgeBlocker` can forbid specific transitions (walls, cliffs, doors).
 * - `isOccupied` blocks entry into occupied hexes.
 * - `zocHexes` marks hexes that exert ZoC; entering a hex adjacent to a ZoC
 *   source will mark that node `sealed` and, if `stopOnZoCEnter`, prevent
 *   further expansion beyond it this turn.
 */
export function computeMovementField(
    origin: AxialLike,
    maxMP: MP,
    costFn: MoveCostFn,
    opts: MovementOptions = {},
): MovementField {
    const start = axial(origin.q, origin.r);
    const nodes = new Map<string, MoveNode>();
    const pq = new MinHeap<string>();

    const edgeBlocker = opts.edgeBlocker || (() => false);
    const isOccupied = opts.isOccupied || (() => false);
    const zoc = opts.zocHexes || new Set<string>();
    const stopOnZoCEnter = !!opts.stopOnZoCEnter;
    const nodeLimit = opts.nodeLimit ?? Infinity;

    // Seed
    const startKey = axialKey(start);
    nodes.set(startKey, { pos: start, cost: 0 });
    pq.push(0, startKey);

    while (pq.size) {
        const key = pq.pop()!;
        const node = nodes.get(key)!;

        if (node.cost > maxMP) continue;
        if (node.sealed) continue; // sealed nodes do not fan out

        for (const nb of axialNeighbors(node.pos)) {
            const nbKey = axialKey(nb);
            // edge blocked or occupied? skip
            if (edgeBlocker(node.pos, nb)) continue;
            if (isOccupied(nb) && nbKey !== startKey) continue;

            const stepCost = costFn(nb);
            if (!Number.isFinite(stepCost) || stepCost < 0) continue;

            const newCost = node.cost + stepCost;
            if (newCost > maxMP) continue;

            // Optional exploration cap - check before adding new nodes
            const prev = nodes.get(nbKey);
            if (!prev && nodes.size >= nodeLimit) continue; // Don't add new nodes if at limit

            if (!prev || newCost < prev.cost) {
                // Determine ZoC effect on entry
                let sealed = false;
                if (zoc.size) {
                    const adj = axialNeighbors(nb);
                    const entersZoC = adj.some(h => zoc.has(axialKey(h)));
                    if (entersZoC && stopOnZoCEnter) sealed = true;
                }
                nodes.set(nbKey, { pos: axial(nb.q, nb.r), cost: newCost, parent: node.pos, sealed });
                pq.push(newCost, nbKey);
            }
        }
    }

    return { origin: start, maxMP, nodes };
}
//#endregion

//#region Path reconstruction
export function reconstructPath(field: MovementField, target: AxialLike): Axial[] | null {
    const key = axialKey(target);
    const node = field.nodes.get(key);
    if (!node) return null;
    const path: Axial[] = [];
    let cur: MoveNode | undefined = node;
    while (cur) {
        path.push(cur.pos);
        if (!cur.parent) break;
        cur = field.nodes.get(axialKey(cur.parent));
    }
    path.reverse();
    return path;
}
//#endregion

//#region Ability Range Predicates
export interface RangeSpec {
    min?: number;
    max: number;
}

/** True if `b` is within [min,max] hexes of `a`. */
export function inHexRange(a: AxialLike, b: AxialLike, spec: RangeSpec): boolean {
    const d = axialDistance(a, b);
    const min = spec.min ?? 0;
    return d >= min && d <= spec.max;
}

/** All hexes within [min,max] around center, given a set of candidate hexes. */
export function filterByRange(center: AxialLike, hexes: AxialLike[], spec: RangeSpec): Axial[] {
    return hexes.filter(h => inHexRange(center, h, spec)).map(h => axial(h.q, h.r));
}
//#endregion

//#region Move + Attack Helpers
export interface AttackableFromOptions extends MovementOptions {
    /** Optional LOS/occlusion predicate. If provided, filters attack hexes. */
    hasLineOfSight?: (_from: AxialLike, _to: AxialLike) => boolean;
}

/**
 * Given a movement field and an attack range, compute hexes from which a target
 * could be attacked *this turn* (after moving). This returns the set of
 * potential "attack-from" hexes (not targets). To compute actual targets, call
 * `collectTargetsFromPositions` with your entity list.
 */
export function computeAttackFrom(
    field: MovementField,
    _attackRange: RangeSpec,
    _opts: AttackableFromOptions = {},
): Set<string> {
    const out = new Set<string>();
    const entries = Array.from(field.nodes.entries());
    for (const [, node] of entries) {
        // Gather all hexes in range of this node
        // We do NOT allocate a full disk here for perf; instead, we will defer to
        // caller to test specific targets. But we expose the positions that can be
        // used to launch the attack.
        const key = axialKey(node.pos);
        out.add(key);
    }
    return out;
}

/**
 * Utility: For a given set of attack-from positions, gather all target hexes
 * within range, optionally checking LOS/occlusion.
 */
export function collectTargetsFromPositions(
    fromPositions: Iterable<string | AxialLike>,
    potentialTargets: AxialLike[],
    attackRange: RangeSpec,
    opts: AttackableFromOptions = {},
): Axial[] {
    const los = opts.hasLineOfSight;
    const fromList: Axial[] = [];
    const fromArray = Array.from(fromPositions);
    for (const f of fromArray) {
        if (typeof f === 'string') {
            const [q, r] = f.split(',').map(Number);
            fromList.push(axial(q, r));
        } else {
            fromList.push(axial(f.q, f.r));
        }
    }

    const targets: Axial[] = [];
    for (const t of potentialTargets) {
        const T = axial(t.q, t.r);
        let ok = false;
        for (const F of fromList) {
            if (!inHexRange(F, T, attackRange)) continue;
            if (los && !los(F, T)) continue;
            ok = true;
            break;
        }
        if (ok) targets.push(T);
    }
    return targets;
}
//#endregion

//#region Convenience wrappers
/**
 * Compute basic movement field for uniform terrains: all passable cells cost 1,
 * impassables are Infinity via `isPassable`.
 */
export function uniformMovement(
    origin: AxialLike,
    maxMP: MP,
    isPassable: (_hex: AxialLike) => boolean,
    opts: Omit<MovementOptions, 'edgeBlocker'> & { edgeBlocker?: EdgeBlockerFn } = {},
): MovementField {
    const costFn: MoveCostFn = h => (isPassable(h) ? 1 : Infinity);
    return computeMovementField(origin, maxMP, costFn, opts);
}

/** Quick helper to extract the reachable set as keys. */
export function reachableKeys(field: MovementField): Set<string> {
    return new Set(Array.from(field.nodes.keys()));
}
//#endregion
