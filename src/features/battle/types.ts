import type { WeatherCell, Personality } from '../strategy/ai/types';
// TODO: AI tactical module temporarily disabled for build fix
// import type { PlaybookId as TacticalPlaybookId } from '../ai/tactical/v29';

// Temporary type until AI system is complete
export type PlaybookId = string;

/**
 * Battle System Types
 * Hex-grid tactical combat with hero commanders and mercenary units
 */

export interface HexPosition {
    q: number;
    r: number;
}

export interface Damage {
    amount: number;
    type: string;
}

export interface UnitStats {
    hp: number;
    maxHp: number;
    atk: number;
    def: number;
    mag: number;
    res: number;
    spd: number;
    rng: number;
    move: number;
}

export interface StatusEffect {
    id: string;
    name: string;
    duration: number;
    effects: Partial<UnitStats>;
    payload?: { // Additional data for complex effects
        amount?: number; // Morale bonus/penalty
        stacks?: number; // Fear stacks
        maxStacks?: number; // Fear stack limit
        source?: string; // Effect source
        type?: string; // Effect type
        [key: string]: any;
    };
}

export interface Skill {
    id: string;
    name: string;
    description: string;
    apCost: number;
    cooldown: number;
    range: number;
}

export interface Unit {
    id: string;
    name: string;
    kind: "HeroCommander" | "Mercenary" | "Monster" | "NPC" | "Boss";
    faction: "Player" | "Enemy" | "Neutral";
    team?: 'Player' | 'Enemy';
    morale?: number;
    stamina?: number;
    range?: number;
    move?: number;
    race: string;
    archetype: string;
    level: number;
    stats: UnitStats;
    statuses: StatusEffect[];
    skills: string[]; // Changed to string[] to match ability IDs
    pos?: HexPosition;
    isCommander?: boolean;
    isDead: boolean; // Required property to avoid undefined issues
    gear?: { gearScore?: number }; // Add gear property
    traits?: string[];
    facing?: number; // Add facing for hex directions (0-5)
    hasMoved?: boolean; // Track if unit has moved this turn
    hasActed?: boolean; // Track if unit has acted this turn
    meta?: { // Metadata for systems like morale
        morale?: any; // MoraleBlock from morale system
        [key: string]: any;
    };
}

export interface Ability {
    id: string;
    name: string;
    type: "command" | "spell" | "skill";
    apCost: number;
    range: number;
    shape: "single" | "line" | "blast1" | "blast2" | "ally" | "self";
    damage?: Damage;
    healing?: number;
    aoeRadius?: number;
    cooldown: number;
    description?: string;
}

export interface CommanderAura {
    name: string;
    stats: Partial<UnitStats>;
    range?: number;
}

export interface Commander {
    unitId: string;
    aura: CommanderAura;
    abilities: Ability[];
    runtime: {
        cooldowns?: { [abilityId: string]: number };
        actionPoints?: number;
    };
}

export interface HexTile {
    q: number;
    r: number;
    terrain: "Grass" | "Forest" | "Mountain" | "Water" | "Desert" | "Swamp";
    elevation: number;
    passable: boolean;
    cover?: number;
    occupied?: string; // unitId
}

export interface BattleGrid {
    width: number;
    height: number;
    tiles: HexTile[];
}

export interface DeploymentZone {
    hexes: HexPosition[];
    faction: "Player" | "Enemy";
}

export interface CommanderIntent {
    stance: 'Aggressive' | 'Defensive' | 'Opportunistic';
    objective: 'Seize' | 'Hold' | 'Raid' | 'Escort';
    riskTolerance: number;
    focusRegionId?: string;
}


export interface BattleContext {
    seed: string;
    biome: string;
    site?: 'wilds' | 'settlement' | 'dungeon';
    personality?: Personality;
    cultureId?: string;
    enemyFactionId?: string;
    enemyPlaybookId?: PlaybookId;
    weather?: string;
    timeOfDay?: 'Dawn' | 'Day' | 'Dusk' | 'Night';
    weatherDetail?: WeatherCell;
    moraleShift?: number;
    supplyShift?: number;
    commanderIntent?: CommanderIntent;
    terrainTags?: string[];
}

export interface BattleEnvironment {
    biome: string;
    weather?: WeatherCell;
    moraleShift?: number;
    supplyShift?: number;
}

export interface BattleModifier {
    type: string;
    value: number;
}

export interface CommanderAIProfile {
    stance: CommanderIntent['stance'];
    risk: number;
    objective: CommanderIntent['objective'];
    currentFocus?: string;
}

export type BattlePhase = "Setup" | "HeroTurn" | "UnitsTurn" | "EnemyTurn" | "Victory" | "Defeat";

export interface BattleState {
    id: string;
    turn: number;
    phase: BattlePhase;
    grid: BattleGrid;
    context: BattleContext;
    commander: Commander;
    enemyCommander?: Commander;
    commandersAI?: { A: CommanderAIProfile; B: CommanderAIProfile };
    units: Unit[];
    initiative: string[]; // unit IDs in turn order
    friendlyDeployment: DeploymentZone;
    enemyDeployment: DeploymentZone;
    log: string[];
    region?: { id?: string; tags?: string[] };
    flags?: Record<string, unknown>;
    unitStatsById?: Record<string, { atk: number; def: number; spd: number; rng: number; hp: number; traits?: string[] }>;
    replay?: any;
    environment?: BattleEnvironment;
    modifiers?: BattleModifier[];
    selectedUnit?: string;
    targetHex?: HexPosition;
    turnLimit?: number; // Optional turn limit for timed battles
}

export interface BattleResult {
    victory: boolean;
    experience: number;
    loot: any[];
    casualties: string[]; // unit IDs that were defeated
}
