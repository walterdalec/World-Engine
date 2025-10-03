import type {
    BattleGrid,
    HexTile,
    BattleContext,
    DeploymentZone,
    HexPosition
} from "./types";
import { hexSpiral, hexRing } from "./generate_hex";

export interface BiomeConfig {
    name: string;
    terrainTypes: Array<{
        type: "Grass" | "Forest" | "Mountain" | "Water" | "Desert" | "Swamp";
        weight: number;
        passable: boolean;
        cover?: number;
    }>;
    elevationVariance: number;
    roadChance: number;
}

export const BIOME_CONFIGS: Record<string, BiomeConfig> = {
    "Grass": {
        name: "Grasslands",
        terrainTypes: [
            { type: "Grass", weight: 70, passable: true },
            { type: "Forest", weight: 20, passable: true, cover: 0.3 },
            { type: "Mountain", weight: 10, passable: false }
        ],
        elevationVariance: 1,
        roadChance: 0.1
    },

    "Forest": {
        name: "Deep Forest",
        terrainTypes: [
            { type: "Forest", weight: 60, passable: true, cover: 0.5 },
            { type: "Grass", weight: 30, passable: true },
            { type: "Water", weight: 10, passable: false }
        ],
        elevationVariance: 2,
        roadChance: 0.05
    },

    "Desert": {
        name: "Arid Desert",
        terrainTypes: [
            { type: "Desert", weight: 80, passable: true },
            { type: "Mountain", weight: 15, passable: false },
            { type: "Water", weight: 5, passable: false } // Oasis
        ],
        elevationVariance: 3,
        roadChance: 0.08
    },

    "Mountain": {
        name: "Rocky Peaks",
        terrainTypes: [
            { type: "Mountain", weight: 50, passable: false },
            { type: "Grass", weight: 30, passable: true },
            { type: "Forest", weight: 20, passable: true, cover: 0.2 }
        ],
        elevationVariance: 5,
        roadChance: 0.03
    },

    "Swamp": {
        name: "Fetid Marshland",
        terrainTypes: [
            { type: "Swamp", weight: 60, passable: true },
            { type: "Water", weight: 25, passable: false },
            { type: "Grass", weight: 15, passable: true }
        ],
        elevationVariance: 1,
        roadChance: 0.02
    },

    "Settlement": {
        name: "Village Outskirts",
        terrainTypes: [
            { type: "Grass", weight: 60, passable: true },
            { type: "Forest", weight: 25, passable: true, cover: 0.2 },
            { type: "Mountain", weight: 15, passable: false } // Buildings/walls
        ],
        elevationVariance: 1,
        roadChance: 0.25
    }
};

// Simple seeded random number generator
export class SeededRNG {
    private seed: number;

    constructor(seed: string) {
        this.seed = this.hashString(seed);
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    nextInt(max: number): number {
        return Math.floor(this.next() * max);
    }

    choice<T>(array: T[]): T {
        return array[this.nextInt(array.length)];
    }
}

export function generateBattlefield(
    context: BattleContext,
    width: number = 20,
    height: number = 14
): {
    grid: BattleGrid;
    friendlyDeployment: DeploymentZone;
    enemyDeployment: DeploymentZone;
} {
    const rng = new SeededRNG(context.seed);
    const biomeConfig = BIOME_CONFIGS[context.biome] || BIOME_CONFIGS["Grass"];

    const tiles: HexTile[] = [];
    const center = { q: Math.floor(width / 2), r: Math.floor(height / 2) };

    // Generate base terrain
    for (let r = 0; r < height; r++) {
        for (let q = 0; q < width; q++) {
            const terrainRoll = rng.next();
            let cumulativeWeight = 0;
            let selectedTerrain = biomeConfig.terrainTypes[0];

            for (const terrain of biomeConfig.terrainTypes) {
                cumulativeWeight += terrain.weight / 100;
                if (terrainRoll <= cumulativeWeight) {
                    selectedTerrain = terrain;
                    break;
                }
            }

            const elevation = Math.floor(rng.next() * biomeConfig.elevationVariance);

            tiles.push({
                q,
                r,
                terrain: selectedTerrain.type,
                elevation,
                passable: selectedTerrain.passable,
                cover: selectedTerrain.cover || 0
            });
        }
    }

    // Add special site features
    if (context.site === "settlement") {
        addSettlementFeatures(tiles, width, height, rng);
    } else if (context.site === "dungeon") {
        addDungeonFeatures(tiles, width, height, rng);
    }

    // Create deployment zones
    const friendlyZone = generateDeploymentZone("Player", width, height, 0.2);
    const enemyZone = generateDeploymentZone("Enemy", width, height, 0.8);

    const grid: BattleGrid = {
        width,
        height,
        tiles
    };

    return {
        grid,
        friendlyDeployment: friendlyZone,
        enemyDeployment: enemyZone
    };
}

function addSettlementFeatures(
    tiles: HexTile[],
    width: number,
    height: number,
    rng: SeededRNG
) {
    // Add some roads and buildings
    const roadPositions = new Set<string>();

    // Main road across the battlefield
    const roadY = Math.floor(height / 2);
    for (let x = 0; x < width; x += 2) {
        roadPositions.add(`${x},${roadY}`);
    }

    // Apply road modifications
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];
        const key = `${tile.q},${tile.r}`;

        if (roadPositions.has(key)) {
            tile.terrain = "Grass"; // Roads are clear
            tile.passable = true;
            tile.cover = 0;
        }

        // Add some building-like obstacles
        if (rng.next() < 0.05) {
            tile.terrain = "Mountain"; // Represents buildings
            tile.passable = false;
            tile.elevation = 2;
        }
    }
}

function addDungeonFeatures(
    tiles: HexTile[],
    width: number,
    height: number,
    rng: SeededRNG
) {
    // Create corridors and chambers
    for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i];

        // Most of dungeon is walls
        if (rng.next() < 0.7) {
            tile.terrain = "Mountain"; // Walls
            tile.passable = false;
        } else {
            tile.terrain = "Grass"; // Floor
            tile.passable = true;
            tile.cover = 0;
        }
    }

    // Carve out some clear paths
    const midY = Math.floor(height / 2);
    for (let x = 1; x < width - 1; x++) {
        const tile = tiles.find(t => t.q === x && t.r === midY);
        if (tile) {
            tile.terrain = "Grass";
            tile.passable = true;
        }
    }
}

function generateDeploymentZone(
    faction: "Player" | "Enemy",
    width: number,
    height: number,
    position: number // 0.0 to 1.0 across the battlefield
): DeploymentZone {
    const hexes: HexPosition[] = [];
    const deployX = Math.floor(width * position);

    // Create a 3-hex wide deployment zone
    for (let x = Math.max(0, deployX - 1); x <= Math.min(width - 1, deployX + 1); x++) {
        for (let y = 1; y < height - 1; y += 2) {
            hexes.push({ q: x, r: y });
        }
    }

    return { hexes, faction };
}

// Utility function to check if a hex is valid for the grid
export function isValidHex(pos: HexPosition, width: number, height: number): boolean {
    return pos.q >= 0 && pos.q < width && pos.r >= 0 && pos.r < height;
}

// Get neighboring tiles that are passable
export function getPassableNeighbors(
    grid: BattleGrid,
    pos: HexPosition
): HexPosition[] {
    const neighbors: HexPosition[] = [];
    const directions = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];

    for (const dir of directions) {
        const neighbor = { q: pos.q + dir.q, r: pos.r + dir.r };
        if (isValidHex(neighbor, grid.width, grid.height)) {
            const tile = grid.tiles.find(t => t.q === neighbor.q && t.r === neighbor.r);
            if (tile && tile.passable) {
                neighbors.push(neighbor);
            }
        }
    }

    return neighbors;
}

// Generate a battlefield optimized for tactical combat
export function generateTacticalBattlefield(
    context: BattleContext,
    playerPartySize: number,
    enemyCount: number
): {
    grid: BattleGrid;
    friendlyDeployment: DeploymentZone;
    enemyDeployment: DeploymentZone;
} {
    // Scale battlefield size based on unit count
    const totalUnits = playerPartySize + enemyCount;
    const minSize = Math.max(12, Math.ceil(Math.sqrt(totalUnits) * 3));
    const width = minSize + 4;
    const height = minSize;

    return generateBattlefield(context, width, height);
}