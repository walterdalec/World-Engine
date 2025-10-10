/**
 * Fort & POI Placement + Simple Regions
 * Canvas 07 - Strategic locations and region ownership
 */

import type { TileData } from '../roads/types';
import type { Settlement, POI, Region, PlacementKnobs } from './types';
import { BIOME_POI_WEIGHTS, BIOME_RESOURCES } from './types';

/**
 * Generate forts at strategic locations.
 * Simplified - full chokepoint integration to be added.
 */
export function generateForts(
    worldWidth: number,
    worldHeight: number,
    getTile: (_x: number, _y: number) => TileData | undefined,
    capitals: Settlement[],
    towns: Settlement[],
    knobs: PlacementKnobs,
    rng: { nextFloat: () => number; nextInt: (_min: number, _max: number) => number }
): Settlement[] {
    console.log('🏰 Generating forts...');
    
    const forts: Settlement[] = [];
    const allSettlements = [...capitals, ...towns];
    
    // Place forts between capitals and on high ground
    for (let i = 0; i < knobs.targetForts; i++) {
        const fort = placeFort(
            worldWidth,
            worldHeight,
            getTile,
            allSettlements,
            forts,
            knobs,
            rng
        );
        
        if (fort) {
            forts.push(fort);
        }
    }
    
    console.log(`✅ Placed ${forts.length} forts`);
    
    return forts;
}

function placeFort(
    worldWidth: number,
    worldHeight: number,
    getTile: (_x: number, _y: number) => TileData | undefined,
    settlements: Settlement[],
    existingForts: Settlement[],
    knobs: PlacementKnobs,
    rng: { nextFloat: () => number; nextInt: (_min: number, _max: number) => number }
): Settlement | null {
    const maxAttempts = 100;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const x = rng.nextInt(0, worldWidth - 1);
        const y = rng.nextInt(0, worldHeight - 1);
        
        const tile = getTile(x, y);
        if (!tile) continue;
        
        // Prefer mountains and high ground
        if (tile.biomeId === 'ocean' || tile.biomeId === 'ice') continue;
        if (tile.elevation < 0.4) continue;
        
        // Check distance to existing forts
        const tooClose = existingForts.some(fort => {
            const dx = fort.pos.x - x;
            const dy = fort.pos.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist < knobs.minFortSpacing;
        });
        
        if (tooClose) continue;
        
        // Check distance to settlements (not too close)
        const nearSettlement = settlements.some(s => {
            const dx = s.pos.x - x;
            const dy = s.pos.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist < knobs.minSettlementSpacing;
        });
        
        if (nearSettlement) continue;
        
        return {
            id: `fort_${x}_${y}`,
            kind: 'fort',
            pos: { x, y },
            name: `Fort ${generateFortName(rng)}`,
            population: Math.floor(50 + rng.nextInt(0, 200))
        };
    }
    
    return null;
}

function generateFortName(rng: { nextInt: (_min: number, _max: number) => number }): string {
    const names = [
        'Eagle', 'Lion', 'Bear', 'Wolf', 'Dragon', 'Hawk',
        'Storm', 'Thunder', 'Iron', 'Steel', 'Stone', 'Granite',
        'Shadow', 'Flame', 'Frost', 'Wind', 'Mountain', 'Valley'
    ];
    return names[rng.nextInt(0, names.length - 1)];
}

/**
 * Generate POIs scattered across the world.
 */
export function generatePOIs(
    worldWidth: number,
    worldHeight: number,
    getTile: (_x: number, _y: number) => TileData | undefined,
    knobs: PlacementKnobs,
    rng: { nextFloat: () => number; nextInt: (_min: number, _max: number) => number }
): POI[] {
    console.log('🗺️ Generating POIs...');
    
    const pois: POI[] = [];
    const totalTiles = worldWidth * worldHeight;
    const targetPOIs = Math.floor((totalTiles / 1000) * knobs.poiDensity);
    const mutualExclusionRadius = 10;
    
    for (let i = 0; i < targetPOIs; i++) {
        const poi = placePOI(
            worldWidth,
            worldHeight,
            getTile,
            pois,
            mutualExclusionRadius,
            rng
        );
        
        if (poi) {
            pois.push(poi);
        }
    }
    
    console.log(`✅ Generated ${pois.length} POIs`);
    
    return pois;
}

function placePOI(
    worldWidth: number,
    worldHeight: number,
    getTile: (_x: number, _y: number) => TileData | undefined,
    existingPOIs: POI[],
    exclusionRadius: number,
    rng: { nextFloat: () => number; nextInt: (_min: number, _max: number) => number }
): POI | null {
    const maxAttempts = 50;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const x = rng.nextInt(0, worldWidth - 1);
        const y = rng.nextInt(0, worldHeight - 1);
        
        const tile = getTile(x, y);
        if (!tile || tile.biomeId === 'ocean' || tile.biomeId === 'ice') continue;
        
        // Check exclusion radius
        const tooClose = existingPOIs.some(poi => {
            const dx = poi.pos.x - x;
            const dy = poi.pos.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist < exclusionRadius;
        });
        
        if (tooClose) continue;
        
        // Select POI type based on biome
        const biomeWeights = BIOME_POI_WEIGHTS[tile.biomeId];
        if (!biomeWeights || biomeWeights.length === 0) continue;
        
        const roll = rng.nextFloat();
        let cumulative = 0;
        let selected = biomeWeights[0];
        
        for (const option of biomeWeights) {
            cumulative += option.weight;
            if (roll <= cumulative) {
                selected = option;
                break;
            }
        }
        
        return {
            id: `poi_${x}_${y}`,
            kind: selected.kind,
            pos: { x, y },
            name: generatePOIName(selected.kind, rng),
            biome: tile.biomeId,
            danger: selected.danger,
            discovered: false
        };
    }
    
    return null;
}

function generatePOIName(
    kind: POI['kind'],
    rng: { nextInt: (_min: number, _max: number) => number }
): string {
    const templates: Record<POI['kind'], string[]> = {
        'ruins': ['Ancient Ruins', 'Forgotten Temple', 'Lost City', 'Crumbling Fort'],
        'den': ['Beast Den', 'Monster Lair', 'Dark Cave', 'Predator\'s Nest'],
        'mine': ['Abandoned Mine', 'Deep Shaft', 'Ore Vein', 'Crystal Cave'],
        'shrine': ['Holy Shrine', 'Sacred Grove', 'Spirit Circle', 'Ancient Altar'],
        'cave': ['Dark Cave', 'Hidden Grotto', 'Deep Cavern', 'Echoing Hollow'],
        'grove': ['Sacred Grove', 'Ancient Trees', 'Mystic Glade', 'Elder Forest'],
        'temple': ['Ruined Temple', 'Dark Shrine', 'Forgotten Sanctuary', 'Old Chapel'],
        'watchtower': ['Old Watchtower', 'Signal Tower', 'Border Post', 'Guard Station']
    };
    
    const names = templates[kind] || ['Unknown Location'];
    return names[rng.nextInt(0, names.length - 1)];
}

/**
 * Create simple regions using Voronoi-like partitioning.
 * Simplified - full Lloyd relaxation and ownership to be added.
 */
export function generateRegions(
    worldWidth: number,
    worldHeight: number,
    getTile: (_x: number, _y: number) => TileData | undefined,
    settlements: Settlement[]
): Record<string, Region> {
    console.log('🗺️ Generating regions...');
    
    const regions: Record<string, Region> = {};
    
    // Create simple regions around each capital and major town
    const majorSettlements = settlements.filter(s => s.kind === 'capital' || (s.kind === 'town' && (s.marketTier || 1) >= 2));
    
    for (const settlement of majorSettlements) {
        const regionId = `region_${settlement.id}`;
        
        // Sample tiles in radius around settlement
        const radius = settlement.kind === 'capital' ? 50 : 30;
        const biomeMix: Record<string, number> = {};
        const resources: Record<string, number> = {};
        let tileCount = 0;
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > radius) continue;
                
                const x = settlement.pos.x + dx;
                const y = settlement.pos.y + dy;
                
                if (x < 0 || x >= worldWidth || y < 0 || y >= worldHeight) continue;
                
                const tile = getTile(x, y);
                if (!tile) continue;
                
                tileCount++;
                biomeMix[tile.biomeId] = (biomeMix[tile.biomeId] || 0) + 1;
                
                // Add resources from biome
                const biomeResources = BIOME_RESOURCES[tile.biomeId] || {};
                for (const [resource, amount] of Object.entries(biomeResources)) {
                    resources[resource] = (resources[resource] || 0) + amount;
                }
            }
        }
        
        // Normalize biome mix
        for (const biome in biomeMix) {
            biomeMix[biome] /= tileCount;
        }
        
        // Calculate tier
        const tier = calculateRegionTier(biomeMix, resources, settlement.kind);
        
        regions[regionId] = {
            id: regionId,
            center: settlement.pos,
            settlements: [settlement.id],
            area: tileCount,
            biomeMix,
            resources,
            tier,
            owner: null  // Ownership to be assigned later
        };
    }
    
    console.log(`✅ Generated ${Object.keys(regions).length} regions`);
    
    return regions;
}

function calculateRegionTier(
    biomeMix: Record<string, number>,
    resources: Record<string, number>,
    settlementKind: Settlement['kind']
): 1 | 2 | 3 | 4 {
    let score = 0;
    
    // Base score from settlement kind
    if (settlementKind === 'capital') score += 2;
    else if (settlementKind === 'town') score += 1;
    
    // Biome quality
    const goodBiomes = ['grassland', 'forest', 'savanna'];
    for (const [biome, fraction] of Object.entries(biomeMix)) {
        if (goodBiomes.includes(biome)) {
            score += fraction * 1.5;
        }
    }
    
    // Resource availability
    const totalResources = Object.values(resources).reduce((sum, val) => sum + val, 0);
    score += Math.min(1.5, totalResources / 10);
    
    // Clamp to 1-4
    const tier = Math.max(1, Math.min(4, Math.round(score)));
    return tier as 1 | 2 | 3 | 4;
}
