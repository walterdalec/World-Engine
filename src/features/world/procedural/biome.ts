/**
 * Biome Classification and Tile Mapping
 * TODO #11 — Overworld Procedural Generation
 * 
 * Converts height, moisture, and temperature values into specific biomes
 * and determines tile types for rendering and gameplay.
 */

export type Tile =
    | 'water' | 'shallows' | 'sand' | 'grass' | 'forest' | 'rock'
    | 'snow' | 'swamp' | 'desert' | 'tundra' | 'road' | 'town'
    | 'ruin' | 'shrine' | 'mine' | 'crystal';

export interface BiomeRule {
    id: string;
    name: string;
    height: [number, number];    // Min/max height range
    temp: [number, number];      // Min/max temperature range  
    moisture: [number, number];  // Min/max moisture range
    baseTile: Tile;
    overlays?: BiomeOverlay[];
    color: string;               // Debug/minimap color
    movementCost: number;        // Base movement cost
    defensiveBonus: number;      // Combat defensive modifier
}

export interface BiomeOverlay {
    tile: Tile;
    chance: number;              // 0-1 probability
    minSpacing?: number;         // Minimum distance between overlays
}

/**
 * Comprehensive biome classification table
 * Based on height, temperature, and moisture combinations
 */
export const BIOME_RULES: BiomeRule[] = [
    // Water biomes
    {
        id: 'deep_ocean',
        name: 'Deep Ocean',
        height: [0.0, 0.25],
        temp: [0.0, 1.0],
        moisture: [0.0, 1.0],
        baseTile: 'water',
        color: '#0066cc',
        movementCost: 99, // Impassable by land units
        defensiveBonus: 0
    },
    {
        id: 'shallow_ocean',
        name: 'Shallow Ocean',
        height: [0.25, 0.28],
        temp: [0.0, 1.0],
        moisture: [0.0, 1.0],
        baseTile: 'shallows',
        color: '#3399ff',
        movementCost: 3,
        defensiveBonus: -0.1
    },

    // Coastal biomes
    {
        id: 'beach',
        name: 'Beach',
        height: [0.28, 0.32],
        temp: [0.2, 1.0],
        moisture: [0.0, 0.6],
        baseTile: 'sand',
        color: '#ffeb9c',
        movementCost: 1.2,
        defensiveBonus: -0.2
    },

    // Plains and grasslands
    {
        id: 'plains',
        name: 'Plains',
        height: [0.32, 0.55],
        temp: [0.3, 0.8],
        moisture: [0.2, 0.7],
        baseTile: 'grass',
        overlays: [
            { tile: 'forest', chance: 0.1, minSpacing: 5 }
        ],
        color: '#90ee90',
        movementCost: 1.0,
        defensiveBonus: 0.0
    },
    {
        id: 'steppe',
        name: 'Steppe',
        height: [0.32, 0.50],
        temp: [0.2, 0.7],
        moisture: [0.0, 0.3],
        baseTile: 'grass',
        color: '#daa520',
        movementCost: 1.0,
        defensiveBonus: 0.0
    },

    // Forests
    {
        id: 'temperate_forest',
        name: 'Temperate Forest',
        height: [0.35, 0.70],
        temp: [0.3, 0.7],
        moisture: [0.5, 0.9],
        baseTile: 'forest',
        color: '#228b22',
        movementCost: 1.5,
        defensiveBonus: 0.2
    },
    {
        id: 'boreal_forest',
        name: 'Boreal Forest',
        height: [0.35, 0.65],
        temp: [0.1, 0.4],
        moisture: [0.4, 0.8],
        baseTile: 'forest',
        color: '#006400',
        movementCost: 1.8,
        defensiveBonus: 0.3
    },

    // Wetlands
    {
        id: 'swamp',
        name: 'Swamp',
        height: [0.28, 0.45],
        temp: [0.4, 0.9],
        moisture: [0.8, 1.0],
        baseTile: 'swamp',
        color: '#556b2f',
        movementCost: 2.5,
        defensiveBonus: -0.1
    },

    // Deserts
    {
        id: 'hot_desert',
        name: 'Hot Desert',
        height: [0.32, 0.60],
        temp: [0.7, 1.0],
        moisture: [0.0, 0.2],
        baseTile: 'desert',
        color: '#f4a460',
        movementCost: 1.8,
        defensiveBonus: -0.1
    },
    {
        id: 'cold_desert',
        name: 'Cold Desert',
        height: [0.40, 0.65],
        temp: [0.0, 0.3],
        moisture: [0.0, 0.2],
        baseTile: 'tundra',
        color: '#d2b48c',
        movementCost: 1.6,
        defensiveBonus: 0.0
    },

    // Mountains
    {
        id: 'foothills',
        name: 'Foothills',
        height: [0.55, 0.70],
        temp: [0.2, 0.8],
        moisture: [0.0, 1.0],
        baseTile: 'rock',
        overlays: [
            { tile: 'forest', chance: 0.3, minSpacing: 3 }
        ],
        color: '#708090',
        movementCost: 2.0,
        defensiveBonus: 0.3
    },
    {
        id: 'mountains',
        name: 'Mountains',
        height: [0.70, 0.85],
        temp: [0.0, 0.6],
        moisture: [0.0, 1.0],
        baseTile: 'rock',
        color: '#696969',
        movementCost: 3.0,
        defensiveBonus: 0.5
    },
    {
        id: 'peaks',
        name: 'High Peaks',
        height: [0.85, 1.0],
        temp: [0.0, 0.4],
        moisture: [0.0, 1.0],
        baseTile: 'snow',
        color: '#fffafa',
        movementCost: 5.0,
        defensiveBonus: 0.4
    },

    // Tundra
    {
        id: 'tundra',
        name: 'Tundra',
        height: [0.32, 0.55],
        temp: [0.0, 0.2],
        moisture: [0.2, 0.8],
        baseTile: 'tundra',
        color: '#e0e0e0',
        movementCost: 1.4,
        defensiveBonus: 0.1
    }
];

/**
 * Choose the best biome rule for given environmental conditions
 */
export function chooseBiome(
    height: number,
    temperature: number,
    moisture: number
): BiomeRule {
    // Normalize inputs to 0-1 range
    const h = Math.max(0, Math.min(1, (height + 1) / 2)); // noise is -1 to 1
    const t = Math.max(0, Math.min(1, (temperature + 1) / 2));
    const m = Math.max(0, Math.min(1, (moisture + 1) / 2));

    // Find all matching biomes
    const candidates = BIOME_RULES.filter(rule =>
        h >= rule.height[0] && h <= rule.height[1] &&
        t >= rule.temp[0] && t <= rule.temp[1] &&
        m >= rule.moisture[0] && m <= rule.moisture[1]
    );

    if (candidates.length === 0) {
        // Fallback to plains if no match
        return BIOME_RULES.find(rule => rule.id === 'plains')!;
    }

    if (candidates.length === 1) {
        return candidates[0];
    }

    // If multiple matches, choose the most specific (smallest range)
    return candidates.reduce((best, current) => {
        const bestSpecificity = getRuleSpecificity(best);
        const currentSpecificity = getRuleSpecificity(current);
        return currentSpecificity > bestSpecificity ? current : best;
    });
}

/**
 * Calculate how specific a biome rule is (smaller ranges = more specific)
 */
function getRuleSpecificity(rule: BiomeRule): number {
    const heightRange = rule.height[1] - rule.height[0];
    const tempRange = rule.temp[1] - rule.temp[0];
    const moistRange = rule.moisture[1] - rule.moisture[0];

    // Higher specificity = smaller total range
    return 1 / (heightRange + tempRange + moistRange);
}

/**
 * Determine the final tile type including overlays
 */
export function chooseTile(
    height: number,
    temperature: number,
    moisture: number,
    rng: { next(): number }
): { tile: Tile; biome: BiomeRule } {
    const biome = chooseBiome(height, temperature, moisture);
    let finalTile = biome.baseTile;

    // Check for overlays
    if (biome.overlays) {
        for (const overlay of biome.overlays) {
            if (rng.next() < overlay.chance) {
                finalTile = overlay.tile;
                break; // First overlay wins
            }
        }
    }

    return { tile: finalTile, biome };
}

/**
 * Get biome by ID for lookup operations
 */
export function getBiomeById(id: string): BiomeRule | undefined {
    return BIOME_RULES.find(rule => rule.id === id);
}

/**
 * Get all biomes of a certain type
 */
export function getBiomesByType(tileType: Tile): BiomeRule[] {
    return BIOME_RULES.filter(rule => rule.baseTile === tileType);
}

/**
 * Calculate environmental factors for gameplay
 */
export interface EnvironmentalEffects {
    movementCost: number;
    defensiveBonus: number;
    temperature: 'freezing' | 'cold' | 'temperate' | 'warm' | 'hot';
    moisture: 'arid' | 'dry' | 'normal' | 'humid' | 'wet';
    visibility: number;  // 0-1, affected by terrain
}

export function getEnvironmentalEffects(
    biome: BiomeRule,
    temperature: number,
    moisture: number
): EnvironmentalEffects {
    // Temperature categories
    let tempCategory: EnvironmentalEffects['temperature'];
    if (temperature < -0.6) tempCategory = 'freezing';
    else if (temperature < -0.2) tempCategory = 'cold';
    else if (temperature < 0.2) tempCategory = 'temperate';
    else if (temperature < 0.6) tempCategory = 'warm';
    else tempCategory = 'hot';

    // Moisture categories
    let moistCategory: EnvironmentalEffects['moisture'];
    if (moisture < -0.6) moistCategory = 'arid';
    else if (moisture < -0.2) moistCategory = 'dry';
    else if (moisture < 0.2) moistCategory = 'normal';
    else if (moisture < 0.6) moistCategory = 'humid';
    else moistCategory = 'wet';

    // Visibility based on terrain
    let visibility = 1.0;
    if (biome.baseTile === 'forest') visibility = 0.6;
    else if (biome.baseTile === 'swamp') visibility = 0.5;
    else if (biome.baseTile === 'desert') visibility = 0.9; // Heat haze

    return {
        movementCost: biome.movementCost,
        defensiveBonus: biome.defensiveBonus,
        temperature: tempCategory,
        moisture: moistCategory,
        visibility
    };
}