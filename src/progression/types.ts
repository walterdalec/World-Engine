/**
 * Canvas 11 - Progression Types
 * 
 * Harsh growth with lasting consequences; sideways scaling instead of power creep.
 * Levels, scars, death, and costly revival mechanics.
 */

import type { CharacterId } from '../party/types';

/**
 * XP source tracking for analytics
 */
export type XPSource = 
    | 'battle'
    | 'quest'
    | 'exploration'
    | 'training'
    | 'mentor'
    | 'milestone';

/**
 * Wound severity and tags
 */
export interface Wound {
    kind: 'minor' | 'major' | 'fatal';
    tags: string[]; // crushing, piercing, fire, poison, necrotic, etc.
    day: number;
    source?: string; // encounter id or cause
}

/**
 * Damage type tags for injury resolution
 */
export type DamageTag = 
    | 'crushing'    // broken bones
    | 'piercing'    // bleeding
    | 'slashing'    // deep cuts
    | 'fire'        // burns
    | 'frost'       // frostbite
    | 'poison'      // organ strain
    | 'necrotic'    // withering
    | 'lightning'   // nerve damage
    | 'psychic'     // trauma
    | 'holy'        // divine wounds
    | 'shadow';     // corruption

/**
 * Stat modifier (can be positive or negative)
 */
export interface Mod {
    stat?: string;      // STR, DEX, CON, INT, WIS, CHA
    amount?: number;    // +/- value (optional, use with percent or alone)
    percent?: number;   // +/- percentage
    type?: string;      // max_hp, initiative, resistance, accuracy, etc.
}

/**
 * Scar - lasting consequence from injury or revival
 */
export interface Scar {
    id: string;
    name: string;
    description: string;
    mods: Mod[];        // stat/combat modifiers
    visible: boolean;   // affects NPC reactions
    locked?: boolean;   // story scars can't be replaced
    acquiredDay: number;
    source: 'injury' | 'revival' | 'curse' | 'story';
}

/**
 * Curse - negative effect from flawed revival
 */
export interface Curse {
    id: string;
    name: string;
    description: string;
    mods: Mod[];
    upkeep?: number;    // daily gold cost (Canvas 12)
    duration?: number;  // days until it fades, undefined = permanent
    acquiredDay: number;
}

/**
 * Death record for Codex
 */
export interface DeathRecord {
    memberId: CharacterId;
    name: string;
    day: number;
    regionId: string;
    cause: string;
    loot: string[];     // dropped equipment (non-soulbound)
}

/**
 * Revival attempt configuration
 */
export interface RevivalAttempt {
    memberId: CharacterId;
    day: number;
    siteId: string;     // altar, sanctum, etc.
    siteTier: number;   // 1-5, affects success chance
    reagents: string[]; // required items
    gold: number;
    outcome?: 'success' | 'flawed' | 'failure';
    scarId?: string;    // always get a scar
    curseId?: string;   // on flawed success
}

/**
 * Level-up choice (mutually exclusive)
 */
export type LevelUpChoice = 
    | { type: 'stat'; stat: string; amount: number }
    | { type: 'skill'; skillId: string }
    | { type: 'trait'; traitId: string };

/**
 * Progression state for a party member
 */
export interface ProgressionState {
    memberId: CharacterId;
    level: number;
    xp: number;
    xpToNext: number;
    recentLevelUps: number[];    // days of recent level-ups for burnout
    burnout: number;             // 0-100, reduces stats temporarily
    wounds: Wound[];
    scars: Scar[];               // max 3 active
    curses: Curse[];
    deathCount: number;          // tracks revival attempts
    lastRevivalDay?: number;
}

/**
 * XP calculation formula parameters
 */
export interface XPFormula {
    base: number;       // base multiplier
    exponent: number;   // level scaling exponent
    step: number;       // linear step
    softCapLevel: number; // level where XP gains become 50% effective
    softCapMultiplier: number; // 0.5 = half effectiveness
}

/**
 * Reagent requirement for revival paths
 */
export interface RevivalPath {
    id: string;
    name: string;
    description: string;
    reagents: Array<{ itemId: string; quantity: number }>;
    gold: number;
    successChance: number;    // base 0-1
    flawedChance: number;     // 0-1
    failureChance: number;    // 0-1 (should sum to 1.0)
    requiredSiteTier: number; // minimum site tier
    factionRestriction?: string; // some factions forbid certain paths
}

/**
 * Progression events
 */
export type ProgressionEvent =
    | { type: 'xp/granted'; memberId: CharacterId; amount: number; source: XPSource; newTotal: number }
    | { type: 'xp/levelUp'; memberId: CharacterId; newLevel: number; choice: LevelUpChoice }
    | { type: 'wound/applied'; memberId: CharacterId; wound: Wound }
    | { type: 'scar/applied'; memberId: CharacterId; scar: Scar }
    | { type: 'death/recorded'; memberId: CharacterId; deathRecord: DeathRecord }
    | { type: 'curse/applied'; memberId: CharacterId; curse: Curse }
    | { type: 'curse/faded'; memberId: CharacterId; curseId: string }
    | { type: 'revival/attempted'; attempt: RevivalAttempt }
    | { type: 'burnout/warning'; memberId: CharacterId; burnoutLevel: number }
    | { type: 'codex/obituary'; record: DeathRecord }
    | { type: 'codex/revival'; memberId: CharacterId; success: boolean };

/**
 * Default XP formula (tunable)
 */
export const DEFAULT_XP_FORMULA: XPFormula = {
    base: 100,
    exponent: 2,
    step: 50,
    softCapLevel: 20,
    softCapMultiplier: 0.5
};

/**
 * Scar limits and replacement rules
 */
export const SCAR_LIMITS = {
    MAX_ACTIVE: 3,
    MINOR_INJURY_CHANCE: 0.20,
    MAJOR_INJURY_CHANCE: 1.0,
    REVIVAL_GUARANTEED: true
} as const;

/**
 * Burnout thresholds
 */
export const BURNOUT_THRESHOLDS = {
    WARNING: 40,        // show warning
    PENALTY_LIGHT: 60,  // -5% all stats
    PENALTY_HEAVY: 80,  // -10% all stats
    RECOVERY_PER_DAY: 10 // burnout reduction per day
} as const;

/**
 * Revival success modifiers
 */
export interface RevivalModifiers {
    siteTierBonus: number;      // +5% per tier above minimum
    healerPresence: number;     // +10% if healer in party
    deathCountPenalty: number;  // -5% per previous death
    recentDeathPenalty: number; // -15% if died < 7 days ago
    factionBonus: number;       // varies by faction relationship
}
