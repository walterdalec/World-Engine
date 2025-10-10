/**
 * Suitability Scoring for Settlement Placement
 * Canvas 07 - Evaluates terrain for settlement viability
 */

import type { TileData } from '../roads/types';
import type { SuitabilityWeights } from './types';
import { BIOME_SUITABILITY, BIOME_RESOURCES, DEFAULT_SUITABILITY_WEIGHTS } from './types';

/**
 * Calculate suitability score for a potential settlement location.
 * 
 * S = wb*biomeScore + ww*waterProximity + wr*resourcePotential - ws*slopePenalty
 * 
 * @param x Tile X coordinate
 * @param y Tile Y coordinate
 * @param getTile Function to retrieve tile data
 * @param weights Suitability weights
 * @returns Suitability score (0-1, higher is better) or -Infinity if invalid
 */
export function calculateSuitability(
    x: number,
    y: number,
    getTile: (_x: number, _y: number) => TileData | undefined,
    weights: SuitabilityWeights = DEFAULT_SUITABILITY_WEIGHTS
): number {
    const tile = getTile(x, y);
    if (!tile) return -Infinity;

    // Check if location is valid
    if (tile.biomeId === 'ocean' || tile.biomeId === 'ice') {
        return -Infinity;
    }

    // Biome score
    const biomeScore = BIOME_SUITABILITY[tile.biomeId] || 0.5;

    // Water proximity (prefer near rivers/coasts but not floodplains)
    const waterProximity = calculateWaterProximity(x, y, getTile, tile);

    // Resource potential
    const resourcePotential = calculateResourcePotential(tile);

    // Slope penalty
    const slopePenalty = calculateSlopePenalty(x, y, getTile, tile);

    // Combined score
    const score =
        weights.wb * biomeScore +
        weights.ww * waterProximity +
        weights.wr * resourcePotential -
        weights.ws * slopePenalty;

    return Math.max(0, Math.min(1, score));
}

/**
 * Calculate water proximity score.
 * Prefers locations near water but not in floodplains.
 */
function calculateWaterProximity(
    x: number,
    y: number,
    getTile: (_x: number, _y: number) => TileData | undefined,
    tile: TileData
): number {
    // Check for river on tile
    if (tile.river) {
        // Check elevation to avoid floodplains
        if (tile.elevation < 0.1) {
            return -0.5; // Floodplain penalty
        }
        return 1.0; // River access is valuable
    }

    // Check nearby tiles for water
    let nearbyWater = 0;
    let oceanAdjacent = false;

    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
            if (dx === 0 && dy === 0) continue;

            const neighbor = getTile(x + dx, y + dy);
            if (!neighbor) continue;

            const distance = Math.sqrt(dx * dx + dy * dy);

            if (neighbor.biomeId === 'ocean') {
                if (distance <= 1.5) oceanAdjacent = true;
                nearbyWater += (1.0 / distance) * 0.3;
            } else if (neighbor.river) {
                nearbyWater += (1.0 / distance) * 0.5;
            }
        }
    }

    // Coastal bonus
    if (oceanAdjacent) {
        return 0.8; // Good for harbors
    }

    return Math.min(1.0, nearbyWater);
}

/**
 * Calculate resource potential from biome and tile properties.
 */
function calculateResourcePotential(tile: TileData): number {
    const biomeResources = BIOME_RESOURCES[tile.biomeId] || {};

    // Sum base resource values
    const resourceSum = Object.values(biomeResources).reduce((sum, val) => sum + val, 0);
    const baseScore = Math.min(1.0, resourceSum / 3.0); // Normalize to 0-1

    // Modifiers from tile properties
    let modifier = 1.0;

    // High moisture can boost food production
    if (tile.moisture > 0.6 && tile.biomeId !== 'swamp') {
        modifier *= 1.2;
    }

    // Low roughness is easier to work with
    if (tile.roughness < 0.3) {
        modifier *= 1.1;
    }

    return Math.min(1.0, baseScore * modifier);
}

/**
 * Calculate slope penalty from elevation changes.
 */
function calculateSlopePenalty(
    x: number,
    y: number,
    getTile: (_x: number, _y: number) => TileData | undefined,
    tile: TileData
): number {
    let maxSlope = 0;

    // Check 8 neighbors for elevation change
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;

            const neighbor = getTile(x + dx, y + dy);
            if (!neighbor) continue;

            const elevDiff = Math.abs(neighbor.elevation - tile.elevation);
            maxSlope = Math.max(maxSlope, elevDiff);
        }
    }

    // Also penalize high absolute elevation
    const elevPenalty = Math.max(0, tile.elevation - 0.6) * 0.5;

    return Math.min(1.0, maxSlope * 2.0 + elevPenalty);
}

/**
 * Create a mask of valid settlement locations.
 * Filters out ocean, ice, extreme elevations, and floodplains.
 */
export function createSettlementMask(
    worldWidth: number,
    worldHeight: number,
    getTile: (_x: number, _y: number) => TileData | undefined,
    elevMaxForCity: number,
    floodRiskMin: number
): boolean[][] {
    const mask: boolean[][] = [];

    for (let y = 0; y < worldHeight; y++) {
        mask[y] = [];
        for (let x = 0; x < worldWidth; x++) {
            const tile = getTile(x, y);

            if (!tile) {
                mask[y][x] = false;
                continue;
            }

            // Invalid biomes
            if (tile.biomeId === 'ocean' || tile.biomeId === 'ice') {
                mask[y][x] = false;
                continue;
            }

            // Too high elevation
            if (tile.elevation > elevMaxForCity) {
                mask[y][x] = false;
                continue;
            }

            // Floodplain risk
            if (tile.river && tile.elevation < floodRiskMin) {
                mask[y][x] = false;
                continue;
            }

            mask[y][x] = true;
        }
    }

    return mask;
}

/**
 * Calculate carrying capacity for a region based on biome mix.
 * Returns population factor (0-1).
 */
export function calculateCarryingCapacity(biomeMix: Record<string, number>): number {
    const popFactors: Record<string, number> = {
        'grassland': 1.0,
        'forest': 0.7,
        'savanna': 0.8,
        'shrubland': 0.5,
        'taiga': 0.4,
        'tropical-forest': 0.6,
        'swamp': 0.3,
        'desert': 0.2,
        'tundra': 0.2,
        'ice': 0.0,
        'mountain': 0.3,
        'ocean': 0.0
    };

    let totalFactor = 0;
    let totalWeight = 0;

    for (const [biome, fraction] of Object.entries(biomeMix)) {
        const factor = popFactors[biome] || 0.5;
        totalFactor += factor * fraction;
        totalWeight += fraction;
    }

    return totalWeight > 0 ? totalFactor / totalWeight : 0;
}
