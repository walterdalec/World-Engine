/**
 * Settlement & Region Types
 * Canvas 07 - Settlements, POIs, and Region Ownership
 */

import type { Vec2 } from '../roads/types';
import type { TileData } from '../roads/types';

export interface Settlement {
    id: string;
    kind: 'capital' | 'town' | 'fort';
    pos: Vec2;
    name: string;
    regionId?: string;
    marketTier?: 1 | 2 | 3;  // towns only
    harbor?: boolean;         // coastal/river trade
    roadNodeId?: string;      // connection to road network
    population?: number;      // estimated population
}

export interface Region {
    id: string;
    center: Vec2;
    settlements: string[];    // Settlement IDs
    area: number;             // Number of tiles
    biomeMix: Record<string, number>;  // biomeId -> fraction
    resources: Record<string, number>; // resourceType -> amount
    tier: 1 | 2 | 3 | 4;      // 1=frontier, 4=metropolis
    owner: string | null;      // Faction ID or null for unclaimed
    contested?: boolean;       // Near-tie for ownership
}

export interface POI {
    id: string;
    kind: 'ruins' | 'den' | 'mine' | 'shrine' | 'cave' | 'grove' | 'temple' | 'watchtower';
    pos: Vec2;
    name: string;
    biome: string;
    danger: number;           // 0-1 threat level
    resources?: Record<string, number>;
    discovered?: boolean;
}

export interface SuitabilityWeights {
    wb: number;  // Biome score weight
    ww: number;  // Water proximity weight
    wr: number;  // Resource potential weight
    ws: number;  // Slope penalty weight
}

export const DEFAULT_SUITABILITY_WEIGHTS: SuitabilityWeights = {
    wb: 1.0,
    ww: 0.8,
    wr: 0.6,
    ws: 1.2
};

export interface PlacementKnobs {
    targetCapitals: number;
    targetTowns: number;
    targetForts: number;
    poiDensity: number;       // POIs per 1000 tiles
    minSettlementSpacing: number;
    minFortSpacing: number;
    capitalRadius: number;    // Poisson-disk radius for capitals
    townSpacing: number;      // Distance between towns on roads
    elevMaxForCity: number;   // Max elevation for settlements
    floodRiskMin: number;     // Min elevation near rivers
}

export const DEFAULT_PLACEMENT_KNOBS: PlacementKnobs = {
    targetCapitals: 12,
    targetTowns: 48,
    targetForts: 24,
    poiDensity: 5.0,          // 5 POIs per 1000 tiles
    minSettlementSpacing: 20,
    minFortSpacing: 30,
    capitalRadius: 80,
    townSpacing: 40,
    elevMaxForCity: 0.75,
    floodRiskMin: 0.05
};

export interface PlacementOutput {
    settlements: Settlement[];
    regions: Record<string, Region>;
    pois: POI[];
}

export interface PlacementInput {
    worldWidth: number;
    worldHeight: number;
    getTile: (_x: number, _y: number) => TileData | undefined;
    roadGraph?: any;  // RoadGraph from Canvas 06 (optional for initial implementation)
    knobs?: Partial<PlacementKnobs>;
    seed: number;
}

// Biome suitability scores for settlements
export const BIOME_SUITABILITY: Record<string, number> = {
    'grassland': 1.0,
    'forest': 0.8,
    'savanna': 0.9,
    'shrubland': 0.7,
    'taiga': 0.6,
    'tropical-forest': 0.5,
    'swamp': 0.3,
    'desert': 0.4,
    'tundra': 0.3,
    'ice': 0.0,
    'mountain': 0.2,
    'ocean': 0.0
};

// Resource potential by biome
export const BIOME_RESOURCES: Record<string, Record<string, number>> = {
    'grassland': { food: 1.0, wood: 0.3, stone: 0.2 },
    'forest': { wood: 1.0, food: 0.5, stone: 0.3 },
    'savanna': { food: 0.8, wood: 0.2, stone: 0.3 },
    'shrubland': { food: 0.4, wood: 0.5, stone: 0.4 },
    'taiga': { wood: 0.9, food: 0.3, ore: 0.4 },
    'tropical-forest': { wood: 1.0, food: 0.7, stone: 0.2 },
    'swamp': { food: 0.3, herbs: 0.8, wood: 0.4 },
    'desert': { stone: 0.6, ore: 0.5, gems: 0.3 },
    'tundra': { ore: 0.6, stone: 0.5 },
    'mountain': { ore: 1.0, stone: 1.0, gems: 0.6 },
    'ocean': {},
    'ice': {}
};

// POI types by biome with weights
export const BIOME_POI_WEIGHTS: Record<string, Array<{ kind: POI['kind']; weight: number; danger: number }>> = {
    'desert': [
        { kind: 'ruins', weight: 0.4, danger: 0.3 },
        { kind: 'shrine', weight: 0.3, danger: 0.1 },
        { kind: 'cave', weight: 0.3, danger: 0.5 }
    ],
    'forest': [
        { kind: 'den', weight: 0.4, danger: 0.6 },
        { kind: 'grove', weight: 0.3, danger: 0.1 },
        { kind: 'ruins', weight: 0.3, danger: 0.4 }
    ],
    'mountain': [
        { kind: 'mine', weight: 0.4, danger: 0.3 },
        { kind: 'watchtower', weight: 0.3, danger: 0.2 },
        { kind: 'cave', weight: 0.3, danger: 0.7 }
    ],
    'swamp': [
        { kind: 'temple', weight: 0.4, danger: 0.5 },
        { kind: 'ruins', weight: 0.3, danger: 0.6 },
        { kind: 'den', weight: 0.3, danger: 0.7 }
    ],
    'grassland': [
        { kind: 'ruins', weight: 0.5, danger: 0.3 },
        { kind: 'shrine', weight: 0.3, danger: 0.1 },
        { kind: 'den', weight: 0.2, danger: 0.4 }
    ],
    'taiga': [
        { kind: 'den', weight: 0.5, danger: 0.5 },
        { kind: 'shrine', weight: 0.3, danger: 0.1 },
        { kind: 'cave', weight: 0.2, danger: 0.6 }
    ],
    'tropical-forest': [
        { kind: 'temple', weight: 0.4, danger: 0.4 },
        { kind: 'den', weight: 0.3, danger: 0.7 },
        { kind: 'ruins', weight: 0.3, danger: 0.5 }
    ],
    'savanna': [
        { kind: 'den', weight: 0.5, danger: 0.6 },
        { kind: 'ruins', weight: 0.3, danger: 0.3 },
        { kind: 'shrine', weight: 0.2, danger: 0.1 }
    ],
    'shrubland': [
        { kind: 'ruins', weight: 0.4, danger: 0.3 },
        { kind: 'den', weight: 0.4, danger: 0.5 },
        { kind: 'cave', weight: 0.2, danger: 0.4 }
    ],
    'tundra': [
        { kind: 'shrine', weight: 0.5, danger: 0.2 },
        { kind: 'cave', weight: 0.3, danger: 0.6 },
        { kind: 'ruins', weight: 0.2, danger: 0.4 }
    ]
};
