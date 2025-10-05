/**
 * Hex Ring and Spiral Generation
 * Algorithms for generating hex patterns around a center point
 */

import { axialAdd, axialScale, neighbor } from './distance';
import { AXIAL_DIRS } from './directions';
import type { Axial } from './types';

/**
 * Generate ring of hexes at specific radius from center
 * Radius 0 returns [center], radius 1 returns 6 neighbors, etc.
 */
export function hexRing(center: Axial, radius: number): Axial[] {
    if (radius === 0) {
        return [center];
    }

    const results: Axial[] = [];

    // Start at the "east" direction scaled by radius
    let current = axialAdd(center, axialScale(AXIAL_DIRS[0], radius));

    // Walk around the ring in 6 segments
    for (let direction = 0; direction < 6; direction++) {
        for (let step = 0; step < radius; step++) {
            results.push(current);
            current = neighbor(current, (direction + 2) % 6); // Next direction clockwise
        }
    }

    return results;
}

/**
 * Generate filled spiral of hexes up to given radius
 * Returns all hexes within radius, including center
 */
export function hexSpiral(center: Axial, radius: number): Axial[] {
    const results: Axial[] = [];

    for (let r = 0; r <= radius; r++) {
        results.push(...hexRing(center, r));
    }

    return results;
}

/**
 * Generate ring with filtering predicate
 * Only includes hexes that pass the filter function
 */
export function hexRingFiltered(
    center: Axial,
    radius: number,
    filter: (hex: Axial) => boolean
): Axial[] {
    return hexRing(center, radius).filter(filter);
}

/**
 * Generate spiral with filtering predicate
 * Only includes hexes that pass the filter function
 */
export function hexSpiralFiltered(
    center: Axial,
    radius: number,
    filter: (hex: Axial) => boolean
): Axial[] {
    return hexSpiral(center, radius).filter(filter);
}

/**
 * Generate ring walking in specific direction order
 * Useful for deterministic AI behavior or pathfinding
 */
export function hexRingWalk(
    center: Axial,
    radius: number,
    startDirection: number = 0
): Axial[] {
    if (radius === 0) {
        return [center];
    }

    const results: Axial[] = [];

    // Start at specified direction scaled by radius
    let current = axialAdd(center, axialScale(AXIAL_DIRS[startDirection], radius));

    // Walk around the ring starting from chosen direction
    for (let direction = 0; direction < 6; direction++) {
        for (let step = 0; step < radius; step++) {
            results.push(current);
            const nextDir = (startDirection + direction + 2) % 6;
            current = neighbor(current, nextDir);
        }
    }

    return results;
}

/**
 * Get all hexes within range (inclusive)
 * Same as hexSpiral but with clearer naming for game logic
 */
export function hexRange(center: Axial, range: number): Axial[] {
    return hexSpiral(center, range);
}

/**
 * Get hexes at exact distance from center
 * Same as hexRing but with clearer naming for game logic
 */
export function hexAtDistance(center: Axial, distance: number): Axial[] {
    return hexRing(center, distance);
}

/**
 * Generate flood-fill pattern from center
 * Expands outward until blocked or max range reached
 */
export function hexFloodFill(
    center: Axial,
    maxRange: number,
    canEnter: (hex: Axial) => boolean
): Axial[] {
    const visited = new Set<string>();
    const results: Axial[] = [];
    const queue: { hex: Axial; distance: number }[] = [{ hex: center, distance: 0 }];

    const hexKey = (hex: Axial) => `${hex.q},${hex.r}`;

    while (queue.length > 0) {
        const { hex, distance } = queue.shift()!;
        const key = hexKey(hex);

        if (visited.has(key) || distance > maxRange || !canEnter(hex)) {
            continue;
        }

        visited.add(key);
        results.push(hex);

        // Add neighbors to queue
        if (distance < maxRange) {
            for (const dir of AXIAL_DIRS) {
                const neighborHex = axialAdd(hex, dir);
                const neighborKey = hexKey(neighborHex);
                if (!visited.has(neighborKey)) {
                    queue.push({ hex: neighborHex, distance: distance + 1 });
                }
            }
        }
    }

    return results;
}