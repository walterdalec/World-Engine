/**
 * Hex Coordinate Conversions
 * Axial ↔ Cube ↔ Offset with odd-r standard
 */

import type { Axial, Cube, Offset } from './types';
import { axial, cube, offset } from './types';

/**
 * Convert axial (q,r) to cube (x,y,z) coordinates
 * Standard conversion: x = q, z = r, y = -x - z
 */
export function axialToCube(a: Axial): Cube {
    const x = a.q;
    const z = a.r;
    const y = -x - z;
    return cube(x, y, z);
}

/**
 * Convert cube (x,y,z) to axial (q,r) coordinates
 * Standard conversion: q = x, r = z
 */
export function cubeToAxial(c: Cube): Axial {
    return axial(c.x, c.z);
}

/**
 * Convert axial to offset coordinates using odd-r system
 * Odd rows are shifted right by 0.5
 */
export function axialToOffset(a: Axial): Offset {
    const col = a.q + (a.r - (a.r & 1)) / 2;
    const row = a.r;
    return offset(col, row);
}

/**
 * Convert offset odd-r coordinates to axial
 * Inverse of axialToOffset
 */
export function offsetToAxial(o: Offset): Axial {
    const q = o.col - (o.row - (o.row & 1)) / 2;
    const r = o.row;
    return axial(q, r);
}

/**
 * Convert cube to offset coordinates
 */
export function cubeToOffset(c: Cube): Offset {
    return axialToOffset(cubeToAxial(c));
}

/**
 * Convert offset to cube coordinates
 */
export function offsetToCube(o: Offset): Cube {
    return axialToCube(offsetToAxial(o));
}

/**
 * Convert axial to pixel coordinates for pointy-top hexes
 * Standard layout with size determining the hex radius
 */
export function axialToPixel(a: Axial, size: number): { x: number; y: number } {
    const x = size * (3 / 2 * a.q);
    const y = size * (Math.sqrt(3) / 2 * a.q + Math.sqrt(3) * a.r);
    return { x, y };
}

/**
 * Convert pixel coordinates to axial (with fractional result)
 * Caller should use cubeRound if integer coordinates needed
 */
export function pixelToAxial(x: number, y: number, size: number): { q: number; r: number } {
    const q = (2 / 3 * x) / size;
    const r = (-1 / 3 * x + Math.sqrt(3) / 3 * y) / size;
    return { q, r };
}