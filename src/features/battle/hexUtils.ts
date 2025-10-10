/**
 * Core hex utilities for World Engine battle system
 * Extracted from BrigandineHexBattle.tsx for reusability
 */

import type { HexPosition } from './types';

// Axial hex coordinate type
export type Axial = { q: number; r: number };

// Standard hex directions (pointy-top)
export const HEX_DIRS: Axial[] = [
    { q: 1, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 },
    { q: -1, r: 1 },
    { q: 0, r: 1 },
];

// Hex math constants
export const SQRT3 = Math.sqrt(3);

/**
 * Check if two axial coordinates are equal
 */
export function axialEq(a: Axial, b: Axial): boolean {
    return a.q === b.q && a.r === b.r;
}

/**
 * Convert axial coordinate to string key for maps/sets
 */
export function axialKey(a: Axial): string {
    return `${a.q},${a.r}`;
}

/**
 * Add two axial coordinates
 */
export function add(a: Axial, b: Axial): Axial {
    return { q: a.q + b.q, r: a.r + b.r };
}

/**
 * Get all 6 neighbors of a hex
 */
export function neighbors(a: Axial): Axial[] {
    return HEX_DIRS.map((d) => add(a, d));
}

export function neighborsHex(a: Axial): Axial[] {
    return neighbors(a);
}

/**
 * Cube distance between two hexes (Manhattan distance in cube coords)
 */
export function cubeDistance(a: Axial, b: Axial): number {
    const s1 = -a.q - a.r;
    const s2 = -b.q - b.r;
    return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(s1 - s2)) / 2;
}

/**
 * Get all hexes in a ring at distance N from center
 */
export function hexRing(center: Axial, radius: number): Axial[] {
    if (radius === 0) return [center];

    const results: Axial[] = [];
    let hex = add(center, { q: HEX_DIRS[4].q * radius, r: HEX_DIRS[4].r * radius });

    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < radius; j++) {
            results.push(hex);
            hex = add(hex, HEX_DIRS[i]);
        }
    }

    return results;
}

/**
 * Get all hexes within distance N from center (spiral)
 */
export function hexSpiral(center: Axial, maxRadius: number): Axial[] {
    const results: Axial[] = [center];
    for (let r = 1; r <= maxRadius; r++) {
        results.push(...hexRing(center, r));
    }
    return results;
}

/**
 * Hex lerp for line drawing
 */
function hexLerp(a: Axial, b: Axial, t: number): { q: number; r: number; s: number } {
    const aq = a.q;
    const ar = a.r;
    const as = -aq - ar;
    const bq = b.q;
    const br = b.r;
    const bs = -bq - br;
    return {
        q: aq + (bq - aq) * t,
        r: ar + (br - ar) * t,
        s: as + (bs - as) * t,
    };
}

/**
 * Round fractional cube coordinates to nearest hex
 */
function hexRound(h: { q: number; r: number; s: number }): Axial {
    let rq = Math.round(h.q);
    let rr = Math.round(h.r);
    let rs = Math.round(h.s);

    const q_diff = Math.abs(rq - h.q);
    const r_diff = Math.abs(rr - h.r);
    const s_diff = Math.abs(rs - h.s);

    if (q_diff > r_diff && q_diff > s_diff) {
        rq = -rr - rs;
    } else if (r_diff > s_diff) {
        rr = -rq - rs;
    }
    return { q: rq, r: rr };
}

/**
 * Get line of hexes from A to B (Bresenham-style)
 */
export function hexLine(a: Axial, b: Axial): Axial[] {
    const N = cubeDistance(a, b);
    const results: Axial[] = [];
    for (let i = 0; i <= N; i++) {
        const t = N === 0 ? 0 : i / N;
        results.push(hexRound(hexLerp(a, b, t)));
    }
    return results;
}

/**
 * Get all hexes in a blast radius (filled circle)
 */
export function hexBlast(center: Axial, radius: number): Axial[] {
    return hexSpiral(center, radius);
}

/**
 * Convert axial to pixel coordinates
 */
export function axialToPixel(a: Axial, size: number): { x: number; y: number } {
    const x = size * SQRT3 * (a.q + a.r / 2);
    const y = size * (3 / 2) * a.r;
    return { x, y };
}

/**
 * Convert HexPosition to Axial (compatibility bridge)
 */
export function hexPosToAxial(pos: HexPosition): Axial {
    return { q: pos.q, r: pos.r };
}

/**
 * Convert Axial to HexPosition (compatibility bridge)
 */
export function axialToHexPos(axial: Axial): HexPosition {
    return { q: axial.q, r: axial.r };
}
