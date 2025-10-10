// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/battle/hex/shim.ts
// Purpose: Thin integration layer that unifies the hex math canvases into a
//          single, UI-friendly API. Exposes four primary entry points:
//          - computeMovePreview (movement radius + metadata)
//          - findPathTo (A* path with options and smoothing)
//          - losBetween (boolean LOS + soft-cover penalty)
//          - buildAoEMask (circle/line/cone/bolt/donut with optional LOS/clip)
//
// All functions are pure and side-effect free; they accept board callbacks
// rather than reaching into engine state. This keeps them easy to test.
// ──────────────────────────────────────────────────────────────────────────────

import type { Axial, AxialLike } from './coords'

// Canvas #3 — Movement
import type { MovementOptions, MovementField, MP as MoveMP, MoveCostFn, EdgeBlockerFn, IsOccupiedFn } from './movement'
import { computeMovementField, reachableKeys } from './movement'

// Canvas #4 — LOS
import type { LOSOptions, BlocksSightAtFn, BlocksSightEdgeFn, SoftCoverAtFn, ElevationAtFn } from './los'
import { hasLineOfSight, coverBetween } from './los'

// Canvas #5 — AoE
import { aoeCircle, aoeDonut, aoeLine, aoeBoltBetween, aoeCone, filterByLOS, clipLineByBlockers } from './aoe'
import type { Direction } from './math'

// Canvas #6 — Pathfinding
import type { AStarOptions, PathResult } from './pathfinding'
import { aStar, aStarToAny } from './pathfinding'

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface BoardFns {
    // Movement / pathfinding
    moveCostAt?: MoveCostFn // If omitted, caller should use uniform helpers upstream
    isPassableAt?: (_hex: AxialLike) => boolean
    isOccupied?: IsOccupiedFn
    edgeBlocker?: EdgeBlockerFn
    // LOS / cover
    blocksSightAt?: BlocksSightAtFn
    blocksSightEdge?: BlocksSightEdgeFn
    softCoverAt?: SoftCoverAtFn
    elevationAt?: ElevationAtFn
    // Tactics
    zoc?: Set<string>
}

export interface MovePreviewOptions extends MovementOptions {
    /** If provided, overrides BoardFns.moveCostAt with a uniform passable grid. */
    isPassable?: (_hex: AxialLike) => boolean
}export interface MovePreview {
    field: MovementField
    /** Reachable hex keys for quick highlight checks. */
    reachable: Set<string>
}

export interface FindPathOptions extends AStarOptions {
    /** If true, allow entering occupied goal; else block via isOccupied. */
    allowOccupiedGoal?: boolean
    /** MP budget check; if provided, returns `withinBudget`. */
    mpBudget?: number
}

export interface FindPathResult extends PathResult {
    withinBudget?: boolean
}

export type AoESpec =
    | { kind: 'circle'; radius: number }
    | { kind: 'donut'; min: number; max: number }
    | { kind: 'line'; dir: Direction; length: number; thickness?: number; includeOrigin?: boolean }
    | { kind: 'bolt'; to: AxialLike; maxLength?: number }
    | { kind: 'cone'; dir: Direction; radius: number; widen?: 0 | 1 | 2; includeOrigin?: boolean }

export interface AoEOptions {
    /** When true, filter mask by LOS(origin→cell) using BoardFns blockers. */
    losFilter?: boolean
    /** Stop lines/bolts at the first blocking cell (using blocksSightAt). */
    clipOnBlock?: boolean
}

// ──────────────────────────────────────────────────────────────────────────────
// Core API
// ──────────────────────────────────────────────────────────────────────────────

export function computeMovePreview(
    origin: AxialLike,
    mp: MoveMP,
    board: BoardFns,
    opts: MovePreviewOptions = {},
): MovePreview {
    const zoc = board.zoc ?? new Set<string>()
    const field = computeMovementField(
        origin,
        mp,
        opts.isPassable
            ? (h) => (opts.isPassable!(h) ? 1 : Infinity)
            : board.moveCostAt || (() => 1),
        {
            edgeBlocker: board.edgeBlocker,
            isOccupied: board.isOccupied,
            zocHexes: zoc,
            stopOnZoCEnter: opts.stopOnZoCEnter,
            nodeLimit: opts.nodeLimit,
        },
    )

    return { field, reachable: reachableKeys(field) }
}

export function findPathTo(
    start: AxialLike,
    goal: AxialLike,
    board: BoardFns,
    opts: FindPathOptions = {},
): FindPathResult {
    const allowGoal = opts.allowOccupiedGoal ?? true
    const res = aStar(
        start,
        goal,
        board.moveCostAt || (() => 1),
        {
            heuristicScale: opts.heuristicScale,
            minStepCost: opts.minStepCost,
            tieBreakEpsilon: opts.tieBreakEpsilon,
            edgeBlocker: board.edgeBlocker,
            isOccupied: board.isOccupied,
            allowOccupiedGoal: allowGoal,
            zocHexes: board.zoc,
            zocPenalty: opts.zocPenalty,
            stopOnZoCEnter: opts.stopOnZoCEnter,
            nodeLimit: opts.nodeLimit,
            // Path smoothing disabled for hex grids - hex movement must follow adjacency
            hasLineOfSight: undefined,
        },
    )

    if (opts.mpBudget != null) {
        ; (res as FindPathResult).withinBudget = Number.isFinite(res.cost) && res.cost <= (opts.mpBudget as number)
    }

    return res
}

export function losBetween(
    a: AxialLike,
    b: AxialLike,
    board: BoardFns,
    opts: LOSOptions = {},
) {
    const merged: LOSOptions = {
        blocksAt: board.blocksSightAt,
        blocksEdge: board.blocksSightEdge,
        softCoverAt: board.softCoverAt,
        elevationAt: board.elevationAt,
        ...opts,
    }
    return coverBetween(a, b, merged)
}

export function buildAoEMask(
    origin: AxialLike,
    spec: AoESpec,
    board: BoardFns = {},
    aoeOpts: AoEOptions = {},
): Axial[] {
    let cells: Axial[] = []
    switch (spec.kind) {
        case 'circle':
            cells = aoeCircle(origin, spec.radius)
            break
        case 'donut':
            cells = aoeDonut(origin, { min: spec.min, max: spec.max })
            break
        case 'line':
            cells = aoeLine(origin, spec)
            if (aoeOpts.clipOnBlock && board.blocksSightAt) {
                cells = clipLineByBlockers(origin, cells, board.blocksSightAt)
            }
            break
        case 'bolt':
            cells = aoeBoltBetween(origin, spec.to, spec.maxLength)
            if (aoeOpts.clipOnBlock && board.blocksSightAt) {
                cells = clipLineByBlockers(origin, cells, board.blocksSightAt)
            }
            break
        case 'cone':
            cells = aoeCone(origin, spec)
            break
    }

    if (aoeOpts.losFilter && (board.blocksSightAt || board.blocksSightEdge || board.elevationAt)) {
        cells = filterByLOS(origin, cells, {
            hasLineOfSight: (a, b) => hasLineOfSight(a, b, {
                blocksAt: board.blocksSightAt,
                blocksEdge: board.blocksSightEdge,
                elevationAt: board.elevationAt,
                seeOpaqueTarget: false, // For AoE, exclude blocker tiles themselves
            }),
        })
    }

    return cells
}

// Convenience: path-to-any goal (pickup nearest target, etc.)
export function findPathToAny(
    start: AxialLike,
    goals: AxialLike[],
    board: BoardFns,
    opts: FindPathOptions = {},
) {
    const allowGoal = opts.allowOccupiedGoal ?? true
    return aStarToAny(start, goals, board.moveCostAt || (() => 1), {
        heuristicScale: opts.heuristicScale,
        minStepCost: opts.minStepCost,
        tieBreakEpsilon: opts.tieBreakEpsilon,
        edgeBlocker: board.edgeBlocker,
        isOccupied: board.isOccupied,
        allowOccupiedGoal: allowGoal,
        zocHexes: board.zoc,
        zocPenalty: opts.zocPenalty,
        stopOnZoCEnter: opts.stopOnZoCEnter,
        nodeLimit: opts.nodeLimit,
        // Path smoothing disabled for hex grids - hex movement must follow adjacency
        hasLineOfSight: undefined,
    })
}
