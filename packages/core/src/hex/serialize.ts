/**
 * Hex Coordinate Serialization and Storage
 * Efficient serialization for save files and network transport
 */

import type { Axial, Cube, Offset } from './types';

/**
 * Serialize axial coordinate to compact string
 * Format: "q,r" (e.g., "3,-1", "-5,2")
 */
export function serializeAxial(hex: Axial): string {
    return `${hex.q},${hex.r}`;
}

/**
 * Deserialize axial coordinate from string
 * Handles both "q,r" and "{q,r}" formats
 */
export function deserializeAxial(str: string): Axial {
    const clean = str.replace(/[{}]/g, '').trim();
    const parts = clean.split(',').map(s => s.trim());

    if (parts.length !== 2) {
        throw new Error(`Invalid axial coordinate string: "${str}"`);
    }

    const qStr = parts[0];
    const rStr = parts[1];
    if (!qStr || !rStr) {
        throw new Error(`Invalid axial coordinate parts: "${str}"`);
    }

    const q = parseInt(qStr, 10);
    const r = parseInt(rStr, 10);

    if (isNaN(q) || isNaN(r)) {
        throw new Error(`Invalid axial coordinate numbers: "${str}"`);
    }

    return { q, r } as Axial;
}

/**
 * Serialize cube coordinate to compact string
 * Format: "x,y,z" (e.g., "3,-1,-2")
 */
export function serializeCube(hex: Cube): string {
    return `${hex.x},${hex.y},${hex.z}`;
}

/**
 * Deserialize cube coordinate from string
 */
export function deserializeCube(str: string): Cube {
    const clean = str.replace(/[{}]/g, '').trim();
    const parts = clean.split(',').map(s => s.trim());

    if (parts.length !== 3) {
        throw new Error(`Invalid cube coordinate string: "${str}"`);
    }

    const xStr = parts[0];
    const yStr = parts[1];
    const zStr = parts[2];
    if (!xStr || !yStr || !zStr) {
        throw new Error(`Invalid cube coordinate parts: "${str}"`);
    }

    const x = parseInt(xStr, 10);
    const y = parseInt(yStr, 10);
    const z = parseInt(zStr, 10);

    if (isNaN(x) || isNaN(y) || isNaN(z)) {
        throw new Error(`Invalid cube coordinate numbers: "${str}"`);
    }

    // Validate cube constraint
    if (x + y + z !== 0) {
        throw new Error(`Invalid cube coordinate constraint: x+y+z=${x + y + z}, must be 0`);
    }

    return { x, y, z } as Cube;
}

/**
 * Serialize offset coordinate to compact string
 * Format: "col,row" (e.g., "5,3")
 */
export function serializeOffset(hex: Offset): string {
    return `${hex.col},${hex.row}`;
}

/**
 * Deserialize offset coordinate from string
 */
export function deserializeOffset(str: string): Offset {
    const clean = str.replace(/[{}]/g, '').trim();
    const parts = clean.split(',').map(s => s.trim());

    if (parts.length !== 2) {
        throw new Error(`Invalid offset coordinate string: "${str}"`);
    }

    const colStr = parts[0];
    const rowStr = parts[1];
    if (!colStr || !rowStr) {
        throw new Error(`Invalid offset coordinate parts: "${str}"`);
    }

    const col = parseInt(colStr, 10);
    const row = parseInt(rowStr, 10);

    if (isNaN(col) || isNaN(row)) {
        throw new Error(`Invalid offset coordinate numbers: "${str}"`);
    }

    return { col, row } as Offset;
}

/**
 * Serialize array of axial coordinates to compact string
 * Format: "q1,r1;q2,r2;q3,r3" (semicolon separated)
 */
export function serializeAxialArray(hexes: Axial[]): string {
    return hexes.map(serializeAxial).join(';');
}

/**
 * Deserialize array of axial coordinates from string
 */
export function deserializeAxialArray(str: string): Axial[] {
    if (str.trim() === '') {
        return [];
    }
    return str.split(';').map(deserializeAxial);
}

/**
 * Serialize set of axial coordinates to compact string
 * Same format as array, but removes duplicates
 */
export function serializeAxialSet(hexes: Set<Axial>): string {
    return serializeAxialArray(Array.from(hexes));
}

/**
 * Deserialize set of axial coordinates from string
 */
export function deserializeAxialSet(str: string): Set<Axial> {
    return new Set(deserializeAxialArray(str));
}

/**
 * Create a Map key from axial coordinate
 * Consistent string format for use as Map/Object keys
 */
export function axialToKey(hex: Axial): string {
    return `${hex.q}:${hex.r}`;
}

/**
 * Parse axial coordinate from Map key
 */
export function keyToAxial(key: string): Axial {
    const parts = key.split(':');
    if (parts.length !== 2) {
        throw new Error(`Invalid axial key format: "${key}"`);
    }

    const qStr = parts[0];
    const rStr = parts[1];
    if (!qStr || !rStr) {
        throw new Error(`Invalid axial key parts: "${key}"`);
    }

    const q = parseInt(qStr, 10);
    const r = parseInt(rStr, 10);

    if (isNaN(q) || isNaN(r)) {
        throw new Error(`Invalid axial key numbers: "${key}"`);
    }

    return { q, r } as Axial;
}

/**
 * Serialize Map<Axial, T> to JSON-compatible object
 */
export function serializeAxialMap<T>(map: Map<Axial, T>): Record<string, T> {
    const result: Record<string, T> = {};
    for (const [hex, value] of map) {
        result[axialToKey(hex)] = value;
    }
    return result;
}

/**
 * Deserialize Map<Axial, T> from JSON-compatible object
 */
export function deserializeAxialMap<T>(obj: Record<string, T>): Map<Axial, T> {
    const map = new Map<Axial, T>();
    for (const [key, value] of Object.entries(obj)) {
        map.set(keyToAxial(key), value);
    }
    return map;
}

/**
 * Compact binary-style serialization for large coordinate arrays
 * Encodes each coordinate as 2 signed 16-bit integers (4 bytes total)
 * Supports coordinates in range -32768 to 32767
 */
export function serializeAxialBinary(hexes: Axial[]): Uint8Array {
    const buffer = new ArrayBuffer(hexes.length * 4);
    const view = new DataView(buffer);

    for (let i = 0; i < hexes.length; i++) {
        const hex = hexes[i];
        if (!hex) continue;

        const offset = i * 4;
        view.setInt16(offset, hex.q, true); // little-endian
        view.setInt16(offset + 2, hex.r, true);
    }

    return new Uint8Array(buffer);
}

/**
 * Deserialize binary coordinate array
 */
export function deserializeAxialBinary(data: Uint8Array): Axial[] {
    if (data.length % 4 !== 0) {
        throw new Error(`Invalid binary data length: ${data.length}, must be multiple of 4`);
    }

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const hexes: Axial[] = [];

    for (let i = 0; i < data.length; i += 4) {
        const q = view.getInt16(i, true); // little-endian
        const r = view.getInt16(i + 2, true);
        hexes.push({ q, r } as Axial);
    }

    return hexes;
}