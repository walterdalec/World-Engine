/**
 * Hex Distance and Neighbor Operations
 * Core mathematical operations for hex grids
 */

import { axialToCube } from './convert';
import { AXIAL_DIRS } from './directions';
import type { Axial, Cube } from './types';

/**
 * Calculate distance between two cube coordinates
 * Uses max of absolute differences (Chebyshev distance in cube space)
 */
export function cubeDistance(a: Cube, b: Cube): number {
    return Math.max(
        Math.abs(a.x - b.x),
        Math.abs(a.y - b.y),
        Math.abs(a.z - b.z)
    );
}

/**
 * Calculate distance between two axial coordinates
 * Converts to cube space for calculation
 */
export function axialDistance(a: Axial, b: Axial): number {
    const ac = axialToCube(a);
    const bc = axialToCube(b);
    return cubeDistance(ac, bc);
}

/**
 * Add two axial coordinates
 */
export function axialAdd(a: Axial, b: Axial): Axial {
    return { q: a.q + b.q, r: a.r + b.r } as Axial;
}

/**
 * Subtract two axial coordinates
 */
export function axialSubtract(a: Axial, b: Axial): Axial {
    return { q: a.q - b.q, r: a.r - b.r } as Axial;
}

/**
 * Scale axial coordinate by a factor
 */
export function axialScale(a: Axial, factor: number): Axial {
    return { q: a.q * factor, r: a.r * factor } as Axial;
}

/**
 * Get all 6 neighbors of a hex in standard order
 * Order: East, Northeast, Northwest, West, Southwest, Southeast
 */
export function neighbors(a: Axial): Axial[] {
    return AXIAL_DIRS.map(dir => axialAdd(a, dir));
}

/**
 * Get neighbor in specific direction (0-5)
 * 0=East, 1=Northeast, 2=Northwest, 3=West, 4=Southwest, 5=Southeast
 */
export function neighbor(a: Axial, direction: number): Axial {
    if (direction < 0 || direction > 5) {
        throw new Error(`Direction must be 0-5, got ${direction}`);
    }
    return axialAdd(a, AXIAL_DIRS[direction]);
}

/**
 * Check if two axial coordinates are equal
 */
export function axialEquals(a: Axial, b: Axial): boolean {
    return a.q === b.q && a.r === b.r;
}

/**
 * Manhattan distance in axial coordinates (sum of |dq| + |dr|)
 * Different from hex distance - useful for some algorithms
 */
export function axialManhattan(a: Axial, b: Axial): number {
    return Math.abs(a.q - b.q) + Math.abs(a.r - b.r);
}