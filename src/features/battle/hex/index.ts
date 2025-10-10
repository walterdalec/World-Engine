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
