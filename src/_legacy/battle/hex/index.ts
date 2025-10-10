/**
 * Hex Grid System - World Engine
 * Production-ready hex coordinate math with -0 normalization and type safety
 * 
 * This module provides the foundation for all hex-based tactical combat:
 * 
 * Canvas #1 - Canonical Coordinates (coords.ts):
 * - Canonical Axial and Cube coordinate types
 * - Safe conversions with negative zero handling
 * - Rounding for animations and interpolation
 * - Map-safe keys and equality checks
 * - Serialization for save games
 * 
 * Canvas #2 - Core Math Utilities (math.ts):
 * - Distance calculations (cube/axial)
 * - Neighbor queries and direction vectors
 * - Line generation for LOS and abilities
 * - Ring/spiral generators for selection and fog
 * - Range (disk) queries for movement and AoE
 * - Rotations and mirrors for formations
 * 
 * Canvas #3 - Movement & Range Systems (movement.ts):
 * - Dijkstra-based reachability with MP budgets
 * - Terrain costs, impassables, occupancy
 * - Edge blockers (walls, cliffs, doors)
 * - Zone of Control (ZoC) rules
 * - Path reconstruction for UI/AI
 * - Range predicates and move+attack helpers
 * 
 * Canvas #4 - Line of Sight & Raycast (los.ts):
 * - Ray tracing using axialLine with hard/soft occlusion
 * - Tile blockers (walls, mountains) and edge blockers (doors, walls)
 * - Soft cover accumulation with exponential penalty mapping
 * - Elevation-based LOS blocking with sight line interpolation
 * - Opaque target visibility for doorway targeting
 * - Visibility field computation (fog of war, AI perception)
 * - Cover/LOS convenience wrappers for combat systems
 * 
 * Canvas #5 - AoE Templates (aoe.ts):
 * - Circle/disk and donut/annulus masks for radial effects
 * - Line/beam with configurable thickness for breath attacks
 * - Bolt between points with optional truncation
 * - Cone sectors with aperture control (narrow/medium/wide)
 * - Set utilities for union/intersection/diff operations
 * - LOS/blocker filtering for environmental effects
 * 
 * Canvas #6 - Advanced Pathfinding (pathfinding.ts):
 * - A* pathfinding with pluggable move costs
 * - Edge blockers (walls/doors/rivers) and occupancy checks
 * - Zone of Control support: penalty costs and stop-on-enter
 * - Multi-target search (finds closest reachable goal)
 * - Heuristic tuning (scale, minStepCost) and tie-breaking
 * - LOS-based path smoothing for natural movement
 * - Performance limits and node budgets for worst-case protection
 * 
 * Canvas #7 - Battle Shim (shim.ts):
 * - Unified API combining all 6 hex canvases
 * - computeMovePreview: Movement field + reachable hexes
 * - findPathTo/findPathToAny: A* pathfinding with LOS smoothing
 * - losBetween: Line of sight + soft cover calculations
 * - buildAoEMask: All AoE templates with LOS/blocker filtering
 * - BoardFns adapter for clean engine integration
 * - Pure functions, no engine state dependencies
 * 
 * @module hex
 */

// Re-export everything from coords (Canvas #1)
export * from './coords';

// Re-export everything from math (Canvas #2)
export * from './math';

// Re-export everything from movement (Canvas #3)
export * from './movement';

// Re-export everything from los (Canvas #4)
export * from './los';

// Re-export everything from aoe (Canvas #5)
export * from './aoe';

// Re-export pathfinding (Canvas #6) - selective to avoid type conflicts with movement
export {
    aStar,
    aStarToAny,
    aStarUniform,
    smoothPathByLOS,
    type AStarOptions,
    type PathNode,
    type PathResult,
    type HasLineOfSightFn,
} from './pathfinding';

// Re-export everything from shim (Canvas #7)
export * from './shim';
