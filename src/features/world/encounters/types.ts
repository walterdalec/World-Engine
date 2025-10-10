// ──────────────────────────────────────────────────────────────────────────────
// File: src/features/world/encounters/types.ts
// Purpose: Type definitions for encounters and gates system
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Biome types for encounters
 */
export type EncounterBiome = 
    | 'Grass' | 'Forest' | 'Desert' | 'Swamp' 
    | 'Taiga' | 'Snow' | 'Settlement' | 'Mountain' 
    | 'Ocean' | 'Void';

/**
 * Encounter types representing different kinds of world events
 */
export type EncounterType = 
    | 'RAID_PARTY'      // Hostile faction raid
    | 'SCOUT_PATROL'    // Faction scouts
    | 'WANDERER'        // Neutral traveler
    | 'MONSTER'         // Wild creature
    | 'BANDIT'          // Outlaw group
    | 'MERCHANT'        // Trading opportunity
    | 'QUEST_GIVER'     // Story hook
    | 'TREASURE'        // Loot location
    | 'AMBUSH';         // Hidden danger

/**
 * Encounter difficulty tiers
 */
export type EncounterDifficulty = 'TRIVIAL' | 'EASY' | 'MEDIUM' | 'HARD' | 'DEADLY';

/**
 * Encounter density levels for region control
 */
export type EncounterDensity = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Base encounter configuration from tables
 */
export interface EncounterBase {
    type: EncounterType;
    diff: number;           // Base difficulty (1-10)
    xp: number;             // Base XP reward
    biome: EncounterBiome;
}

/**
 * Scaled encounter instance
 */
export interface Encounter {
    id: string;
    type: EncounterType;
    biome: EncounterBiome;
    difficulty: number;     // Scaled difficulty
    xp: number;             // Scaled XP
    region: string;         // Region ID
    faction: string;        // Faction name or 'Neutral'
    position: {
        q: number;
        r: number;
        sectorX: number;
        sectorY: number;
    };
    discovered: boolean;
    completed: boolean;
    timestamp: number;      // When generated
}

/**
 * Gate edge positions
 */
export type GateEdge = 'N' | 'S' | 'E' | 'W';

/**
 * Gate requirement types
 */
export interface GateRequirement {
    type: 'STAT' | 'ITEM' | 'QUEST' | 'FACTION';
    stat?: string;          // For STAT type
    min?: number;           // Minimum value
    itemId?: string;        // For ITEM type
    questId?: string;       // For QUEST type
    factionId?: string;     // For FACTION type
    reputation?: number;    // Minimum faction reputation
}

/**
 * Gate definition
 */
export interface Gate {
    gateId: string;
    edge: GateEdge;
    q: number;              // Hex position
    r: number;
    sectorX: number;
    sectorY: number;
    requirement: GateRequirement;
    tier: number;           // Gate tier (1-5)
}

/**
 * Persistent gate state
 */
export interface GateState {
    unlocked: boolean;
    openedBy: string | null;    // Faction that opened it
    openedAt: number | null;    // Timestamp
}

/**
 * Region owner information for encounter scaling
 */
export interface RegionOwner {
    id: string;
    factionName: string;
    tier: number;           // 1-5
    control: number;        // 0-1 (0% to 100% control)
    conflictLevel: number;  // 0-1 (0% to 100% conflict)
}

/**
 * Encounter log entry for AI feedback
 */
export interface EncounterLogEntry {
    encounterId: string;
    faction: string;
    type: EncounterType;
    outcome: 'VICTORY' | 'DEFEAT' | 'FLED' | 'AVOIDED';
    timestamp: number;
    xpGained: number;
}
