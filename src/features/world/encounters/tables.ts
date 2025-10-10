// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/world/encounters/tables.ts
// Purpose: Encounter generation tables and rolling logic
// ──────────────────────────────────────────────────────────────────────────────

import type { EncounterBase, EncounterType } from './types';
import { splitmix32 } from '../procedural/rng';

/**
 * Biome types for encounters (subset of game biomes)
 */
export type EncounterBiome = 
    | 'Grass' | 'Forest' | 'Desert' | 'Swamp' 
    | 'Taiga' | 'Snow' | 'Settlement' | 'Mountain' 
    | 'Ocean' | 'Void';

/**
 * Encounter weights by biome
 */
const BIOME_ENCOUNTER_WEIGHTS: Record<EncounterBiome, Record<EncounterType, number>> = {
    Grass: {
        RAID_PARTY: 15,
        SCOUT_PATROL: 20,
        WANDERER: 25,
        MONSTER: 10,
        BANDIT: 15,
        MERCHANT: 10,
        QUEST_GIVER: 3,
        TREASURE: 1,
        AMBUSH: 1,
    },
    Forest: {
        RAID_PARTY: 10,
        SCOUT_PATROL: 15,
        WANDERER: 20,
        MONSTER: 20,
        BANDIT: 10,
        MERCHANT: 5,
        QUEST_GIVER: 2,
        TREASURE: 3,
        AMBUSH: 15,
    },
    Desert: {
        RAID_PARTY: 20,
        SCOUT_PATROL: 10,
        WANDERER: 15,
        MONSTER: 15,
        BANDIT: 25,
        MERCHANT: 8,
        QUEST_GIVER: 2,
        TREASURE: 4,
        AMBUSH: 1,
    },
    Swamp: {
        RAID_PARTY: 5,
        SCOUT_PATROL: 5,
        WANDERER: 10,
        MONSTER: 40,
        BANDIT: 5,
        MERCHANT: 2,
        QUEST_GIVER: 1,
        TREASURE: 5,
        AMBUSH: 27,
    },
    Taiga: {
        RAID_PARTY: 12,
        SCOUT_PATROL: 18,
        WANDERER: 20,
        MONSTER: 25,
        BANDIT: 8,
        MERCHANT: 3,
        QUEST_GIVER: 2,
        TREASURE: 2,
        AMBUSH: 10,
    },
    Snow: {
        RAID_PARTY: 10,
        SCOUT_PATROL: 15,
        WANDERER: 15,
        MONSTER: 30,
        BANDIT: 5,
        MERCHANT: 2,
        QUEST_GIVER: 1,
        TREASURE: 2,
        AMBUSH: 20,
    },
    Settlement: {
        RAID_PARTY: 5,
        SCOUT_PATROL: 10,
        WANDERER: 35,
        MONSTER: 2,
        BANDIT: 3,
        MERCHANT: 30,
        QUEST_GIVER: 10,
        TREASURE: 3,
        AMBUSH: 2,
    },
    Mountain: {
        RAID_PARTY: 8,
        SCOUT_PATROL: 12,
        WANDERER: 10,
        MONSTER: 35,
        BANDIT: 10,
        MERCHANT: 2,
        QUEST_GIVER: 2,
        TREASURE: 15,
        AMBUSH: 6,
    },
    Ocean: {
        RAID_PARTY: 5,
        SCOUT_PATROL: 5,
        WANDERER: 10,
        MONSTER: 50,
        BANDIT: 15,
        MERCHANT: 5,
        QUEST_GIVER: 1,
        TREASURE: 8,
        AMBUSH: 1,
    },
    Void: {
        RAID_PARTY: 0,
        SCOUT_PATROL: 0,
        WANDERER: 0,
        MONSTER: 0,
        BANDIT: 0,
        MERCHANT: 0,
        QUEST_GIVER: 0,
        TREASURE: 0,
        AMBUSH: 0,
    },
};

/**
 * Base difficulty and XP by encounter type
 */
const BASE_ENCOUNTER_STATS: Record<EncounterType, { diff: number; xp: number }> = {
    RAID_PARTY: { diff: 6, xp: 150 },
    SCOUT_PATROL: { diff: 4, xp: 80 },
    WANDERER: { diff: 2, xp: 30 },
    MONSTER: { diff: 5, xp: 100 },
    BANDIT: { diff: 4, xp: 70 },
    MERCHANT: { diff: 1, xp: 20 },
    QUEST_GIVER: { diff: 1, xp: 10 },
    TREASURE: { diff: 3, xp: 50 },
    AMBUSH: { diff: 7, xp: 120 },
};

/**
 * Roll an encounter for a given biome and tier
 * 
 * @param biome - Biome type
 * @param tier - Region tier (1-5)
 * @param seed - Random seed
 * @param posKey - Position key for deterministic rolls
 */
export function rollEncounter(
    biome: EncounterBiome,
    tier: number,
    seed: number,
    posKey: string,
): EncounterBase {
    // Void biome has no encounters
    if (biome === 'Void') {
        return { type: 'WANDERER', diff: 1, xp: 0, biome };
    }

    // Create deterministic RNG from seed and position
    const combinedSeed = seed ^ hashString(posKey);
    const rng = splitmix32(combinedSeed);

    // Get weights for this biome
    const weights = BIOME_ENCOUNTER_WEIGHTS[biome];
    const entries = Object.entries(weights) as [EncounterType, number][];
    
    // Calculate total weight
    const totalWeight = entries.reduce((sum, [_, weight]) => sum + weight, 0);
    
    // Roll
    const roll = rng.next() * totalWeight;
    let cumulative = 0;
    
    for (const [type, weight] of entries) {
        cumulative += weight;
        if (roll < cumulative) {
            const stats = BASE_ENCOUNTER_STATS[type];
            return {
                type,
                diff: stats.diff + (tier - 1),
                xp: Math.round(stats.xp * (1 + (tier - 1) * 0.2)),
                biome,
            };
        }
    }
    
    // Fallback
    return { type: 'WANDERER', diff: 2, xp: 30, biome };
}

/**
 * Simple string hash function for deterministic seeding
 */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

/**
 * Calculate encounter density based on conflict level
 */
export function getEncounterDensity(conflictLevel: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (conflictLevel > 0.7) return 'HIGH';
    if (conflictLevel > 0.3) return 'MEDIUM';
    return 'LOW';
}

/**
 * Get encounter spawn chance based on density
 */
export function getSpawnChance(density: 'LOW' | 'MEDIUM' | 'HIGH'): number {
    switch (density) {
        case 'HIGH': return 0.25;
        case 'MEDIUM': return 0.10;
        case 'LOW': return 0.03;
    }
}
