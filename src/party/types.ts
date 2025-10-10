/**
 * Canvas 10 - Party Framework Types
 * 
 * Hero + Named Hirelings with lifecycle management:
 * hire → travel → fight → injury/death → pay/upkeep → dismissal/recruitment
 */

export type CharacterId = string;
export type Sex = 'male' | 'female';

/**
 * Build specification - high-level character template
 * Canvas 15 will detail abilities/traits system
 */
export interface BuildSpec {
    race: string;
    classId: string;
    sex: Sex;
    age: number;
    baseStats: {
        STR: number;
        DEX: number;
        CON: number;
        INT: number;
        WIS: number;
        CHA: number;
    };
    skills: string[];  // tag ids
    traits: string[];  // passive tags, limited per Canvas 15
}

/**
 * Recruit definition - template for hirable companions
 * Spawned in taverns based on region tier and rumors
 */
export interface RecruitDef extends BuildSpec {
    id: CharacterId;
    name: string;
    origin: string;       // tavern/quest hook text id
    level: number;
    portraitId: string;
    upkeep: number;       // daily gold cost
    hireCost: number;     // one-time hiring fee
    locked?: boolean;     // requires quest/rep to unlock
    questId?: string;     // if locked, quest that unlocks this recruit
    minReputation?: number; // minimum faction rep needed
}

/**
 * Party member - active character in the party
 * Includes hero (player-created) and recruits (prebuilt)
 */
export interface PartyMember {
    id: CharacterId;
    recruitId?: string;   // if hired recruit, reference to RecruitDef
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    injured?: boolean;    // temporary injury flag
    dead?: boolean;       // permanent death flag
    scars: string[];      // persistent injury effects (Canvas 11)
    morale: number;       // -100..+100
    loyalty: number;      // -100..+100, slow-moving
    gear: Record<string, string>; // item ids by slot
    build: BuildSpec;
    xp: number;
    upkeep: number;       // daily wage
    joinedAtDay: number;
    dismissedAtDay?: number;
}

/**
 * Party state - complete roster and constraints
 */
export interface PartyState {
    hero: PartyMember;        // player character, not dismissible
    members: PartyMember[];   // hired recruits
    maxSize: number;          // scales with hero titles/tech (default 4-6)
    mounts: number;           // affects travel speed
    cargoSlots: number;       // affects inventory capacity
    wageDebt: number;         // accumulated unpaid wages
}

/**
 * Morale thresholds and effects
 */
export const MORALE_THRESHOLDS = {
    DESERTION: -75,    // member will desert after next battle/camp
    THREATEN: -50,     // member threatens to leave
    WARNING: -25,      // member complains about conditions
    NEUTRAL: 0,
    CONTENT: 25,
    LOYAL: 50,
    DEVOTED: 75
} as const;

/**
 * Morale adjustment reasons (for event logging)
 */
export type MoraleReason =
    | 'victory'
    | 'defeat'
    | 'injury'
    | 'death'
    | 'wages_paid'
    | 'wages_unpaid'
    | 'leadership'
    | 'food'
    | 'comfort'
    | 'reputation';

/**
 * Injury severity for post-battle resolution
 */
export type InjurySeverity = 'light' | 'serious' | 'critical' | 'fatal';

/**
 * Party events for integration with other systems
 */
export type PartyEvent =
    | { type: 'party/hired'; memberId: CharacterId; name: string; cost: number }
    | { type: 'party/dismissed'; memberId: CharacterId; name: string; severance: number }
    | { type: 'party/morale'; memberId: CharacterId; delta: number; reason: MoraleReason; newValue: number }
    | { type: 'party/wagesDue'; amount: number; days: number }
    | { type: 'party/wagesPaid'; amount: number; days: number }
    | { type: 'party/debt'; amount: number; accumulated: number }
    | { type: 'party/desert'; memberId: CharacterId; name: string; morale: number }
    | { type: 'party/injured'; memberId: CharacterId; severity: InjurySeverity }
    | { type: 'party/death'; memberId: CharacterId; name: string; cause: string }
    | { type: 'party/revived'; memberId: CharacterId; name: string; cost: number }
    | { type: 'party/levelUp'; memberId: CharacterId; newLevel: number };

/**
 * Recruit spawn configuration for regions
 */
export interface RecruitSpawnConfig {
    regionTier: number;     // 1-5, affects recruit quality
    minLevel: number;
    maxLevel: number;
    poolSize: number;       // how many recruits available
    costMultiplier: number; // regional price adjustment
}
