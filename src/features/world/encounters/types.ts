// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/world/encounters/types.ts
// Purpose: Type definitions for encounters and gates system
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Hex position with sector coordinates
 */
export interface HexPosition {
    q: number;
    r: number;
    sectorX: number;
    sectorY: number;
}

/**
 * Encounter biomes (mapped from world biomes)
 */
export type EncounterBiome =
    | 'Grass'
    | 'Forest'
    | 'Desert'
    | 'Swamp'
    | 'Taiga'
    | 'Snow'
    | 'Settlement'
    | 'Mountain'
    | 'Ocean'
    | 'Wasteland';

/**
 * Types of encounters
 */
export type EncounterType =
    | 'RAID_PARTY'    // Faction military patrol
    | 'SCOUT_PATROL'  // Small recon group
    | 'WANDERER'      // Neutral traveler
    | 'MONSTER'       // Wild creature
    | 'BANDIT'        // Outlaw group
    | 'MERCHANT'      // Trader caravan
    | 'QUEST_GIVER'   // NPC with quest
    | 'TREASURE'      // Loot cache
    | 'AMBUSH';       // Hidden enemy

/**
 * Region ownership (for AI-driven encounters)
 */
export interface RegionOwner {
    id: string;
    factionName: string;
    tier: number;         // 1-5 (affects encounter difficulty)
    control: number;      // 0-1 (affects spawn frequency)
    conflictLevel: number; // 0-1 (affects hostile encounter rate)
}

/**
 * Core encounter data
 */
export interface Encounter {
    id: string;
    type: EncounterType;
    biome: EncounterBiome;
    position: HexPosition;
    faction: string;
    difficulty: number;    // 1-10 scale
    xp: number;
    discovered: boolean;
    completed: boolean;
    timestamp: number;
}

/**
 * Gate (strategic chokepoint/landmark)
 */
export interface Gate {
    id: string;
    name: string;
    position: HexPosition;
    type: 'FORTRESS' | 'BRIDGE' | 'PASS' | 'TOWER';
    owner: string | null;  // Faction ID
    garrisonStrength: number; // 0-100
    importance: number;    // 1-5 (strategic value)
    state: GateState;
}

/**
 * Gate state for saves
 */
export interface GateState {
    captured: boolean;
    capturedBy: string | null;
    captureDate: number;
    battles: number;
}

/**
 * Encounter log entry
 */
export interface EncounterLogEntry {
    encounterId: string;
    result: 'VICTORY' | 'DEFEAT' | 'FLED';
    timestamp: number;
    xpGained: number;
    lootGained: string[];
}
