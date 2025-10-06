/**
 * Hex utility wrapper for action system
 * Uses existing battle hex math from features/battle/hex.ts
 */

import {
    HexCoord,
    hexDistance,
    hexNeighbors,
    hexLinePath,
    hexBlast,
    hexRing
} from '../../features/battle/hex';
import type { Axial } from './types';

// Utility functions that bridge between Axial and HexCoord types
function axialToHex(a: Axial): HexCoord {
    return { q: a.q, r: a.r };
}

function hexToAxial(h: HexCoord): Axial {
    return { q: h.q, r: h.r };
}

// Re-export hex functions with Axial types
export function axial(q: number, r: number): Axial {
    return { q, r };
}

export function axialDistance(a: Axial, b: Axial): number {
    return hexDistance(axialToHex(a), axialToHex(b));
}

export function hexLine(from: Axial, to: Axial): Axial[] {
    return hexLinePath(axialToHex(from), axialToHex(to)).map(hexToAxial);
}

export function hexRingAt(center: Axial, radius: number): Axial[] {
    return hexRing(axialToHex(center), radius).map(hexToAxial);
}

export function hexBlastAt(center: Axial, radius: number): Axial[] {
    return hexBlast(axialToHex(center), radius).map(hexToAxial);
}

export function neighbors(center: Axial): Axial[] {
    return hexNeighbors(axialToHex(center)).map(hexToAxial);
}

// LOS function wrapper
export function los(from: Axial, to: Axial, blocksLos: (h: Axial) => boolean): { visible: boolean; occluder?: Axial } {
    const line = hexLine(from, to);

    // Skip origin, check up to (but including) target
    for (let i = 1; i < line.length; i++) {
        const hex = line[i]!;
        if (blocksLos(hex)) {
            return { visible: false, occluder: hex };
        }
    }

    return { visible: true };
}