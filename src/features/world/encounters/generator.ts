// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/world/encounters/generator.ts
// Purpose: Encounter generation logic with scaling and AI integration
// ──────────────────────────────────────────────────────────────────────────────

import type { Encounter, EncounterBiome, RegionOwner, HexPosition } from './types';
import { rollEncounter, BASE_ENCOUNTER_STATS } from './tables';

/**
 * Generate a single encounter
 */
export function generateEncounter(
    seed: number,
    biome: EncounterBiome,
    regionOwner: RegionOwner,
    partyLevel: number,
    position: HexPosition
): Encounter {
    // Hash position into seed for variety
    const positionSeed = seed ^
        ((position.sectorX & 0xFFFF) << 16) ^
        (position.sectorY & 0xFFFF) ^
        ((position.q & 0xFF) << 8) ^
        (position.r & 0xFF);

    const encounterType = rollEncounter(positionSeed, biome);
    const baseStats = BASE_ENCOUNTER_STATS[encounterType];

    // Scale difficulty: base + region tier + party level scaling
    const difficulty = Math.floor(
        baseStats.difficulty +
        (regionOwner.tier - 1) +
        (partyLevel - 1) * 0.25
    );

    // Scale XP: base * region tier multiplier * control bonus
    const xp = Math.floor(
        baseStats.xp *
        (1 + (regionOwner.tier - 1) * 0.2) *
        (1 + regionOwner.control * 0.1)
    );

    return {
        id: `enc-${position.sectorX}-${position.sectorY}-${position.q}-${position.r}-${seed}`,
        type: encounterType,
        biome,
        position,
        faction: regionOwner.factionName,
        difficulty: Math.max(1, Math.min(10, difficulty)), // Clamp 1-10
        xp: Math.max(0, xp),
        discovered: false,
        completed: false,
        timestamp: Date.now(),
    };
}

/**
 * Map world biome names to encounter biome types
 */
export function mapBiomeToEncounterBiome(worldBiome: string): EncounterBiome {
    const biomeMap: Record<string, EncounterBiome> = {
        'grass': 'Grass',
        'grassland': 'Grass',
        'plains': 'Grass',
        'forest': 'Forest',
        'woods': 'Forest',
        'jungle': 'Forest',
        'desert': 'Desert',
        'sand': 'Desert',
        'dunes': 'Desert',
        'swamp': 'Swamp',
        'marsh': 'Swamp',
        'bog': 'Swamp',
        'taiga': 'Taiga',
        'tundra': 'Snow',
        'snow': 'Snow',
        'ice': 'Snow',
        'settlement': 'Settlement',
        'town': 'Settlement',
        'city': 'Settlement',
        'village': 'Settlement',
        'mountain': 'Mountain',
        'hills': 'Mountain',
        'peaks': 'Mountain',
        'ocean': 'Ocean',
        'sea': 'Ocean',
        'water': 'Ocean',
        'wasteland': 'Wasteland',
        'barren': 'Wasteland',
        'ruins': 'Wasteland',
    };

    const normalized = worldBiome.toLowerCase().trim();
    return biomeMap[normalized] || 'Grass';
}
