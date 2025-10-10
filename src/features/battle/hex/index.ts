/**
 * Hex Grid System - World Engine
 * Production-ready hex coordinate math with -0 normalization and type safety
 * 
 * This module provides the foundation for all hex-based tactical combat:
 * - Canonical Axial and Cube coordinate types
 * - Safe conversions with negative zero handling
 * - Rounding for animations and interpolation
 * - Map-safe keys and equality checks
 * - Serialization for save games
 * 
 * @module hex
 */

// Re-export everything from coords for clean imports
export * from './coords';
