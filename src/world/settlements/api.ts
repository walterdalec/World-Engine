/**
 * Settlements & Regions API
 * Canvas 07 - Main entry point for world population
 */

import type { PlacementInput, PlacementOutput, PlacementKnobs } from './types';
import { DEFAULT_PLACEMENT_KNOBS } from './types';
import { generateCapitals } from './capitals';
import { generateTowns } from './towns';
import { generateForts, generatePOIs, generateRegions } from './forts';

/**
 * Simple RNG wrapper for settlement generation.
 */
class SimpleRNG {
    private seed: number;
    
    constructor(seed: number) {
        this.seed = seed;
    }
    
    next(): number {
        // LCG parameters
        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32;
        
        this.seed = (a * this.seed + c) % m;
        return this.seed;
    }
    
    nextFloat(): number {
        return this.next() / (2 ** 32);
    }
    
    nextInt(min: number, max: number): number {
        return Math.floor(min + this.nextFloat() * (max - min + 1));
    }
}

/**
 * Generate all settlements, POIs, and regions for the world.
 * 
 * @param input World parameters and tile access
 * @returns Complete placement data
 */
export function generateSettlementsAndRegions(input: PlacementInput): PlacementOutput {
    console.log('🌍 Generating settlements and regions...');
    const startTime = performance.now();
    
    const knobs: PlacementKnobs = {
        ...DEFAULT_PLACEMENT_KNOBS,
        ...input.knobs
    };
    
    const rng = new SimpleRNG(input.seed);
    
    // Step 1: Capital cities
    const capitals = generateCapitals(
        input.worldWidth,
        input.worldHeight,
        input.getTile,
        knobs,
        rng
    );
    
    // Step 2: Towns
    const towns = generateTowns(
        input.worldWidth,
        input.worldHeight,
        input.getTile,
        capitals,
        knobs,
        rng
    );
    
    // Step 3: Forts
    const forts = generateForts(
        input.worldWidth,
        input.worldHeight,
        input.getTile,
        capitals,
        towns,
        knobs,
        rng
    );
    
    // Step 4: POIs
    const pois = generatePOIs(
        input.worldWidth,
        input.worldHeight,
        input.getTile,
        knobs,
        rng
    );
    
    // Step 5: Regions
    const allSettlements = [...capitals, ...towns, ...forts];
    const regions = generateRegions(
        input.worldWidth,
        input.worldHeight,
        input.getTile,
        allSettlements
    );
    
    // Assign settlements to regions
    for (const settlement of allSettlements) {
        // Find closest region
        let closestRegion: string | null = null;
        let closestDist = Infinity;
        
        for (const [regionId, region] of Object.entries(regions)) {
            const dx = region.center.x - settlement.pos.x;
            const dy = region.center.y - settlement.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < closestDist) {
                closestDist = dist;
                closestRegion = regionId;
            }
        }
        
        if (closestRegion) {
            settlement.regionId = closestRegion;
            if (!regions[closestRegion].settlements.includes(settlement.id)) {
                regions[closestRegion].settlements.push(settlement.id);
            }
        }
    }
    
    const duration = performance.now() - startTime;
    console.log(`✅ Settlement generation complete in ${(duration / 1000).toFixed(2)}s`, {
        capitals: capitals.length,
        towns: towns.length,
        forts: forts.length,
        pois: pois.length,
        regions: Object.keys(regions).length
    });
    
    return {
        settlements: allSettlements,
        regions,
        pois
    };
}

// Re-export types
export type {
    Settlement,
    Region,
    POI,
    PlacementInput,
    PlacementOutput,
    PlacementKnobs
} from './types';

export { DEFAULT_PLACEMENT_KNOBS } from './types';
