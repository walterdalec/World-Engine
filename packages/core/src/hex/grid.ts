/**
 * Hex Grid Bounds and Utility Functions
 * Grid boundary definitions and containment checks
 */

import { axialDistance } from './distance';
import type { Axial } from './types';

/**
 * Rectangular hex grid bounds in axial coordinates
 */
export interface HexRect {
    readonly minQ: number;
    readonly maxQ: number;
    readonly minR: number;
    readonly maxR: number;
}

/**
 * Circular hex grid bounds
 */
export interface HexCircle {
    readonly center: Axial;
    readonly radius: number;
}

/**
 * Custom hex grid bounds using predicate function
 */
export interface HexCustom {
    readonly contains: (hex: Axial) => boolean;
    readonly description?: string;
}

/**
 * Union type for all grid boundary types
 */
export type HexBounds = HexRect | HexCircle | HexCustom;

/**
 * Check if bounds object is a rectangle
 */
export function isHexRect(bounds: HexBounds): bounds is HexRect {
    return 'minQ' in bounds && 'maxQ' in bounds && 'minR' in bounds && 'maxR' in bounds;
}

/**
 * Check if bounds object is a circle
 */
export function isHexCircle(bounds: HexBounds): bounds is HexCircle {
    return 'center' in bounds && 'radius' in bounds;
}

/**
 * Check if bounds object is custom predicate
 */
export function isHexCustom(bounds: HexBounds): bounds is HexCustom {
    return 'contains' in bounds;
}

/**
 * Check if hex is within given bounds
 */
export function hexInBounds(hex: Axial, bounds: HexBounds): boolean {
    if (isHexRect(bounds)) {
        return hex.q >= bounds.minQ && hex.q <= bounds.maxQ &&
            hex.r >= bounds.minR && hex.r <= bounds.maxR;
    }

    if (isHexCircle(bounds)) {
        return axialDistance(hex, bounds.center) <= bounds.radius;
    }

    if (isHexCustom(bounds)) {
        return bounds.contains(hex);
    }

    return false;
}

/**
 * Create rectangular bounds
 */
export function createHexRect(minQ: number, maxQ: number, minR: number, maxR: number): HexRect {
    return { minQ, maxQ, minR, maxR };
}

/**
 * Create circular bounds
 */
export function createHexCircle(center: Axial, radius: number): HexCircle {
    return { center, radius };
}

/**
 * Create custom bounds with predicate
 */
export function createHexCustom(contains: (hex: Axial) => boolean, description?: string): HexCustom {
    if (description !== undefined) {
        return { contains, description };
    }
    return { contains };
}

/**
 * Get all hexes within rectangular bounds
 */
export function getAllHexesInRect(bounds: HexRect): Axial[] {
    const hexes: Axial[] = [];

    for (let q = bounds.minQ; q <= bounds.maxQ; q++) {
        for (let r = bounds.minR; r <= bounds.maxR; r++) {
            hexes.push({ q, r } as Axial);
        }
    }

    return hexes;
}

/**
 * Get bounding rectangle that contains all given hexes
 */
export function getHexBoundingRect(hexes: Axial[]): HexRect {
    if (hexes.length === 0) {
        return createHexRect(0, 0, 0, 0);
    }

    const firstHex = hexes[0];
    if (!firstHex) {
        return createHexRect(0, 0, 0, 0);
    }

    let minQ = firstHex.q;
    let maxQ = firstHex.q;
    let minR = firstHex.r;
    let maxR = firstHex.r;

    for (const hex of hexes) {
        minQ = Math.min(minQ, hex.q);
        maxQ = Math.max(maxQ, hex.q);
        minR = Math.min(minR, hex.r);
        maxR = Math.max(maxR, hex.r);
    }

    return createHexRect(minQ, maxQ, minR, maxR);
}

/**
 * Expand rectangular bounds by given amount
 */
export function expandHexRect(bounds: HexRect, expansion: number): HexRect {
    return createHexRect(
        bounds.minQ - expansion,
        bounds.maxQ + expansion,
        bounds.minR - expansion,
        bounds.maxR + expansion
    );
}

/**
 * Check if two rectangular bounds intersect
 */
export function hexRectsIntersect(a: HexRect, b: HexRect): boolean {
    return !(a.maxQ < b.minQ || b.maxQ < a.minQ ||
        a.maxR < b.minR || b.maxR < a.minR);
}

/**
 * Get intersection of two rectangular bounds
 * Returns null if no intersection
 */
export function intersectHexRects(a: HexRect, b: HexRect): HexRect | null {
    if (!hexRectsIntersect(a, b)) {
        return null;
    }

    return createHexRect(
        Math.max(a.minQ, b.minQ),
        Math.min(a.maxQ, b.maxQ),
        Math.max(a.minR, b.minR),
        Math.min(a.maxR, b.maxR)
    );
}

/**
 * Calculate area (number of hexes) in rectangular bounds
 */
export function hexRectArea(bounds: HexRect): number {
    return (bounds.maxQ - bounds.minQ + 1) * (bounds.maxR - bounds.minR + 1);
}

/**
 * Create bounds that represent an infinite grid (no constraints)
 */
export function createInfiniteHexBounds(): HexCustom {
    return createHexCustom(() => true, 'Infinite Grid');
}

/**
 * Common grid bounds for game use
 */
export const CommonBounds = {
    /**
     * Small tactical battle grid (15x15)
     */
    BATTLE_SMALL: createHexRect(-7, 7, -7, 7),

    /**
     * Large tactical battle grid (21x21)
     */
    BATTLE_LARGE: createHexRect(-10, 10, -10, 10),

    /**
     * Region map chunk (32x32)
     */
    REGION_CHUNK: createHexRect(-16, 15, -16, 15),

    /**
     * World map sector (64x64)
     */
    WORLD_SECTOR: createHexRect(-32, 31, -32, 31),

    /**
     * Single hex (for validation)
     */
    SINGLE: createHexRect(0, 0, 0, 0)
} as const;