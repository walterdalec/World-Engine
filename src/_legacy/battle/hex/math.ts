// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/battle/hex/math.ts
// Purpose: Core hex math utilities built atop coords.ts. Distance, neighbors,
//          interpolation, line/ring/spiral generators, range queries, and
//          rotation/mirroring helpers. All output is normalized and safe.
//
// Depend on: src/features/battle/hex/coords.ts
// Exposes only math primitives; no game rules or terrain costs here.
// ──────────────────────────────────────────────────────────────────────────────

import type { AxialLike, Cube, CubeLike } from './coords';
import {
    type Axial,
    cube,
    axialToCube,
    cubeToAxial,
    cubeRound,
    normalizeZero,
    CUBE_DIRS,
} from './coords';

//#region Basic Vector Ops (cube)
export function cubeAdd(a: CubeLike, b: CubeLike): Cube {
    return cube(
        normalizeZero(a.x + b.x),
        normalizeZero(a.y + b.y),
        normalizeZero(a.z + b.z),
    );
}

export function cubeSub(a: CubeLike, b: CubeLike): Cube {
    return cube(
        normalizeZero(a.x - b.x),
        normalizeZero(a.y - b.y),
        normalizeZero(a.z - b.z),
    );
}

export function cubeScale(a: CubeLike, k: number): Cube {
    return cube(
        normalizeZero(a.x * k),
        normalizeZero(a.y * k),
        normalizeZero(a.z * k),
    );
}

export function cubeDistance(a: CubeLike, b: CubeLike): number {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    const dz = Math.abs(a.z - b.z);
    return Math.max(dx, dy, dz);
}

export function axialDistance(a: AxialLike, b: AxialLike): number {
    return cubeDistance(axialToCube(a), axialToCube(b));
}
//#endregion

//#region Directions & Neighbors
/** 0..5 directions. Convention (pointy-top): q-right is dir 0, then clockwise. */
export type Direction = 0 | 1 | 2 | 3 | 4 | 5;

export function cubeDirection(dir: Direction): Cube {
    return CUBE_DIRS[dir];
}

export function cubeNeighbor(c: CubeLike, dir: Direction): Cube {
    return cubeAdd(c, cubeDirection(dir));
}

export function cubeNeighbors(c: CubeLike): Cube[] {
    return [0, 1, 2, 3, 4, 5].map(d => cubeNeighbor(c, d as Direction));
}

export function axialNeighbor(a: AxialLike, dir: Direction): Axial {
    const n = cubeNeighbor(axialToCube(a), dir);
    return cubeToAxial(n);
}

export function axialNeighbors(a: AxialLike): Axial[] {
    return cubeNeighbors(axialToCube(a)).map(cubeToAxial);
}
//#endregion

//#region Interpolation & Lines
export function cubeLerp(a: CubeLike, b: CubeLike, t: number): { x: number; y: number; z: number } {
    return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t,
    };
}

/** Inclusive line of hexes from a to b. */
export function cubeLine(a: CubeLike, b: CubeLike): Cube[] {
    const N = cubeDistance(a, b);
    if (N === 0) return [cube(a.x, a.y, a.z)];
    const results: Cube[] = [];
    for (let i = 0; i <= N; i++) {
        const t = i / N;
        const p = cubeLerp(a, b, t);
        results.push(cubeRound(p.x, p.y, p.z));
    }
    // Deduplicate in case rounding yields repeats at short ranges
    for (let i = results.length - 2; i >= 0; i--) {
        const c = results[i];
        const n = results[i + 1];
        if (c.x === n.x && c.y === n.y && c.z === n.z) results.splice(i, 1);
    }
    return results;
}

export function axialLine(a: AxialLike, b: AxialLike): Axial[] {
    return cubeLine(axialToCube(a), axialToCube(b)).map(cubeToAxial);
}
//#endregion

//#region Rings & Spirals
/**
 * All hexes at exact radius r from center (r > 0 returns 6r cells; r=0 returns [center]).
 */
export function cubeRing(center: CubeLike, radius: number): Cube[] {
    if (radius < 0) throw new Error('radius must be >= 0');
    if (radius === 0) return [cube(center.x, center.y, center.z)];

    const results: Cube[] = [];
    // Start: move radius steps in direction 4 (arbitrary choice)
    let hex = cubeAdd(center, cubeScale(cubeDirection(4), radius));
    for (let side = 0; side < 6; side++) {
        for (let step = 0; step < radius; step++) {
            results.push(hex);
            hex = cubeNeighbor(hex, side as Direction);
        }
    }
    return results;
}

export function axialRing(center: AxialLike, radius: number): Axial[] {
    return cubeRing(axialToCube(center), radius).map(cubeToAxial);
}

/** Spiral from radius 0..R inclusive */
export function cubeSpiral(center: CubeLike, maxRadius: number): Cube[] {
    const results: Cube[] = [];
    for (let r = 0; r <= maxRadius; r++) results.push(...cubeRing(center, r));
    return results;
}

export function axialSpiral(center: AxialLike, maxRadius: number): Axial[] {
    return cubeSpiral(axialToCube(center), maxRadius).map(cubeToAxial);
}
//#endregion

//#region Range (disk) queries
/** All hexes within radius R (inclusive). */
export function cubeRange(center: CubeLike, radius: number): Cube[] {
    if (radius < 0) return [];
    const results: Cube[] = [];
    for (let dx = -radius; dx <= radius; dx++) {
        const minDy = Math.max(-radius, -dx - radius);
        const maxDy = Math.min(radius, -dx + radius);
        for (let dy = minDy; dy <= maxDy; dy++) {
            const dz = -dx - dy;
            results.push(cubeAdd(center, cube(dx, dy, dz)));
        }
    }
    return results;
}

export function axialRange(center: AxialLike, radius: number): Axial[] {
    return cubeRange(axialToCube(center), radius).map(cubeToAxial);
}
//#endregion

//#region Rotations & Mirrors
/** Rotate 60° left around origin. */
export function cubeRotateLeft(c: CubeLike): Cube {
    // (x, y, z) -> (-z, -x, -y)
    return cube(-c.z, -c.x, -c.y);
}
/** Rotate 60° right around origin. */
export function cubeRotateRight(c: CubeLike): Cube {
    // (x, y, z) -> (-y, -z, -x)
    return cube(-c.y, -c.z, -c.x);
}
/** Rotate n steps (positive = right) around origin. */
export function cubeRotate(c: CubeLike, steps: number): Cube {
    const n = ((steps % 6) + 6) % 6;
    let out = cube(c.x, c.y, c.z);
    for (let i = 0; i < n; i++) out = cubeRotateRight(out);
    return out;
}
/** Rotate around a pivot. */
export function cubeRotateAround(pivot: CubeLike, c: CubeLike, steps: number): Cube {
    const rel = cubeSub(c, pivot);
    const rot = cubeRotate(rel, steps);
    return cubeAdd(pivot, rot);
}
/** Mirror across q-axis (x-axis in cube space). */
export function cubeMirrorQ(c: CubeLike): Cube { return cube(c.x, c.z, c.y); }
/** Mirror across r-axis (z-axis in cube space). */
export function cubeMirrorR(c: CubeLike): Cube { return cube(c.y, c.x, c.z); }
//#endregion

//#region Axial sugar
export function axialAdd(a: AxialLike, b: AxialLike): Axial {
    return cubeToAxial(cubeAdd(axialToCube(a), axialToCube(b)));
}
export function axialSub(a: AxialLike, b: AxialLike): Axial {
    return cubeToAxial(cubeSub(axialToCube(a), axialToCube(b)));
}
//#endregion
