// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/world/encounters/generator.ts
// Purpose: Encounter generation with faction AI integration
// ──────────────────────────────────────────────────────────────────────────────

import type { Encounter, RegionOwner, EncounterBiome } from './types';
import { rollEncounter } from './tables';
import { DEFAULT_WORLD_BOUNDS } from '../../../core/config/worldBounds';

/**
 * Generate a scaled encounter for a specific location
 * 
 * @param seed - World seed
 * @param biome - Biome type
 * @param regionOwner - Region owner information for scaling
 * @param partyLevel - Player party level for difficulty scaling
 * @param position - Hex position (q, r, sectorX, sectorY)
 */
export function generateEncounter(
    seed: number,
    biome: EncounterBiome,
    regionOwner: RegionOwner,
    partyLevel: number,
    position: { q: number; r: number; sectorX: number; sectorY: number },
): Encounter {
    // Create position key for deterministic generation
    const posKey = `${position.sectorX},${position.sectorY},${position.q},${position.r}`;
    
    // Roll base encounter from tables
    const base = rollEncounter(biome, regionOwner.tier || 1, seed, posKey);
    
    // Scale difficulty based on party level
    const difficulty = base.diff + Math.floor((partyLevel - 1) * 0.25);
    
    // Scale XP based on region control (more controlled = better rewards)
    const scaledXP = Math.round(base.xp * (1 + 0.1 * (regionOwner.control || 0)));
    
    // Generate unique encounter ID
    const id = `enc_${position.sectorX}_${position.sectorY}_${position.q}_${position.r}`;
    
    return {
        id,
        type: base.type,
        biome: base.biome,
        difficulty,
        xp: scaledXP,
        region: regionOwner.id,
        faction: regionOwner.factionName,
        position,
        discovered: false,
        completed: false,
        timestamp: Date.now(),
    };
}

/**
 * Filter encounters to exclude world edge locations
 * 
 * @param encounters - List of encounters to filter
 * @param sectorX - Sector X coordinate
 * @param sectorY - Sector Y coordinate
 */
export function filterEncountersForBounds(
    encounters: Encounter[],
    sectorX: number,
    sectorY: number,
): Encounter[] {
    // Check if sector is outside world bounds
    if (
        sectorX < DEFAULT_WORLD_BOUNDS.sxMin ||
        sectorX > DEFAULT_WORLD_BOUNDS.sxMax ||
        sectorY < DEFAULT_WORLD_BOUNDS.syMin ||
        sectorY > DEFAULT_WORLD_BOUNDS.syMax
    ) {
        return []; // No encounters beyond world edge
    }
    
    // Filter encounters on edge tiles
    return encounters.filter(() => {
        // Could add additional filtering logic here
        // e.g., exclude encounters on specific tile types
        return true;
    });
}

/**
 * Sync encounters with AI state for a region
 * 
 * @param regionId - Region ID
 * @param regionOwner - Region ownership information
 * @param biome - Region biome
 * @param tiles - Tile positions in the region
 * @param seed - World seed
 * @param partyLevel - Player party level
 */
export function syncEncounterTableWithAI(
    regionId: string,
    regionOwner: RegionOwner,
    biome: EncounterBiome,
    tiles: Array<{ q: number; r: number; sectorX: number; sectorY: number }>,
    seed: number,
    partyLevel: number,
): Encounter[] {
    const encounters: Encounter[] = [];
    
    // Calculate spawn chance based on conflict level
    const density = regionOwner.conflictLevel > 0.7 ? 'HIGH' 
                  : regionOwner.conflictLevel > 0.3 ? 'MEDIUM' 
                  : 'LOW';
    
    const spawnChance = density === 'HIGH' ? 0.25 
                      : density === 'MEDIUM' ? 0.10 
                      : 0.03;
    
    // Generate encounters based on density
    for (const tile of tiles) {
        const roll = Math.random();
        
        if (roll < spawnChance) {
            const encounter = generateEncounter(
                seed,
                biome,
                regionOwner,
                partyLevel,
                tile,
            );
            encounters.push(encounter);
        }
    }
    
    return encounters;
}

/**
 * Convert game biome to encounter biome
 * Maps detailed game biomes to encounter biome categories
 */
export function mapBiomeToEncounterBiome(gameBiome: string): EncounterBiome {
    const lower = gameBiome.toLowerCase();
    
    if (lower.includes('ocean') || lower.includes('water')) return 'Ocean';
    if (lower.includes('desert') || lower.includes('sand')) return 'Desert';
    if (lower.includes('forest') || lower.includes('jungle')) return 'Forest';
    if (lower.includes('swamp') || lower.includes('marsh')) return 'Swamp';
    if (lower.includes('taiga') || lower.includes('boreal')) return 'Taiga';
    if (lower.includes('snow') || lower.includes('tundra') || lower.includes('ice')) return 'Snow';
    if (lower.includes('mountain') || lower.includes('peak') || lower.includes('hill')) return 'Mountain';
    if (lower.includes('town') || lower.includes('city') || lower.includes('settlement')) return 'Settlement';
    if (lower.includes('void') || lower.includes('edge')) return 'Void';
    
    // Default to grass/plains
    return 'Grass';
}
