/**
 * Character Creator Types
 * TODO #16 — Character Creator & Progression Bridge
 * 
 * Defines the contracts for creating characters that integrate with:
 * - #06 Unit Model & Damage (stats/gear/resists)
 * - #07A Spells Core & gating
 * - #07B Spell Catalog (starter spell picks)
 * - #08 Leaders & Squads (auras/command abilities)
 * - #09 Formation & Positioning (front/back, facing)
 * - #03/#04 Turn & Action flow (AP costs, validation, resolution)
 */

import type { Unit, UnitStats, HexPosition } from '../../features/battle/types';

// Core identity types
export type SpeciesId = 'human' | 'sylvanborn' | 'nightborn' | 'stormcaller' | 'crystalborn' | 'draketh' | 'alloy' | 'voidkin';
export type BackgroundId = 'commoner' | 'noble' | 'outcast' | 'acolyte' | 'ranger' | 'scholar' | 'mercenary' | 'wanderer';
export type ArchetypeId = 'warrior' | 'ranger' | 'mage' | 'priest' | 'commander' | 'knight' | 'mystic' | 'guardian' | 'chanter' | 'corsair';

// Magic system integration
export type School = 'Fire' | 'Air' | 'Water' | 'Earth' | 'Spirit' | 'Shadow' | 'Nature' | 'Arcane' | 'Divine';

// Base stat allocation (point-buy system)
export interface StatAllocation {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
    spd: number;
    lck: number;
}

// Magic mastery levels (1=Basic, 2=Skilled, 3=Expert, 4=Grandmaster)
export interface MasteryPick {
    school: School;
    rank: 1 | 2 | 3 | 4;
}

// Spell selection
export interface SpellPick {
    id: string;
    school: School;
    level: number;
}

// Formation and positioning data
export interface FormationData {
    row: 'front' | 'back';
    slot: number;
    facing?: 0 | 1 | 2 | 3 | 4 | 5; // hex directions
}

// Equipment preferences
export interface EquipmentPrefs {
    weaponType?: 'sword' | 'bow' | 'staff' | 'wand' | 'axe' | 'spear';
    armorType?: 'cloth' | 'leather' | 'mail' | 'plate';
    shieldType?: 'none' | 'buckler' | 'round' | 'tower';
}

// Complete character creation input
export interface CreatorInput {
    // Identity
    name: string;
    team: string;
    species: SpeciesId;
    background: BackgroundId;
    archetype: ArchetypeId;
    level: number;

    // Stats (point-buy allocation)
    stats: StatAllocation;

    // Magic system integration
    masteries: MasteryPick[];
    spells?: SpellPick[];

    // Leadership path
    wantsCommander?: boolean;
    commandLoadout?: string[]; // command ability IDs
    auras?: string[]; // aura IDs

    // Tactical positioning
    formation?: FormationData;

    // Equipment preferences
    equipment?: EquipmentPrefs;

    // Customization
    traits?: string[];
    portraitSeed?: string;

    // Metadata
    seed?: string; // for deterministic random generation
}

// Result of character creation
export interface CreatorResult {
    hero: Unit; // Valid battle system unit
    squad?: Unit[]; // Optional squad if commander path
    errors?: string[]; // Non-fatal warnings
    summary?: CharacterSummary; // Human-readable summary
}

// Human-readable character summary
export interface CharacterSummary {
    name: string;
    title: string; // Generated title based on species/archetype/background
    description: string;
    combatRole: string;
    specialization: string[];
    knownSpells: string[];
    commandAbilities?: string[];
    tacticalNotes: string[];
}

// Validation result
export interface ValidationResult {
    ok: boolean;
    reasons: string[];
    warnings?: string[];
}

// Species definition
export interface SpeciesDefinition {
    id: SpeciesId;
    name: string;
    description: string;
    statModifiers: Partial<StatAllocation>;
    traits: string[];
    resistances?: Partial<Record<string, number>>;
    culturalBackground?: string;
    lifespan?: string;
    physicalTraits?: string;
}

// Background definition
export interface BackgroundDefinition {
    id: BackgroundId;
    name: string;
    description: string;
    statModifiers: Partial<StatAllocation>;
    startingGold: number;
    bonusEquipment?: string[];
    socialConnections?: string[];
    knowledgeAreas?: string[];
}

// Archetype definition with combat role
export interface ArchetypeDefinition {
    id: ArchetypeId;
    name: string;
    description: string;
    combatRole: 'melee' | 'ranged' | 'caster' | 'support' | 'leader';
    primaryStats: (keyof StatAllocation)[];
    defaultEquipment: {
        weapon: string;
        armor: string;
        shield?: string;
    };
    startingAbilities: string[];
    magicTraditions?: School[];
    commandCapable?: boolean;
    formationPreference: 'front' | 'back' | 'flexible';
}

// Equipment item definition
export interface ItemDefinition {
    id: string;
    name: string;
    slot: 'weapon' | 'armor' | 'shield' | 'accessory';
    type: string; // weapon type, armor type, etc.
    statModifiers?: Partial<UnitStats>;
    enchantments?: string[];
    requirements?: {
        level?: number;
        stats?: Partial<StatAllocation>;
        proficiencies?: string[];
    };
    value: number;
    weight: number;
}

// Command ability definition
export interface CommandAbilityDefinition {
    id: string;
    name: string;
    description: string;
    apCost: number;
    cooldown: number;
    range: number;
    aoe: 'single' | 'blast' | 'line' | 'cone' | 'aura';
    effects: Array<{
        type: 'buff' | 'debuff' | 'damage' | 'heal' | 'special';
        target: 'ally' | 'enemy' | 'self' | 'all';
        magnitude: number;
        duration?: number;
    }>;
    requirements?: {
        level?: number;
        stats?: Partial<StatAllocation>;
        traits?: string[];
    };
}

// Aura definition
export interface AuraDefinition {
    id: string;
    name: string;
    description: string;
    radius: number;
    effects: Partial<UnitStats>;
    conditions?: string[];
    stackable?: boolean;
    requirements?: {
        level?: number;
        stats?: Partial<StatAllocation>;
        leadership?: number;
    };
}

// World spawn configuration
export interface SpawnConfig {
    worldId: string;
    position: HexPosition;
    faction: string;
    deploymentZone?: string;
    startingResources?: {
        gold?: number;
        supplies?: number;
        reputation?: Record<string, number>;
    };
}