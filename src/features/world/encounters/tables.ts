// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/world/encounters/tables.ts
// Purpose: Encounter generation tables and weights
// ──────────────────────────────────────────────────────────────────────────────

import type { EncounterBiome, EncounterType } from './types';

/**
 * Simple splitmix32 RNG for deterministic encounter generation
 */
function splitmix32(seed: number) {
    return function () {
        seed |= 0;
        seed = (seed + 0x9e3779b9) | 0;
        let t = seed ^ (seed >>> 16);
        t = Math.imul(t, 0x21f0aaad);
        t = t ^ (t >>> 15);
        t = Math.imul(t, 0x735a2d97);
        return (((t = t ^ (t >>> 15)) >>> 0) / 4294967296);
    };
}

/**
 * Encounter weights by biome (percentages)
 */
export const BIOME_ENCOUNTER_WEIGHTS: Record<EncounterBiome, Record<EncounterType, number>> = {
    Grass: {
        RAID_PARTY: 20,
        SCOUT_PATROL: 15,
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
        SCOUT_PATROL: 20,
        WANDERER: 15,
        MONSTER: 25,
        BANDIT: 15,
        MERCHANT: 5,
        QUEST_GIVER: 5,
        TREASURE: 3,
        AMBUSH: 2,
    },
    Desert: {
        RAID_PARTY: 15,
        SCOUT_PATROL: 15,
        WANDERER: 10,
        MONSTER: 20,
        BANDIT: 25,
        MERCHANT: 10,
        QUEST_GIVER: 2,
        TREASURE: 2,
        AMBUSH: 1,
    },
    Swamp: {
        RAID_PARTY: 5,
        SCOUT_PATROL: 10,
        WANDERER: 5,
        MONSTER: 40,
        BANDIT: 20,
        MERCHANT: 5,
        QUEST_GIVER: 5,
        TREASURE: 5,
        AMBUSH: 5,
    },
    Taiga: {
        RAID_PARTY: 15,
        SCOUT_PATROL: 20,
        WANDERER: 15,
        MONSTER: 20,
        BANDIT: 15,
        MERCHANT: 10,
        QUEST_GIVER: 3,
        TREASURE: 1,
        AMBUSH: 1,
    },
    Snow: {
        RAID_PARTY: 10,
        SCOUT_PATROL: 15,
        WANDERER: 10,
        MONSTER: 30,
        BANDIT: 15,
        MERCHANT: 10,
        QUEST_GIVER: 5,
        TREASURE: 3,
        AMBUSH: 2,
    },
    Settlement: {
        RAID_PARTY: 5,
        SCOUT_PATROL: 10,
        WANDERER: 30,
        MONSTER: 1,
        BANDIT: 5,
        MERCHANT: 30,
        QUEST_GIVER: 15,
        TREASURE: 2,
        AMBUSH: 2,
    },
    Mountain: {
        RAID_PARTY: 10,
        SCOUT_PATROL: 15,
        WANDERER: 10,
        MONSTER: 30,
        BANDIT: 20,
        MERCHANT: 5,
        QUEST_GIVER: 5,
        TREASURE: 3,
        AMBUSH: 2,
    },
    Ocean: {
        RAID_PARTY: 5,
        SCOUT_PATROL: 10,
        WANDERER: 15,
        MONSTER: 30,
        BANDIT: 25,
        MERCHANT: 10,
        QUEST_GIVER: 2,
        TREASURE: 2,
        AMBUSH: 1,
    },
    Wasteland: {
        RAID_PARTY: 15,
        SCOUT_PATROL: 15,
        WANDERER: 5,
        MONSTER: 35,
        BANDIT: 20,
        MERCHANT: 2,
        QUEST_GIVER: 3,
        TREASURE: 3,
        AMBUSH: 2,
    },
};

/**
 * Base encounter stats
 */
export const BASE_ENCOUNTER_STATS: Record<EncounterType, { difficulty: number; xp: number }> = {
    RAID_PARTY: { difficulty: 6, xp: 150 },
    SCOUT_PATROL: { difficulty: 3, xp: 75 },
    WANDERER: { difficulty: 1, xp: 25 },
    MONSTER: { difficulty: 5, xp: 100 },
    BANDIT: { difficulty: 4, xp: 80 },
    MERCHANT: { difficulty: 2, xp: 50 },
    QUEST_GIVER: { difficulty: 1, xp: 10 },
    TREASURE: { difficulty: 2, xp: 0 },
    AMBUSH: { difficulty: 7, xp: 175 },
};

/**
 * Roll an encounter type based on biome weights
 */
export function rollEncounter(seed: number, biome: EncounterBiome): EncounterType {
    const weights = BIOME_ENCOUNTER_WEIGHTS[biome];
    const types = Object.keys(weights) as EncounterType[];

    // Calculate total weight
    const totalWeight = types.reduce((sum, type) => sum + weights[type], 0);

    // Generate random value 0-totalWeight
    const rng = splitmix32(seed);
    const roll = (rng() / 0xFFFFFFFF) * totalWeight;

    // Find which encounter type the roll lands on
    let accumulated = 0;
    for (const type of types) {
        accumulated += weights[type];
        if (roll < accumulated) {
            return type;
        }
    }

    // Fallback (should never reach here)
    return types[0];
}

/**
 * Get encounter density label from conflict level
 */
export function getEncounterDensity(conflictLevel: number): 'Low' | 'Medium' | 'High' {
    if (conflictLevel > 0.7) return 'High';
    if (conflictLevel > 0.3) return 'Medium';
    return 'Low';
}

/**
 * Get spawn chance percentage from conflict level
 */
export function getSpawnChance(conflictLevel: number): number {
    if (conflictLevel > 0.7) return 0.25; // 25%
    if (conflictLevel > 0.3) return 0.10; // 10%
    return 0.03; // 3%
}
