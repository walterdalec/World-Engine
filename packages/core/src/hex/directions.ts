/**
 * Hex Direction Constants
 * Stable direction arrays for consistent neighbor ordering
 */

import type { Axial, Cube } from './types';

// Pointy-top hex directions (standard order: E, NE, NW, W, SW, SE)
export const AXIAL_DIRS: Readonly<Axial[]> = [
    { q: +1, r: 0 } as Axial,   // East
    { q: +1, r: -1 } as Axial,  // Northeast  
    { q: 0, r: -1 } as Axial,   // Northwest
    { q: -1, r: 0 } as Axial,   // West
    { q: -1, r: +1 } as Axial,  // Southwest
    { q: 0, r: +1 } as Axial,   // Southeast
] as const;

export const CUBE_DIRS: Readonly<Cube[]> = [
    { x: +1, y: -1, z: 0 } as Cube,   // East
    { x: +1, y: 0, z: -1 } as Cube,   // Northeast
    { x: 0, y: +1, z: -1 } as Cube,   // Northwest
    { x: -1, y: +1, z: 0 } as Cube,   // West
    { x: -1, y: 0, z: +1 } as Cube,   // Southwest
    { x: 0, y: -1, z: +1 } as Cube,   // Southeast
] as const;

// Direction names for debugging and display
export const DIRECTION_NAMES = [
    'East', 'Northeast', 'Northwest', 'West', 'Southwest', 'Southeast'
] as const;

export type HexDirection = 0 | 1 | 2 | 3 | 4 | 5;