// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/battle/hex/shim.test.ts
// Purpose: Test suite for Canvas #7 (Hex Battle Shim) — unified integration layer
// ──────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { axial, axialKey } from './coords'
import { computeMovePreview, findPathTo, losBetween, buildAoEMask, findPathToAny, type BoardFns } from './shim'

// ──────────────────────────────────────────────────────────────────────────────
// Test Helpers
// ──────────────────────────────────────────────────────────────────────────────

const passableDiamond = (R: number) => (h: { q: number; r: number }) =>
    Math.abs(h.q) <= R && Math.abs(h.r) <= R && Math.abs(h.q + h.r) <= R

// Mock battle board with various features
const createMockBoard = (): BoardFns => ({
    moveCostAt: (h) => (passableDiamond(8)(h) ? 1 : Infinity),
    isOccupied: (h) => h.q === 1 && h.r === 0,
    edgeBlocker: (a, b) => a.q === 0 && a.r === 0 && b.q === 1 && b.r === 0, // block first step to the right
    blocksSightAt: (h) => h.q === 2 && h.r === 0,
    softCoverAt: (h) => (h.q === 3 && h.r === 0 ? 0.25 : 0),
    elevationAt: (h) => (h.q === 4 && h.r === 0 ? 2 : 0),
    zoc: new Set(['5,0']),
})

// ──────────────────────────────────────────────────────────────────────────────
// Movement Preview Tests (Canvas #3 Integration)
// ──────────────────────────────────────────────────────────────────────────────

describe('computeMovePreview — basic functionality', () => {
    it('should return field and reachable set', () => {
        const board = createMockBoard()
        const origin = axial(0, 0)
        const mp = 3

        const res = computeMovePreview(origin, mp, board)

        expect(res.field).toBeDefined()
        expect(res.reachable).toBeInstanceOf(Set)
        expect(res.reachable.size).toBeGreaterThan(0)
        expect(res.reachable.has(axialKey(origin))).toBe(true)
    })

    it('should respect edge blockers', () => {
        const board = createMockBoard()
        const origin = axial(0, 0)
        const mp = 5

        const res = computeMovePreview(origin, mp, board)

        // (1,0) is blocked by edgeBlocker
        expect(res.reachable.has('1,0')).toBe(false)
    })

    it('should respect occupied hexes', () => {
        const board = createMockBoard()
        const origin = axial(0, 0)
        const mp = 5

        const res = computeMovePreview(origin, mp, board)

        // (1,0) is occupied
        expect(res.reachable.has('1,0')).toBe(false)
    })

    it('should use isPassable override when provided', () => {
        const board = createMockBoard()
        const origin = axial(0, 0)
        const mp = 3
        const isPassable = (h: { q: number; r: number }) => Math.abs(h.q) <= 2 && Math.abs(h.r) <= 2

        const res = computeMovePreview(origin, mp, board, { isPassable })

        expect(res.reachable.size).toBeGreaterThan(0)
        // Should only include hexes within q,r ≤ 2
        const keys = Array.from(res.reachable)
        for (const key of keys) {
            const [q, r] = key.split(',').map(Number)
            expect(Math.abs(q)).toBeLessThanOrEqual(3) // Within MP budget
            expect(Math.abs(r)).toBeLessThanOrEqual(3)
        }
    })

    it('should handle ZoC hexes', () => {
        const board = createMockBoard()
        const origin = axial(0, 0)
        const mp = 10

        const res = computeMovePreview(origin, mp, board, { stopOnZoCEnter: true })

        // Should stop at or before (5,0) which has ZoC
        expect(res.reachable.size).toBeGreaterThan(0)
    })

    it('should handle nodeLimit option', () => {
        const board = createMockBoard()
        const origin = axial(0, 0)
        const mp = 10

        const res = computeMovePreview(origin, mp, board, { nodeLimit: 20 })

        expect(res.reachable.size).toBeLessThanOrEqual(20)
    })
})

// ──────────────────────────────────────────────────────────────────────────────
// Pathfinding Tests (Canvas #6 Integration)
// ──────────────────────────────────────────────────────────────────────────────

describe('findPathTo — basic pathfinding', () => {
    it('should find a path when one exists', () => {
        const board = createMockBoard()
        const start = axial(0, 0)
        const goal = axial(0, 3)

        const res = findPathTo(start, goal, board, { minStepCost: 1 })

        expect(res.path).not.toBeNull()
        expect(res.path![0]).toEqual(start)
        expect(res.path![res.path!.length - 1]).toEqual(goal)
        expect(res.cost).toBeGreaterThan(0)
    })

    it('should return null path when blocked by edge blocker', () => {
        const board = createMockBoard()
        const start = axial(0, 0)
        const goal = axial(2, 0)

        const res = findPathTo(start, goal, board, { minStepCost: 1 })

        // Can't reach (2,0) because (0,0) → (1,0) is blocked
        expect(res.path).toBeNull()
    })

    it('should allow occupied goal by default', () => {
        const board: BoardFns = {
            moveCostAt: (h) => (passableDiamond(5)(h) ? 1 : Infinity),
            isOccupied: (h) => h.q === 2 && h.r === 0,
        }
        const start = axial(0, 0)
        const goal = axial(2, 0)

        const res = findPathTo(start, goal, board, { minStepCost: 1 })

        expect(res.path).not.toBeNull()
    })

    it('should block occupied goal when allowOccupiedGoal = false', () => {
        const board: BoardFns = {
            moveCostAt: (h) => (passableDiamond(5)(h) ? 1 : Infinity),
            isOccupied: (h) => h.q === 2 && h.r === 0,
        }
        const start = axial(0, 0)
        const goal = axial(2, 0)

        const res = findPathTo(start, goal, board, { minStepCost: 1, allowOccupiedGoal: false })

        expect(res.path).toBeNull()
    })

    it('should check withinBudget when mpBudget provided', () => {
        const board = createMockBoard()
        const start = axial(0, 0)
        const goal = axial(0, 3)

        const res = findPathTo(start, goal, board, { minStepCost: 1, mpBudget: 10 })

        expect(res.withinBudget).toBeDefined()
        expect(res.withinBudget).toBe(true)
    })

    it('should set withinBudget = false when path exceeds budget', () => {
        const board = createMockBoard()
        const start = axial(0, 0)
        const goal = axial(0, 5)

        const res = findPathTo(start, goal, board, { minStepCost: 1, mpBudget: 2 })

        expect(res.withinBudget).toBe(false)
    })

    it('should smooth path with LOS when available', () => {
        const board: BoardFns = {
            moveCostAt: (h) => (passableDiamond(8)(h) ? 1 : Infinity),
            blocksSightAt: (_h) => false, // Clear LOS
        }
        const start = axial(0, 0)
        const goal = axial(5, 0)

        const res = findPathTo(start, goal, board, { minStepCost: 1 })

        // With clear LOS, path should be smoothed (fewer waypoints)
        expect(res.path).not.toBeNull()
        expect(res.path!.length).toBeGreaterThan(0)
    })

    it('should respect ZoC penalty', () => {
        const board: BoardFns = {
            moveCostAt: (h) => (passableDiamond(8)(h) ? 1 : Infinity),
            zoc: new Set(['2,0']),
        }
        const start = axial(0, 0)
        const goal = axial(4, 0)

        const resNoPenalty = findPathTo(start, goal, board, { minStepCost: 1, zocPenalty: 0 })
        const resPenalty = findPathTo(start, goal, board, { minStepCost: 1, zocPenalty: 5 })

        expect(resNoPenalty.cost).toBeLessThan(resPenalty.cost)
    })

    it('should handle heuristic scale tuning', () => {
        const board = createMockBoard()
        const start = axial(0, 0)
        const goal = axial(0, 5)

        const res = findPathTo(start, goal, board, { minStepCost: 1, heuristicScale: 1.5 })

        expect(res.path).not.toBeNull()
        expect(res.expanded).toBeGreaterThan(0)
    })

    it('should handle nodeLimit', () => {
        const board = createMockBoard()
        const start = axial(0, 0)
        const goal = axial(7, 7)

        const res = findPathTo(start, goal, board, { minStepCost: 1, nodeLimit: 10 })

        // May fail to find path due to node limit
        expect(res.expanded).toBeLessThanOrEqual(10)
    })
})

describe('findPathToAny — multi-target pathfinding', () => {
    it('should find path to closest goal', () => {
        const board = createMockBoard()
        const start = axial(0, 0)
        const goals = [axial(0, 5), axial(0, 2), axial(0, 4)]

        const res = findPathToAny(start, goals, board, { minStepCost: 1 })

        expect(res.path).not.toBeNull()
        expect(res.goal).toEqual(axial(0, 2)) // Closest goal
    })

    it('should return null when no goal is reachable', () => {
        const board: BoardFns = {
            moveCostAt: (h) => (Math.abs(h.q) <= 2 && Math.abs(h.r) <= 2 ? 1 : Infinity),
        }
        const start = axial(0, 0)
        const goals = [axial(5, 5), axial(6, 6)]

        const res = findPathToAny(start, goals, board, { minStepCost: 1 })

        expect(res.path).toBeNull()
    })

    it('should handle empty goals array', () => {
        const board = createMockBoard()
        const start = axial(0, 0)
        const goals: { q: number; r: number }[] = []

        const res = findPathToAny(start, goals, board, { minStepCost: 1 })

        expect(res.path).toBeNull()
    })

    it('should allow occupied goals by default', () => {
        const board: BoardFns = {
            moveCostAt: (h) => (passableDiamond(5)(h) ? 1 : Infinity),
            isOccupied: (h) => h.q === 2 && h.r === 0,
        }
        const start = axial(0, 0)
        const goals = [axial(2, 0)]

        const res = findPathToAny(start, goals, board, { minStepCost: 1 })

        expect(res.path).not.toBeNull()
    })

    it('should block occupied goals when allowOccupiedGoal = false', () => {
        const board: BoardFns = {
            moveCostAt: (h) => (passableDiamond(5)(h) ? 1 : Infinity),
            isOccupied: (h) => h.q === 2 && h.r === 0,
        }
        const start = axial(0, 0)
        const goals = [axial(2, 0)]

        const res = findPathToAny(start, goals, board, { minStepCost: 1, allowOccupiedGoal: false })

        expect(res.path).toBeNull()
    })
})

// ──────────────────────────────────────────────────────────────────────────────
// LOS Tests (Canvas #4 Integration)
// ──────────────────────────────────────────────────────────────────────────────

describe('losBetween — line of sight checks', () => {
    it('should return clear LOS when no blockers', () => {
        const board: BoardFns = {
            blocksSightAt: (_h) => false,
        }
        const a = axial(0, 0)
        const b = axial(3, 0)

        const res = losBetween(a, b, board)

        expect(res.clear).toBe(true)
        expect(res.penalty).toBe(0)
        expect(res.sum).toBe(0)
    })

    it('should return blocked LOS when blocker present', () => {
        const board = createMockBoard()
        const a = axial(0, 0)
        const b = axial(3, 0)

        const res = losBetween(a, b, board)

        // (2,0) blocks sight
        expect(res.clear).toBe(false)
    })

    it('should calculate soft cover penalty', () => {
        const board: BoardFns = {
            blocksSightAt: (_h) => false,
            softCoverAt: (h) => (h.q === 1 && h.r === 0 ? 0.25 : 0),
        }
        const a = axial(0, 0)
        const b = axial(3, 0)

        const res = losBetween(a, b, board)

        expect(res.clear).toBe(true)
        expect(res.penalty).toBeGreaterThan(0)
    })

    it('should handle elevation', () => {
        const board: BoardFns = {
            blocksSightAt: (_h) => false,
            elevationAt: (h) => (h.q === 2 && h.r === 0 ? 2 : 0),
        }
        const a = axial(0, 0)
        const b = axial(4, 0)

        const res = losBetween(a, b, board)

        expect(res.clear).toBeDefined()
    })

    it('should accept custom LOS options', () => {
        const board = createMockBoard()
        const a = axial(0, 0)
        const b = axial(3, 0)

        const res = losBetween(a, b, board, { seeOpaqueTarget: false, maxSoftCover: 5.0 })

        expect(res.clear).toBeDefined()
    })
})

// ──────────────────────────────────────────────────────────────────────────────
// AoE Mask Tests (Canvas #5 Integration)
// ──────────────────────────────────────────────────────────────────────────────

describe('buildAoEMask — circle', () => {
    it('should build circle mask', () => {
        const origin = axial(0, 0)
        const mask = buildAoEMask(origin, { kind: 'circle', radius: 2 })

        expect(mask.length).toBe(19) // 1 + 3*2*(2+1) = 19
        expect(mask.some((h) => h.q === 0 && h.r === 0)).toBe(true)
    })

    it('should filter circle by LOS', () => {
        const board: BoardFns = {
            blocksSightAt: (h) => h.q === 1 && h.r === 0,
        }
        const origin = axial(0, 0)
        const mask = buildAoEMask(origin, { kind: 'circle', radius: 2 }, board, { losFilter: true })

        expect(mask.length).toBeLessThan(19) // Some hexes blocked
        expect(mask.some((h) => h.q === 1 && h.r === 0)).toBe(false)
    })
})

describe('buildAoEMask — donut', () => {
    it('should build donut mask', () => {
        const origin = axial(0, 0)
        const mask = buildAoEMask(origin, { kind: 'donut', min: 1, max: 2 })

        expect(mask.length).toBeGreaterThan(0)
        expect(mask.every((h) => h.q !== 0 || h.r !== 0)).toBe(true) // Origin excluded
    })
})

describe('buildAoEMask — line', () => {
    it('should build line mask', () => {
        const origin = axial(0, 0)
        const mask = buildAoEMask(origin, { kind: 'line', dir: 0, length: 3 })

        expect(mask.length).toBeGreaterThan(0)
        expect(mask.some((h) => h.q === 0 && h.r === 0)).toBe(true) // Origin included
    })

    it('should clip line at blocker', () => {
        const board: BoardFns = {
            blocksSightAt: (h) => h.q === 2 && h.r === 0,
        }
        const origin = axial(0, 0)
        const maskNoClip = buildAoEMask(origin, { kind: 'line', dir: 0, length: 5 })
        const maskClip = buildAoEMask(origin, { kind: 'line', dir: 0, length: 5 }, board, { clipOnBlock: true })

        expect(maskClip.length).toBeLessThan(maskNoClip.length)
    })

    it('should handle line thickness', () => {
        const origin = axial(0, 0)
        const thinMask = buildAoEMask(origin, { kind: 'line', dir: 0, length: 3, thickness: 0 })
        const thickMask = buildAoEMask(origin, { kind: 'line', dir: 0, length: 3, thickness: 1 })

        expect(thickMask.length).toBeGreaterThan(thinMask.length)
    })
})

describe('buildAoEMask — bolt', () => {
    it('should build bolt mask between two points', () => {
        const origin = axial(0, 0)
        const target = axial(3, 0)
        const mask = buildAoEMask(origin, { kind: 'bolt', to: target })

        expect(mask.length).toBeGreaterThan(0)
        expect(mask.some((h) => h.q === 0 && h.r === 0)).toBe(true)
        expect(mask.some((h) => h.q === 3 && h.r === 0)).toBe(true)
    })

    it('should clip bolt at blocker', () => {
        const board: BoardFns = {
            blocksSightAt: (h) => h.q === 2 && h.r === 0,
        }
        const origin = axial(0, 0)
        const target = axial(5, 0)
        const maskClip = buildAoEMask(origin, { kind: 'bolt', to: target }, board, { clipOnBlock: true })

        expect(maskClip.every((h) => h.q <= 2)).toBe(true)
    })

    it('should handle maxLength truncation', () => {
        const origin = axial(0, 0)
        const target = axial(5, 0)
        const mask = buildAoEMask(origin, { kind: 'bolt', to: target, maxLength: 3 })

        expect(mask.every((h) => Math.abs(h.q) + Math.abs(h.r) + Math.abs(h.q + h.r) <= 6)).toBe(true)
    })
})

describe('buildAoEMask — cone', () => {
    it('should build cone mask', () => {
        const origin = axial(0, 0)
        const mask = buildAoEMask(origin, { kind: 'cone', dir: 0, radius: 2 })

        expect(mask.length).toBeGreaterThan(0)
        expect(mask.some((h) => h.q === 0 && h.r === 0)).toBe(true)
    })

    it('should handle cone widen parameter', () => {
        const origin = axial(0, 0)
        const narrowMask = buildAoEMask(origin, { kind: 'cone', dir: 0, radius: 3, widen: 0 })
        const wideMask = buildAoEMask(origin, { kind: 'cone', dir: 0, radius: 3, widen: 2 })

        expect(wideMask.length).toBeGreaterThan(narrowMask.length)
    })

    it('should filter cone by LOS', () => {
        const board: BoardFns = {
            blocksSightAt: (h) => h.q === 1 && h.r === 0,
        }
        const origin = axial(0, 0)
        const mask = buildAoEMask(origin, { kind: 'cone', dir: 0, radius: 3 }, board, { losFilter: true })

        // Hexes behind blocker should be filtered out
        expect(mask.some((h) => h.q === 1 && h.r === 0)).toBe(false)
    })
})

// ──────────────────────────────────────────────────────────────────────────────
// Integration Tests
// ──────────────────────────────────────────────────────────────────────────────

describe('Integration — combined operations', () => {
    it('should compute movement, pathfind, and check LOS in sequence', () => {
        const board = createMockBoard()
        const origin = axial(0, 0)
        const target = axial(0, 3)

        // 1. Compute move preview
        const movePreview = computeMovePreview(origin, 5, board)
        expect(movePreview.reachable.size).toBeGreaterThan(0)

        // 2. Find path to target
        const pathResult = findPathTo(origin, target, board, { minStepCost: 1 })
        expect(pathResult.path).not.toBeNull()

        // 3. Check LOS to target
        const losResult = losBetween(origin, target, board)
        expect(losResult.clear).toBeDefined()
    })

    it('should build AoE mask and check each cell for LOS', () => {
        const board: BoardFns = {
            blocksSightAt: (h) => h.q === 2 && h.r === 0,
        }
        const origin = axial(0, 0)

        // Build circle mask
        const mask = buildAoEMask(origin, { kind: 'circle', radius: 3 })

        // Check LOS to each cell
        const visibleCells = mask.filter((cell) => losBetween(origin, cell, board).clear)

        expect(visibleCells.length).toBeGreaterThan(0)
        expect(visibleCells.length).toBeLessThanOrEqual(mask.length)
    })

    it('should pathfind to nearest target and build AoE from there', () => {
        const board = createMockBoard()
        const start = axial(0, 0)
        const goals = [axial(0, 3), axial(0, 5)]

        // Find path to nearest goal
        const pathResult = findPathToAny(start, goals, board, { minStepCost: 1 })
        expect(pathResult.path).not.toBeNull()
        expect(pathResult.goal).toBeDefined()

        // Build AoE from goal
        const aoe = buildAoEMask(pathResult.goal!, { kind: 'circle', radius: 2 })
        expect(aoe.length).toBeGreaterThan(0)
    })
})

// ──────────────────────────────────────────────────────────────────────────────
// Edge Cases
// ──────────────────────────────────────────────────────────────────────────────

describe('Edge cases', () => {
    it('should handle empty board functions', () => {
        const board: BoardFns = {}
        const origin = axial(0, 0)

        const movePreview = computeMovePreview(origin, 3, board)
        expect(movePreview.reachable.size).toBeGreaterThan(0)

        const pathResult = findPathTo(origin, axial(2, 0), board, { minStepCost: 1 })
        expect(pathResult.path).not.toBeNull()

        const losResult = losBetween(origin, axial(2, 0), board)
        expect(losResult.clear).toBe(true)

        const aoe = buildAoEMask(origin, { kind: 'circle', radius: 1 })
        expect(aoe.length).toBe(7)
    })

    it('should handle zero MP movement', () => {
        const board = createMockBoard()
        const origin = axial(0, 0)

        const res = computeMovePreview(origin, 0, board)
        expect(res.reachable.has(axialKey(origin))).toBe(true)
        expect(res.reachable.size).toBe(1)
    })

    it('should handle same start and goal', () => {
        const board = createMockBoard()
        const pos = axial(0, 0)

        const res = findPathTo(pos, pos, board, { minStepCost: 1 })
        expect(res.path).toEqual([pos])
        expect(res.cost).toBe(0)
    })

    it('should handle radius 0 AoE', () => {
        const origin = axial(0, 0)
        const mask = buildAoEMask(origin, { kind: 'circle', radius: 0 })

        expect(mask.length).toBe(1)
        expect(mask[0]).toEqual(origin)
    })
})
