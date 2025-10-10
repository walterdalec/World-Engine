/**
 * Hex Coordinate System for Tactical Battles
 * 
 * Uses axial coordinates (q, r) for storage and cube coordinates for calculations.
 * Conversion between smooth world coordinates and hex grid for battle transitions.
 */

import type { WorldPos, Biome } from '../../../core/types';

/**
 * Axial hex coordinates (q, r)
 * q = column, r = row in pointy-top hex orientation
 */
export type Axial = { q: number; r: number };

/**
 * Hex tile for tactical battle grid
 */
export interface HexTile {
  axial: Axial;
  height: number;       // Elevation for line-of-sight and movement
  biome: Biome;         // Terrain type from overworld
  blocked: boolean;     // Impassable terrain
  features: string[];   // Special features: "trees", "rocks", "bog", "cover", etc
}

/**
 * Size of hex in world units (radius from center to vertex)
 */
export const HEX_SIZE = 1;

/**
 * Convert smooth world position to axial hex coordinates
 * 
 * Uses pointy-top hex orientation with flat-top conversion formulas
 * 
 * @param p - World position {x, y}
 * @param size - Hex size in world units (default: HEX_SIZE)
 * @returns Axial hex coordinates {q, r}
 */
export function worldToAxial(p: WorldPos, size = HEX_SIZE): Axial {
  // Convert to fractional axial coordinates
  const qf = (Math.sqrt(3) / 3 * p.x - (1 / 3) * p.y) / size;
  const rf = ((2 / 3) * p.y) / size;
  
  // Round to nearest hex
  return axialRound(qf, rf);
}

/**
 * Convert axial hex coordinates to smooth world position
 * 
 * Returns the center point of the hex in world coordinates
 * 
 * @param a - Axial coordinates {q, r}
 * @param size - Hex size in world units (default: HEX_SIZE)
 * @returns World position {x, y}
 */
export function axialToWorld(a: Axial, size = HEX_SIZE): WorldPos {
  const x = size * (Math.sqrt(3) * a.q + (Math.sqrt(3) / 2) * a.r);
  const y = size * (3 / 2) * a.r;
  return { x, y };
}

/**
 * Round fractional axial coordinates to nearest hex
 * 
 * Uses cube coordinate rounding for accuracy
 * 
 * @param qf - Fractional q coordinate
 * @param rf - Fractional r coordinate
 * @returns Rounded axial coordinates
 */
function axialRound(qf: number, rf: number): Axial {
  // Convert to cube coordinates (x + y + z = 0)
  let x = qf;
  let z = rf;
  let y = -x - z;
  
  // Round each component
  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);
  
  // Calculate rounding errors
  const xDiff = Math.abs(rx - x);
  const yDiff = Math.abs(ry - y);
  const zDiff = Math.abs(rz - z);
  
  // Reset the component with largest error to maintain x + y + z = 0
  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff > zDiff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }
  
  return { q: rx, r: rz };
}

/**
 * Calculate distance between two hexes (cube distance)
 */
export function hexDistance(a: Axial, b: Axial): number {
  const ax = a.q;
  const az = a.r;
  const ay = -ax - az;
  
  const bx = b.q;
  const bz = b.r;
  const by = -bx - bz;
  
  return Math.max(
    Math.abs(ax - bx),
    Math.abs(ay - by),
    Math.abs(az - bz)
  );
}

/**
 * Get all hexes within a given radius
 */
export function hexesInRadius(center: Axial, radius: number): Axial[] {
  const results: Axial[] = [];
  
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    
    for (let r = r1; r <= r2; r++) {
      results.push({ q: center.q + q, r: center.r + r });
    }
  }
  
  return results;
}

/**
 * Get the 6 neighbors of a hex
 */
export const HEX_DIRECTIONS: Axial[] = [
  { q: 1, r: 0 },   // East
  { q: 1, r: -1 },  // Northeast
  { q: 0, r: -1 },  // Northwest
  { q: -1, r: 0 },  // West
  { q: -1, r: 1 },  // Southwest
  { q: 0, r: 1 },   // Southeast
];

export function hexNeighbor(hex: Axial, direction: number): Axial {
  const dir = HEX_DIRECTIONS[direction % 6];
  return { q: hex.q + dir.q, r: hex.r + dir.r };
}

export function hexNeighbors(hex: Axial): Axial[] {
  return HEX_DIRECTIONS.map(dir => ({ q: hex.q + dir.q, r: hex.r + dir.r }));
}
