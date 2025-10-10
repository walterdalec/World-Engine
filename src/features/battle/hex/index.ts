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
 * @module hex
 */

// Re-export everything from coords (Canvas #1)
export * from './coords';

// Re-export everything from math (Canvas #2)
export * from './math';
