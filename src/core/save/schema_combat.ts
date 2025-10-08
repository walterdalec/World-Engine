/**
 * TODO #14 — Combat State Schema Definition
 * 
 * Deterministic serialization schema for tactical combat states.
 * Supports replay reconstruction and cross-platform compatibility.
 */

export const COMBAT_SCHEMA_VERSION = 3;

export interface Vec2 {
    x: number;
    y: number;
}

export interface HexCoord {
    q: number;
    r: number;
}

export interface UnitStats {
    hp: number;
    maxHp: number;
    ap: number;
    maxAp: number;
    initiative: number;
    morale: number;
    cohesion: number;
}

export interface UnitStatus {
    id: string;
    type: string;
    duration: number;
    intensity: number;
    source?: string;
}

export interface CombatUnit {
    id: string;
    name: string;
    faction: string;
    team: string;
    archetype: string;
    level: number;

    // Position and facing
    pos: HexCoord;
    facing: number; // 0-5 hex directions

    // Core stats
    stats: UnitStats;

    // Abilities and spells
    abilities: string[];
    spells: string[];
    activeAbilities: Record<string, number>; // id -> cooldown

    // Status effects
    statuses: UnitStatus[];

    // Equipment and modifiers
    equipment: string[];
    modifiers: Record<string, number>;

    // State flags
    isDead: boolean;
    isRouted: boolean;
    hasActed: boolean;
    hasMovedThisTurn: boolean;
}

export interface TerrainTile {
    q: number;
    r: number;
    type: string;
    elevation: number;
    passable: boolean;
    movementCost: number;
    cover: number;
    features: string[];
    occupiedBy?: string; // unit ID
}

export interface SpellInFlight {
    id: string;
    spellId: string;
    casterId: string;
    targetPos: HexCoord;
    targetIds: string[];
    duration: number;
    remainingTime: number;
    intensity: number;
}

export interface TurnQueue {
    currentTurn: number;
    currentPhase: 'hero' | 'units' | 'enemy' | 'resolution';
    actionQueue: Array<{
        unitId: string;
        initiative: number;
        hasActed: boolean;
    }>;
    turnHistory: Array<{
        turn: number;
        actor: string;
        action: string;
        timestamp: number;
    }>;
}

export interface CombatObjective {
    type: 'eliminate' | 'capture' | 'survive' | 'escape';
    target?: string;
    turns?: number;
    description: string;
    completed: boolean;
}

export interface CombatMetrics {
    startTime: number;
    elapsedTurns: number;
    totalDamageDealt: Record<string, number>; // faction -> damage
    unitsLost: Record<string, number>; // faction -> count
    spellsCast: number;
    criticalHits: number;
}

export interface CombatStateV3 {
    schemaVersion: 3;
    buildCommit: string;
    saveTimestamp: number;

    // Combat identity
    battleId: string;
    battleType: string;
    seed: string;
    rngState: string;

    // Battlefield
    mapId: string;
    width: number;
    height: number;
    terrain: TerrainTile[];

    // Combat participants
    units: CombatUnit[];
    factions: Record<string, {
        name: string;
        color: string;
        isPlayer: boolean;
        isAI: boolean;
        morale: number;
    }>;

    // Combat flow
    turnQueue: TurnQueue;
    objectives: CombatObjective[];

    // Active effects
    spellsInFlight: SpellInFlight[];
    auraEffects: Array<{
        sourceId: string;
        center: HexCoord;
        radius: number;
        effects: Record<string, number>;
    }>;

    // Weather and environment
    weather: {
        type: string;
        intensity: number;
        turnsRemaining: number;
        effects: Record<string, number>;
    };

    // Combat state
    isActive: boolean;
    isPaused: boolean;
    victor?: string;
    completedAt?: number;

    // Metrics and replay data
    metrics: CombatMetrics;
    checksum: string;
}

/**
 * Utility type for partial updates during migration
 */
export type CombatStateDelta = {
    [K in keyof CombatStateV3]?: CombatStateV3[K] extends object
    ? Partial<CombatStateV3[K]>
    : CombatStateV3[K];
};

/**
 * Create a minimal valid combat state for testing
 */
export function createMinimalCombatState(overrides: Partial<CombatStateV3> = {}): CombatStateV3 {
    return {
        schemaVersion: COMBAT_SCHEMA_VERSION,
        buildCommit: process.env.REACT_APP_GIT_COMMIT || 'dev',
        saveTimestamp: Date.now(),

        battleId: 'battle_' + Math.random().toString(36).substr(2, 9),
        battleType: 'skirmish',
        seed: 'seed_' + Math.random().toString(36).substr(2, 9),
        rngState: '0',

        mapId: 'test_map',
        width: 20,
        height: 20,
        terrain: [],

        units: [],
        factions: {},

        turnQueue: {
            currentTurn: 1,
            currentPhase: 'hero',
            actionQueue: [],
            turnHistory: []
        },
        objectives: [],

        spellsInFlight: [],
        auraEffects: [],

        weather: {
            type: 'clear',
            intensity: 0,
            turnsRemaining: 0,
            effects: {}
        },

        isActive: true,
        isPaused: false,

        metrics: {
            startTime: Date.now(),
            elapsedTurns: 0,
            totalDamageDealt: {},
            unitsLost: {},
            spellsCast: 0,
            criticalHits: 0
        },
        checksum: '',

        ...overrides
    };
}

/**
 * Validate combat state schema compliance
 */
export function validateCombatState(state: any): state is CombatStateV3 {
    if (!state || typeof state !== 'object') return false;
    if (state.schemaVersion !== COMBAT_SCHEMA_VERSION) return false;
    if (!state.battleId || !state.seed || !state.turnQueue) return false;

    // Validate required arrays
    if (!Array.isArray(state.units)) return false;
    if (!Array.isArray(state.terrain)) return false;
    if (!Array.isArray(state.objectives)) return false;

    // Validate turn queue structure
    const tq = state.turnQueue;
    if (!tq.currentTurn || !tq.currentPhase || !Array.isArray(tq.actionQueue)) return false;

    return true;
}