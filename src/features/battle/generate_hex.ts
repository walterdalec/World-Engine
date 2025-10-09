/**
 * Hex Battlefield Generation
 * Creates procedural hex grids with deployment zones
 */

import { BattleGrid, HexTile, DeploymentZone, HexPosition, BattleContext as _BattleContext } from './types';

export interface BattlefieldConfig {
    seed: string;
    biome: string;
    width?: number;
    height?: number;
}

export interface GeneratedBattlefield {
    grid: BattleGrid;
    friendly: DeploymentZone;
    enemy: DeploymentZone;
}

/**
 * Simple seeded random number generator
 */
function seededRandom(seed: string): () => number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }

    return function () {
        hash = ((hash * 1664525) + 1013904223) % Math.pow(2, 32);
        return (hash / Math.pow(2, 32)) + 0.5;
    };
}

/**
 * Convert offset coordinates to hex coordinates
 */
function offsetToHex(col: number, row: number): HexPosition {
    const q = col - Math.floor((row - (row & 1)) / 2);
    const r = row;
    return { q, r };
}

/**
 * Generate terrain based on biome and position
 */
function generateTerrain(q: number, r: number, biome: string, random: () => number): HexTile['terrain'] {
    const roll = random();

    switch (biome) {
        case "Forest":
            if (roll < 0.6) return "Forest";
            if (roll < 0.9) return "Grass";
            return "Mountain";

        case "Desert":
            if (roll < 0.8) return "Desert";
            if (roll < 0.95) return "Mountain";
            return "Grass";

        case "Swamp":
            if (roll < 0.4) return "Water";
            if (roll < 0.8) return "Swamp";
            return "Grass";

        default: // Grass
            if (roll < 0.7) return "Grass";
            if (roll < 0.85) return "Forest";
            if (roll < 0.95) return "Mountain";
            return "Water";
    }
}

/**
 * Generate hex battlefield with deployment zones
 */
export function generateBattlefieldHex(config: BattlefieldConfig): GeneratedBattlefield {
    const width = config.width || 16;
    const height = config.height || 12;
    const random = seededRandom(config.seed);

    const tiles: HexTile[] = [];

    // Generate hex tiles
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const { q, r } = offsetToHex(col, row);
            const terrain = generateTerrain(q, r, config.biome, random);

            const tile: HexTile = {
                q,
                r,
                terrain,
                elevation: Math.floor(random() * 3), // 0-2 elevation
                passable: terrain !== "Water" && terrain !== "Mountain",
                cover: terrain === "Forest" ? 2 : terrain === "Mountain" ? 3 : 0
            };

            tiles.push(tile);
        }
    }

    const grid: BattleGrid = {
        width,
        height,
        tiles
    };

    // Create deployment zones - friendly on left, enemy on right
    const friendlyZone: DeploymentZone = {
        faction: "Player",
        hexes: []
    };

    const enemyZone: DeploymentZone = {
        faction: "Enemy",
        hexes: []
    };

    // Add passable hexes to deployment zones
    for (const tile of tiles) {
        if (!tile.passable) continue;

        // Friendly zone: leftmost 3 columns
        if (tile.q >= 0 && tile.q <= 2) {
            friendlyZone.hexes.push({ q: tile.q, r: tile.r });
        }

        // Enemy zone: rightmost 3 columns  
        if (tile.q >= width - 3 && tile.q < width) {
            enemyZone.hexes.push({ q: tile.q, r: tile.r });
        }
    }

    return {
        grid,
        friendly: friendlyZone,
        enemy: enemyZone
    };
}

/**
 * Get hex distance between two positions
 */
export function hexDistance(a: HexPosition, b: HexPosition): number {
    return Math.max(
        Math.abs(a.q - b.q),
        Math.abs(a.q + a.r - b.q - b.r),
        Math.abs(a.r - b.r)
    ) / 2;
}

/**
 * Get hexes within range of a position
 */
export function getHexesInRange(center: HexPosition, range: number, grid: BattleGrid): HexPosition[] {
    const result: HexPosition[] = [];

    for (const tile of grid.tiles) {
        const distance = hexDistance(center, { q: tile.q, r: tile.r });
        if (distance <= range) {
            result.push({ q: tile.q, r: tile.r });
        }
    }

    return result;
}

/**
 * Check if a hex position is valid and passable
 */
export function isValidPosition(pos: HexPosition, grid: BattleGrid): boolean {
    const tile = grid.tiles.find(t => t.q === pos.q && t.r === pos.r);
    return tile ? tile.passable : false;
}

// ===== PHASE 0: HEX COORDINATE UTILITIES =====

/**
 * Convert axial coordinates to cube coordinates
 */
export function axialToCube(hex: HexPosition): { x: number; y: number; z: number } {
    const x = hex.q;
    const z = hex.r;
    const y = -x - z;
    return { x, y, z };
}

/**
 * Convert cube coordinates to axial coordinates
 */
export function cubeToAxial(cube: { x: number; y: number; z: number }): HexPosition {
    return { q: cube.x, r: cube.z };
}

/**
 * Calculate distance between two hex positions using cube coordinates
 */
export function cubeDistance(a: HexPosition, b: HexPosition): number {
    const cubeA = axialToCube(a);
    const cubeB = axialToCube(b);
    return Math.max(
        Math.abs(cubeA.x - cubeB.x),
        Math.abs(cubeA.y - cubeB.y),
        Math.abs(cubeA.z - cubeB.z)
    );
}

/**
 * Six hex directions (pointy-top orientation)
 */
export const axialDirections: HexPosition[] = [
    { q: 1, r: 0 },   // East
    { q: 1, r: -1 },  // Northeast  
    { q: 0, r: -1 },  // Northwest
    { q: -1, r: 0 },  // West
    { q: -1, r: 1 },  // Southwest
    { q: 0, r: 1 }    // Southeast
];

/**
 * Get all neighboring hexes of a position
 */
export function neighborsHex(center: HexPosition): HexPosition[] {
    return axialDirections.map(dir => ({
        q: center.q + dir.q,
        r: center.r + dir.r
    }));
}

/**
 * Get hex at distance and direction from center
 */
export function hexNeighbor(center: HexPosition, direction: number): HexPosition {
    const dir = axialDirections[direction % 6];
    return {
        q: center.q + dir.q,
        r: center.r + dir.r
    };
}

/**
 * Get all hexes in a ring around center at given radius
 */
export function hexRing(center: HexPosition, radius: number): HexPosition[] {
    if (radius === 0) return [center];

    const results: HexPosition[] = [];
    let hex = { q: center.q + axialDirections[4].q * radius, r: center.r + axialDirections[4].r * radius };

    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < radius; j++) {
            results.push({ ...hex });
            hex = hexNeighbor(hex, i);
        }
    }

    return results;
}

/**
 * Get all hexes within radius (filled circle)
 */
export function hexSpiral(center: HexPosition, maxRadius: number): HexPosition[] {
    const results: HexPosition[] = [center];

    for (let r = 1; r <= maxRadius; r++) {
        results.push(...hexRing(center, r));
    }

    return results;
}