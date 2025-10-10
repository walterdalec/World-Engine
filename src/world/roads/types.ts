/**
 * Road System Types
 * Canvas 06 - Terrain-aware road network
 */

export interface Vec2 {
    x: number;
    y: number;
}

export interface RoadNode {
    id: string;
    x: number;
    y: number;
    kind: 'junction' | 'bridge' | 'ford' | 'tunnel' | 'settlement';
}

export interface RoadEdge {
    id: string;
    a: string;         // Node ID
    b: string;         // Node ID
    tier: 0 | 1 | 2 | 3;
    length: number;
    flags: number;
    path?: Vec2[];     // Detailed path points
}

export interface RoadGraph {
    nodes: RoadNode[];
    edges: RoadEdge[];
    version: number;
}

export interface Crossing {
    type: 'bridge' | 'ford' | 'tunnel';
    nodeId: string;
    riverId?: string;
    attrs: {
        width?: number;
        slope?: number;
        engineered?: boolean;
    };
}

export interface BuildRoadsInput {
    seed: number;
    worldWidth: number;
    worldHeight: number;
    capitals: Vec2[];  // Settlement positions
    getTile: (_x: number, _y: number) => TileData | undefined;
}

export interface TileData {
    x: number;
    y: number;
    elevation: number;
    moisture: number;
    temperature: number;
    biomeId: string;
    roughness: number;
    river?: boolean;
    riverWidth?: number;
}

export interface CostWeights {
    w_biome: number;
    w_rough: number;
    w_slope: number;
    w_river: number;
    w_marsh: number;
    w_danger: number;
    w_curve: number;
}

export const DEFAULT_COST_WEIGHTS: CostWeights = {
    w_biome: 1.0,
    w_rough: 0.5,
    w_slope: 4.0,
    w_river: 30.0,
    w_marsh: 8.0,
    w_danger: 6.0,
    w_curve: 0.25
};

export const BIOME_COSTS: Record<string, number> = {
    'ocean': 100,           // Nearly impassable
    'ice': 15,
    'tundra': 8,
    'taiga': 5,
    'grassland': 1,         // Easiest
    'forest': 3,
    'swamp': 12,            // Very difficult
    'shrubland': 2,
    'desert': 6,
    'savanna': 2,
    'tropical-forest': 4,
    'mountain': 20          // Very expensive
};

export interface CostAtlas {
    width: number;
    height: number;
    costs: Float32Array;    // width * height
}
