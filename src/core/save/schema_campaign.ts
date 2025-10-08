/**
 * TODO #14 — Campaign State Schema Definition
 * 
 * Deterministic serialization schema for strategic/world states.
 * Supports cross-platform saves and long-term campaign progression.
 */

export const CAMPAIGN_SCHEMA_VERSION = 3;

export interface WorldClock {
    year: number;
    season: 'spring' | 'summer' | 'autumn' | 'winter';
    week: number;
    day: number;
    totalDays: number;
}

export interface RegionTerrain {
    biome: string;
    fertility: number;
    accessibility: number;
    strategicValue: number;
    features: string[];
}

export interface Settlement {
    id: string;
    name: string;
    type: 'village' | 'town' | 'city' | 'fortress' | 'castle';
    population: number;
    prosperity: number;
    loyalty: number;
    defenses: number;
    buildings: string[];
    garrison: string[]; // unit IDs
    tradingPost: boolean;
    harbor: boolean;
}

export interface ResourceNode {
    id: string;
    type: 'grain' | 'wood' | 'iron' | 'horses' | 'stone' | 'gems' | 'mana';
    production: number;
    quality: number;
    depleted: boolean;
    controlled: boolean;
}

export interface Road {
    id: string;
    from: string; // region ID
    to: string;   // region ID
    quality: 0 | 1 | 2; // poor/good/excellent
    distance: number;
    condition: number; // 0-100, affects travel time
    contested: boolean;
    safetyLevel: number; // bandit risk
}

export interface Region {
    id: string;
    name: string;
    owner: string; // faction ID

    // Geographic data
    center: { x: number; y: number };
    terrain: RegionTerrain;

    // Political state
    stability: number; // -5 to +5
    taxation: number;  // 0-100%
    autonomy: number;  // 0-100%
    lastConquered?: number; // day timestamp

    // Economic assets
    settlements: Settlement[];
    resourceNodes: ResourceNode[];

    // Strategic data
    supplyCacheSize: number;
    recruitmentPool: number;
    fortifications: number;

    // Dynamic state
    activeEvents: string[];
    seasonalModifiers: Record<string, number>;
}

export interface Army {
    id: string;
    name: string;
    factionId: string;
    commanderId?: string; // hero ID

    // Position and movement
    regionId: string;
    position: { x: number; y: number };
    destination?: string; // region ID
    movementPoints: number;
    maxMovementPoints: number;

    // Composition
    units: string[]; // unit IDs
    totalStrength: number;
    upkeep: number;

    // Supply state
    supplies: Record<string, number>; // resource type -> quantity
    attrition: number;
    lastSupplied: number; // day timestamp

    // Combat state
    morale: number;
    veterancy: number;
    lastBattle?: number; // day timestamp

    // Orders and AI
    orders: Array<{
        type: string;
        target?: string;
        priority: number;
        issued: number; // day timestamp
    }>;
    stance: 'aggressive' | 'defensive' | 'raiding' | 'garrison';
}

export interface Faction {
    id: string;
    name: string;
    color: string;
    culture: string;

    // Political state
    isPlayer: boolean;
    isAI: boolean;
    ruler: string; // character ID

    // Territory and power
    controlledRegions: string[];
    totalStrength: number;
    influence: number;

    // Economy
    treasury: number;
    income: number;
    expenses: number;
    stockpiles: Record<string, number>; // resource -> quantity

    // Diplomacy
    relations: Record<string, number>; // faction ID -> relation (-100 to +100)
    treaties: Array<{
        withFaction: string;
        type: 'truce' | 'trade' | 'alliance' | 'vassalage';
        signed: number; // day timestamp
        expires?: number;
    }>;

    // Military doctrine
    aggressiveness: number;
    expansionism: number;
    defensiveness: number;

    // AI state
    aiPersonality: {
        traits: string[];
        goals: Array<{
            type: string;
            target?: string;
            priority: number;
        }>;
        threatAssessment: Record<string, number>; // faction ID -> threat level
    };
}

export interface Hero {
    id: string;
    name: string;
    factionId: string;

    // Character data (integration with #16)
    level: number;
    experience: number;
    archetype: string;
    title?: string;

    // Stats and abilities
    attributes: Record<string, number>;
    skills: Record<string, number>;
    abilities: string[];
    spells: string[];
    traits: string[];

    // Equipment and inventory
    equipment: Record<string, string>; // slot -> item ID
    inventory: Array<{
        id: string;
        quantity: number;
    }>;

    // Relationships and reputation
    reputation: Record<string, number>; // faction ID -> reputation
    relationships: Record<string, number>; // character ID -> relationship

    // Current state
    location: string; // region ID or army ID
    health: number;
    fatigue: number;
    injuries: string[];

    // Quest and story state
    questFlags: Record<string, boolean>;
    completedQuests: string[];
    availableQuests: string[];
}

export interface TradeRoute {
    id: string;
    from: string; // region ID
    to: string;   // region ID
    resource: string;
    volume: number;
    profit: number;
    security: number; // risk of disruption
    active: boolean;
}

export interface Event {
    id: string;
    type: string;
    title: string;
    description: string;

    // Timing
    triggered: number; // day timestamp
    duration?: number; // days
    expires?: number;  // day timestamp

    // Scope and effects
    affectedRegions: string[];
    affectedFactions: string[];
    effects: Record<string, number>;

    // Player interaction
    requiresResponse: boolean;
    choices?: Array<{
        id: string;
        text: string;
        effects: Record<string, number>;
    }>;
    resolved?: boolean;
}

export interface CampaignStateV3 {
    schemaVersion: 3;
    buildCommit: string;
    saveTimestamp: number;

    // Campaign identity
    campaignId: string;
    campaignName: string;
    seed: string;
    rngState: string;
    difficulty: string;

    // World state
    worldClock: WorldClock;
    regions: Region[];
    roads: Road[];

    // Political entities
    factions: Faction[];
    heroes: Hero[];
    armies: Army[];

    // Economic system
    tradeRoutes: TradeRoute[];
    globalPrices: Record<string, number>; // resource -> base price

    // Dynamic events
    activeEvents: Event[];
    eventHistory: Array<{
        event: Event;
        outcome?: string;
        timestamp: number;
    }>;

    // Player state
    playerFactionId: string;
    playerHeroId: string;
    playerGold: number;
    playerReputation: Record<string, number>; // faction -> reputation

    // Combat references
    activeBattles: Array<{
        battleId: string;
        location: string;
        participants: string[]; // faction IDs
        started: number; // day timestamp
    }>;

    // Victory conditions
    objectives: Array<{
        id: string;
        type: string;
        description: string;
        target?: string;
        completed: boolean;
        failureCondition?: string;
    }>;

    // Save metadata
    playTime: number; // milliseconds
    saveSlot: string;
    manualSave: boolean;
    checksum: string;
}

/**
 * Create minimal valid campaign state for testing
 */
export function createMinimalCampaignState(overrides: Partial<CampaignStateV3> = {}): CampaignStateV3 {
    return {
        schemaVersion: CAMPAIGN_SCHEMA_VERSION,
        buildCommit: process.env.REACT_APP_GIT_COMMIT || 'dev',
        saveTimestamp: Date.now(),

        campaignId: 'campaign_' + Math.random().toString(36).substr(2, 9),
        campaignName: 'Test Campaign',
        seed: 'seed_' + Math.random().toString(36).substr(2, 9),
        rngState: '0',
        difficulty: 'normal',

        worldClock: {
            year: 1,
            season: 'spring',
            week: 1,
            day: 1,
            totalDays: 1
        },

        regions: [],
        roads: [],
        factions: [],
        heroes: [],
        armies: [],
        tradeRoutes: [],
        globalPrices: {},

        activeEvents: [],
        eventHistory: [],

        playerFactionId: '',
        playerHeroId: '',
        playerGold: 1000,
        playerReputation: {},

        activeBattles: [],
        objectives: [],

        playTime: 0,
        saveSlot: 'slot_1',
        manualSave: true,
        checksum: '',

        ...overrides
    };
}

/**
 * Validate campaign state schema compliance
 */
export function validateCampaignState(state: any): state is CampaignStateV3 {
    if (!state || typeof state !== 'object') return false;
    if (state.schemaVersion !== CAMPAIGN_SCHEMA_VERSION) return false;
    if (!state.campaignId || !state.seed || !state.worldClock) return false;

    // Validate required arrays
    if (!Array.isArray(state.regions)) return false;
    if (!Array.isArray(state.factions)) return false;
    if (!Array.isArray(state.heroes)) return false;
    if (!Array.isArray(state.armies)) return false;

    // Validate world clock
    const clock = state.worldClock;
    if (!clock.year || !clock.season || !clock.week || !clock.day) return false;

    return true;
}