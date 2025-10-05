/**
 * Hex Line Drawing and Line-of-Sight Algorithms
 * Implements precise line drawing between hex coordinates
 */

import { axialToCube, cubeToAxial } from './convert';
import type { Axial, Cube } from './types';

/**
 * Linear interpolation between two numbers
 */
function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/**
 * Linear interpolation between two cube coordinates
 */
function cubeLerp(a: Cube, b: Cube, t: number): Cube {
    return {
        x: lerp(a.x, b.x, t),
        y: lerp(a.y, b.y, t),
        z: lerp(a.z, b.z, t)
    } as Cube;
}

/**
 * Round cube coordinate to nearest valid hex
 * Ensures x + y + z = 0 constraint
 */
function cubeRound(cube: Cube): Cube {
    let rx = Math.round(cube.x);
    let ry = Math.round(cube.y);
    let rz = Math.round(cube.z);

    const xDiff = Math.abs(rx - cube.x);
    const yDiff = Math.abs(ry - cube.y);
    const zDiff = Math.abs(rz - cube.z);

    if (xDiff > yDiff && xDiff > zDiff) {
        rx = -ry - rz;
    } else if (yDiff > zDiff) {
        ry = -rx - rz;
    } else {
        rz = -rx - ry;
    }

    return { x: rx, y: ry, z: rz } as Cube;
}

/**
 * Get all hexes on line from a to b (inclusive)
 * Uses cube coordinate interpolation for precision
 */
export function axialLine(a: Axial, b: Axial): Axial[] {
    const ac = axialToCube(a);
    const bc = axialToCube(b);

    // Calculate distance (number of steps)
    const distance = Math.max(
        Math.abs(ac.x - bc.x),
        Math.abs(ac.y - bc.y),
        Math.abs(ac.z - bc.z)
    );

    const results: Axial[] = [];

    for (let i = 0; i <= distance; i++) {
        const t = distance === 0 ? 0 : i / distance;
        const interpolated = cubeLerp(ac, bc, t);
        const rounded = cubeRound(interpolated);
        results.push(cubeToAxial(rounded));
    }

    return results;
}

/**
 * Check if line from a to b is blocked by any hex in blockedSet
 * Returns true if blocked, false if clear
 */
export function isLineBlocked(
    a: Axial,
    b: Axial,
    isBlocked: (hex: Axial) => boolean
): boolean {
    const line = axialLine(a, b);

    // Skip start and end points - check intermediate hexes
    for (let i = 1; i < line.length - 1; i++) {
        const hex = line[i];
        if (hex && isBlocked(hex)) {
            return true;
        }
    }

    return false;
}

/**
 * Get line from a to b, stopping at first blocked hex
 * Returns all accessible hexes including the blocked one if hit
 */
export function axialLineToBlocked(
    a: Axial,
    b: Axial,
    isBlocked: (hex: Axial) => boolean
): Axial[] {
    const line = axialLine(a, b);
    if (line.length === 0) return [];

    const firstHex = line[0];
    if (!firstHex) return [];

    const results: Axial[] = [firstHex]; // Always include start

    for (let i = 1; i < line.length; i++) {
        const hex = line[i];
        if (!hex) continue;

        results.push(hex);
        if (isBlocked(hex)) {
            break;
        }
    }

    return results;
}

/**
 * Bresenham-style line algorithm for hex grids
 * Alternative to interpolation method - may be faster for long lines
 */
export function axialBresenham(a: Axial, b: Axial): Axial[] {
    // For now, delegate to interpolation method
    // TODO: Implement true Bresenham for performance if needed
    return axialLine(a, b);
}

/**
 * Check if target is visible from origin with line-of-sight rules
 * Accounts for blocking terrain and optional elevation
 */
export function hasLineOfSight(
    origin: Axial,
    target: Axial,
    isBlocked: (hex: Axial) => boolean,
    getElevation?: (hex: Axial) => number
): boolean {
    if (axialEquals(origin, target)) {
        return true;
    }

    // Simple blocking check if no elevation
    if (!getElevation) {
        return !isLineBlocked(origin, target, isBlocked);
    }

    // TODO: Implement elevation-aware LOS
    // For now, fall back to simple blocking
    return !isLineBlocked(origin, target, isBlocked);
}

/**
 * Helper function to check axial equality
 */
function axialEquals(a: Axial, b: Axial): boolean {
    return a.q === b.q && a.r === b.r;
}