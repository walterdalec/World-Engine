/**
 * hex.ts - Essential hex grid utilities for tactical battle system
 * Minimal, production-ready hex coordinate math
 */

export interface HexCoord {
    q: number; // column (axial coordinate)
    r: number; // row (axial coordinate)  
}

export interface CubeCoord {
    x: number;
    y: number;
    z: number;
}

// Convert axial to cube coordinates for distance calculations
export function axialToCube(hex: HexCoord): CubeCoord {
    const x = hex.q;
    const z = hex.r;
    const y = -x - z;
    return { x, y, z };
}

// Convert cube back to axial coordinates
export function cubeToAxial(cube: CubeCoord): HexCoord {
    return { q: cube.x, r: cube.z };
}

// Distance between two hex coordinates using cube math
export function hexDistance(a: HexCoord, b: HexCoord): number {
    const ac = axialToCube(a);
    const bc = axialToCube(b);
    return Math.max(
        Math.abs(ac.x - bc.x),
        Math.abs(ac.y - bc.y),
        Math.abs(ac.z - bc.z)
    );
}

// Get the 6 neighboring hexes (pointy-top orientation)
export function hexNeighbors(center: HexCoord): HexCoord[] {
    return [
        { q: center.q + 1, r: center.r },     // 0: right
        { q: center.q + 1, r: center.r - 1 }, // 1: top-right
        { q: center.q, r: center.r - 1 },     // 2: top-left
        { q: center.q - 1, r: center.r },     // 3: left
        { q: center.q - 1, r: center.r + 1 }, // 4: bottom-left
        { q: center.q, r: center.r + 1 },     // 5: bottom-right
    ];
}

// Get hex in specific direction from center
export function hexDirection(center: HexCoord, direction: number): HexCoord {
    const neighbors = hexNeighbors(center);
    return neighbors[direction % 6];
}

// BFS to find all hexes within range (movement points)
export function hexRange(center: HexCoord, range: number): HexCoord[] {
    const results: HexCoord[] = [];

    for (let q = -range; q <= range; q++) {
        const r1 = Math.max(-range, -q - range);
        const r2 = Math.min(range, -q + range);

        for (let r = r1; r <= r2; r++) {
            const hex = { q: center.q + q, r: center.r + r };
            results.push(hex);
        }
    }

    return results;
}

// Get all hexes at specific distance (ring)
export function hexRing(center: HexCoord, radius: number): HexCoord[] {
    if (radius === 0) return [center];

    const results: HexCoord[] = [];
    let hex = { q: center.q - radius, r: center.r + radius };

    for (let direction = 0; direction < 6; direction++) {
        for (let step = 0; step < radius; step++) {
            results.push({ ...hex });
            hex = hexDirection(hex, direction);
        }
    }

    return results;
}

// Simple pathfinding between two hexes (straight line approximation)
export function hexLinePath(start: HexCoord, end: HexCoord): HexCoord[] {
    const distance = hexDistance(start, end);
    if (distance === 0) return [start];

    const path: HexCoord[] = [];

    for (let i = 0; i <= distance; i++) {
        const t = i / distance;
        const q = Math.round(start.q * (1 - t) + end.q * t);
        const r = Math.round(start.r * (1 - t) + end.r * t);
        path.push({ q, r });
    }

    return path;
}

// Check if hex coordinate is valid (for grid bounds)
export function isValidHex(hex: HexCoord, bounds?: { minQ: number; maxQ: number; minR: number; maxR: number }): boolean {
    if (!bounds) return true;

    return hex.q >= bounds.minQ &&
        hex.q <= bounds.maxQ &&
        hex.r >= bounds.minR &&
        hex.r <= bounds.maxR;
}

// Convert hex to string key for Maps/Sets
export function hexKey(hex: HexCoord): string {
    return `${hex.q},${hex.r}`;
}

// Parse hex from string key
export function keyToHex(key: string): HexCoord {
    const [q, r] = key.split(',').map(Number);
    return { q, r };
}

// Get all hexes in a filled area (blast radius)
export function hexBlast(center: HexCoord, radius: number): HexCoord[] {
    const results: HexCoord[] = [];

    for (let distance = 0; distance <= radius; distance++) {
        if (distance === 0) {
            results.push(center);
        } else {
            results.push(...hexRing(center, distance));
        }
    }

    return results;
}