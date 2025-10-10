/**
 * Cost Atlas Builder
 * Canvas 06 - Computes movement costs for road pathfinding
 */

import type { TileData, CostAtlas, CostWeights, BuildRoadsInput } from './types';
import { DEFAULT_COST_WEIGHTS, BIOME_COSTS } from './types';

/**
 * Build cost atlas for the entire world
 * Precomputes C(x,y) for all tiles
 */
export function buildCostAtlas(input: BuildRoadsInput, weights: CostWeights = DEFAULT_COST_WEIGHTS): CostAtlas {
    console.log(`🛣️ Building cost atlas for ${input.worldWidth}×${input.worldHeight} world...`);
    
    const { worldWidth, worldHeight, getTile } = input;
    const costs = new Float32Array(worldWidth * worldHeight);
    
    // Compute cost for each tile
    for (let y = 0; y < worldHeight; y++) {
        for (let x = 0; x < worldWidth; x++) {
            const idx = y * worldWidth + x;
            costs[idx] = calculateTileCost(x, y, getTile, weights);
        }
    }
    
    console.log(`✅ Cost atlas built (${costs.length.toLocaleString()} tiles)`);
    
    return {
        width: worldWidth,
        height: worldHeight,
        costs
    };
}

/**
 * Calculate movement cost for a single tile
 */
function calculateTileCost(
    x: number,
    y: number,
    getTile: (_x: number, _y: number) => TileData | undefined,
    weights: CostWeights
): number {
    const tile = getTile(x, y);
    if (!tile) return Infinity;
    
    let cost = 0;
    
    // Biome base cost
    const biomeCost = BIOME_COSTS[tile.biomeId] || 5;
    cost += weights.w_biome * biomeCost;
    
    // Roughness penalty
    cost += weights.w_rough * tile.roughness * 10;
    
    // Slope penalty (calculate from neighbors)
    const slope = calculateSlope(x, y, getTile);
    const slopeMax = 0.5; // Maximum slope before impassable
    const slopeFactor = Math.min(1, slope / slopeMax);
    cost += weights.w_slope * (slopeFactor * slopeFactor);
    
    // River crossing penalty
    if (tile.river) {
        cost += weights.w_river * (tile.riverWidth || 1);
    }
    
    // Marsh/swamp extra penalty
    if (tile.biomeId === 'swamp') {
        cost += weights.w_marsh * tile.moisture;
    }
    
    // Danger field (placeholder for Canvas 16)
    // cost += weights.w_danger * dangerField(x, y);
    
    return Math.max(1, cost);
}

/**
 * Calculate slope at a tile from elevation gradient
 */
function calculateSlope(
    x: number,
    y: number,
    getTile: (_x: number, _y: number) => TileData | undefined
): number {
    const center = getTile(x, y);
    if (!center) return 0;
    
    let maxGradient = 0;
    
    // Check 8 neighbors
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const neighbor = getTile(x + dx, y + dy);
            if (!neighbor) continue;
            
            const elevDiff = Math.abs(neighbor.elevation - center.elevation);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const gradient = elevDiff / distance;
            
            maxGradient = Math.max(maxGradient, gradient);
        }
    }
    
    return maxGradient;
}

/**
 * Get cost for a specific tile from atlas
 */
export function getCost(atlas: CostAtlas, x: number, y: number): number {
    if (x < 0 || x >= atlas.width || y < 0 || y >= atlas.height) {
        return Infinity;
    }
    return atlas.costs[y * atlas.width + x];
}

/**
 * Calculate octile distance (8-way movement heuristic)
 */
export function octileDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); // sqrt(2) - 1 ≈ 0.414
}

/**
 * Sample costs along a straight line between two points
 * Used for MST edge weighting
 */
export function sampleLineCost(
    atlas: CostAtlas,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    samples: number = 20
): number {
    let totalCost = 0;
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const x = Math.round(x1 + dx * t);
        const y = Math.round(y1 + dy * t);
        totalCost += getCost(atlas, x, y);
    }
    
    return totalCost / (samples + 1);
}
