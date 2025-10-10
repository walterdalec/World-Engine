// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/battle/hex/coords.ts
// Purpose: Canonical hex coordinate types + conversions (Axial ⇄ Cube),
//          rounding, normalization (fix -0), validation, and safe utilities.
//          This is the foundation for all later hex math.
//
// Design Notes
// - Storage: Axial (q, r). Math: Cube (x, y, z) with x + y + z = 0.
// - All public constructors normalize negative zero to +0 to avoid
//   Object.is(-0, 0) === false surprises in tests, hashing, and Map keys.
// - Readonly interfaces to discourage mutation; factory functions return frozen
//   objects in dev builds (NODE_ENV !== 'production').
// - No neighbors / distance here — those land in the next layer (math utils).
// - Rounding follows Red Blob Games cube-round canonical method.
//   Reference: https://www.redblobgames.com/grids/hexagons/
//
// TypeScript Target: ES2020+, strict.
// Test Runner: Vitest (see coords.test.ts)
// ──────────────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/consistent-type-definitions */

//#region Types
export interface Axial { readonly q: number; readonly r: number }
export interface Cube { readonly x: number; readonly y: number; readonly z: number }

export type AxialLike = Axial | { q: number; r: number }
export type CubeLike = Cube | { x: number; y: number; z: number }
//#endregion

//#region Internal Helpers
const __DEV__ = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';

/** Coerce -0 to +0 without affecting other numbers. */
export function normalizeZero(n: number): number {
    // Object.is distinguishes -0, so this is the most explicit fix.
    return Object.is(n, -0) ? 0 : n;
}

/** Freeze in dev for accidental mutation detection; noop in prod. */
function devFreeze<T extends object>(obj: T): T {
    return __DEV__ ? Object.freeze(obj) : obj;
}

/** Tiny invariant helper (throws only in dev). */
function devAssert(cond: unknown, msg: string): asserts cond {
    if (__DEV__ && !cond) throw new Error(`[hex/coords] ${msg}`);
}
//#endregion

//#region Constructors / Normalizers
/** Create a canonical Axial, normalizing -0 and freezing in dev. */
export function axial(q: number, r: number): Axial {
    return devFreeze({ q: normalizeZero(q), r: normalizeZero(r) });
}

/** Create a canonical Cube, normalizing -0, enforcing x+y+z≈0, and freezing. */
export function cube(x: number, y: number, z: number): Cube {
    const nx = normalizeZero(x);
    const ny = normalizeZero(y);
    const nz = normalizeZero(z);
    // Accept tiny FP drift but assert loudly if way off.
    const sum = nx + ny + nz;
    devAssert(Math.abs(sum) < 1e-9, `Cube invariant violated: x+y+z=${sum}`);
    return devFreeze({ x: nx, y: ny, z: nz });
}

/** Clone/normalize a loose Axial-like into canonical Axial. */
export function toAxial(a: AxialLike): Axial {
    return axial(a.q, a.r);
}

/** Clone/normalize a loose Cube-like into canonical Cube. */
export function toCube(c: CubeLike): Cube {
    return cube(c.x, c.y, c.z);
}
//#endregion

//#region Conversions (Axial ⇄ Cube)
/** axial → cube */
export function axialToCube(axialCoord: AxialLike): Cube {
    const q = normalizeZero(axialCoord.q);
    const r = normalizeZero(axialCoord.r);
    const x = q;
    const z = r;
    const y = -x - z; // beware of -0; normalized in cube()
    return cube(x, y, z);
}

/** cube → axial */
export function cubeToAxial(cubeCoord: CubeLike): Axial {
    const x = normalizeZero(cubeCoord.x);
    const z = normalizeZero(cubeCoord.z);
    // y is redundant; we do not carry it into axial representation.
    return axial(x, z);
}
//#endregion

//#region Rounding & Snap-to-Grid
/**
 * Round floating cube coordinates to the nearest integer cube, preserving
 * x + y + z = 0. This is essential when interpolating lines or accumulating
 * floating error from animations.
 */
export function cubeRound(x: number, y: number, z: number): Cube {
    let rx = Math.round(x);
    let ry = Math.round(y);
    let rz = Math.round(z);

    const dx = Math.abs(rx - x);
    const dy = Math.abs(ry - y);
    const dz = Math.abs(rz - z);

    if (dx > dy && dx > dz) {
        rx = -ry - rz;
    } else if (dy > dz) {
        ry = -rx - rz;
    } else {
        rz = -rx - ry;
    }

    return cube(rx, ry, rz);
}

/** Round a floating Axial by converting through cube space. */
export function axialRound(q: number, r: number): Axial {
    const c = axialToCube({ q, r });
    const rc = cubeRound(c.x, c.y, c.z);
    return cubeToAxial(rc);
}
//#endregion

//#region Equality, Keys, and Guards
/** Value equality for Axial with -0 safety. */
export function axialEq(a: AxialLike, b: AxialLike): boolean {
    return normalizeZero(a.q) === normalizeZero(b.q) && normalizeZero(a.r) === normalizeZero(b.r);
}

/** Value equality for Cube with -0 safety. */
export function cubeEq(a: CubeLike, b: CubeLike): boolean {
    return (
        normalizeZero(a.x) === normalizeZero(b.x) &&
        normalizeZero(a.y) === normalizeZero(b.y) &&
        normalizeZero(a.z) === normalizeZero(b.z)
    );
}

/** Stable string key for Axial suitable for Map/Record keys. */
export function axialKey(a: AxialLike): string {
    const q = normalizeZero(a.q);
    const r = normalizeZero(a.r);
    return `${q},${r}`;
}

/** Stable string key for Cube suitable for Map/Record keys. */
export function cubeKey(c: CubeLike): string {
    const x = normalizeZero(c.x);
    const y = normalizeZero(c.y);
    const z = normalizeZero(c.z);
    return `${x},${y},${z}`;
}

/** Type guard: is Axial-like structure */
export function isAxial(v: unknown): v is AxialLike {
    return !!v && typeof v === 'object' && 'q' in (v as Record<string, unknown>) && 'r' in (v as Record<string, unknown>);
}

/** Type guard: is Cube-like structure */
export function isCube(v: unknown): v is CubeLike {
    return !!v && typeof v === 'object' && 'x' in (v as Record<string, unknown>) && 'y' in (v as Record<string, unknown>) && 'z' in (v as Record<string, unknown>);
}
//#endregion

//#region Constants & Directions (no neighbors yet)
export const AXIAL_ZERO: Axial = axial(0, 0);
export const CUBE_ZERO: Cube = cube(0, 0, 0);

// Canonical cube direction vectors (pointy-top, axial q-right, r-down by convention).
// NOTE: We expose the vectors here for future use; neighbor computation lives in the next layer.
export const CUBE_DIRS: ReadonlyArray<Cube> = [
    cube(+1, -1, 0),
    cube(+1, 0, -1),
    cube(0, +1, -1),
    cube(-1, +1, 0),
    cube(-1, 0, +1),
    cube(0, -1, +1),
];
//#endregion

//#region Serialization Helpers
/** Compact JSON-safe representation for Axial. */
export function axialSerialize(a: AxialLike): [number, number] {
    return [normalizeZero(a.q), normalizeZero(a.r)];
}

/** Compact JSON-safe representation for Cube. */
export function cubeSerialize(c: CubeLike): [number, number, number] {
    return [normalizeZero(c.x), normalizeZero(c.y), normalizeZero(c.z)];
}

/** Parse serialized Axial */
export function axialDeserialize(t: [number, number]): Axial {
    return axial(t[0], t[1]);
}

/** Parse serialized Cube */
export function cubeDeserialize(t: [number, number, number]): Cube {
    return cube(t[0], t[1], t[2]);
}
//#endregion

//#region Debug & Dev Tools
/** Pretty print helpers for logging and test diffs. */
export function fmtAxial(a: AxialLike): string {
    return `Axial(q=${normalizeZero(a.q)}, r=${normalizeZero(a.r)})`;
}
export function fmtCube(c: CubeLike): string {
    return `Cube(x=${normalizeZero(c.x)}, y=${normalizeZero(c.y)}, z=${normalizeZero(c.z)})`;
}
//#endregion
