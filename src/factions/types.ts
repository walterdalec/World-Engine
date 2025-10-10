/**
 * Canvas 09 - AI Faction Types
 * 
 * Core data structures for autonomous faction AI including:
 * - Faction state and relations
 * - Army composition and orders
 * - Goal utilities and planning
 */

export type Vec2 = { x: number; y: number };

// ===== FACTION CORE =====

export type Ethos =
    | 'dominion'    // Aggressive expansion, military focused
    | 'marches'     // Defensive, fortification focused
    | 'verdant'     // Nature-aligned, anti-expansion
    | 'obsidian'    // Trade/economic focused
    | 'radiant';    // Diplomatic, peace focused

export type Stance = 'peace' | 'tense' | 'war';

export interface DoctrineFlags {
    aggressiveExpansion: boolean;      // Prioritize Expand goals
    defensiveFocus: boolean;            // Prioritize Secure/Garrison
    tradeOriented: boolean;             // Prioritize Exploit/Trade
    raidingCulture: boolean;            // Prioritize Punish/Raid
    diplomaticFirst: boolean;           // Prefer negotiation over war
    fortificationBuilder: boolean;      // Build forts at chokepoints
    settlerNation: boolean;             // Establish new towns
    denHunters: boolean;                // Prioritize Stabilize goals
}

export interface Relation {
    factionId: string;
    opinion: number;            // -100 to 100
    truceUntil: number;         // SimTime timestamp (0 = no truce)
    warExhaustion: number;      // 0-1, accumulated over war
    tradeVolume: number;        // gold/day flowing between factions
    borderIncidents: number;    // recent clashes
    lastDiplomacy: number;      // timestamp of last negotiation
}

export interface Faction {
    id: string;
    name: string;
    ethos: Ethos;
    treasury: number;
    manpower: number;           // Recruitment pool
    caps: {
        regions: number;          // Max owned regions
        armies: number;           // Max army stacks
        patrols: number;          // Max patrol groups
    };
    stance: Stance;
    relations: Record<string, Relation>;
    doctrines: DoctrineFlags;
    regionIds: string[];        // Owned region IDs
    armyIds: string[];          // Controlled army IDs
}

// ===== ARMY & UNITS =====

export interface UnitRef {
    type: string;               // 'infantry' | 'cavalry' | 'archer' | 'siege' | etc.
    count: number;
    strength: number;           // Combat power per unit
    upkeep: number;             // Gold/day per unit
}

export interface Army {
    id: string;
    name: string;
    factionId: string;
    pos: Vec2;
    regionId: string;           // Current region
    ap: number;                 // Action points (movement budget)
    maxAp: number;
    supply: number;             // Supply points (0-100)
    composition: UnitRef[];
    morale: number;             // 0-100
    orders?: Order;
    executionState?: ExecutionState;
}

export interface ExecutionState {
    currentWaypoint: number;    // Index in path/loop
    daysRemaining: number;      // For timed orders (Patrol, Siege)
    resourcesDelivered?: boolean;
    convoyId?: string;
    targetPoi?: string;
}

// ===== ORDERS =====

export type Order =
    | { kind: 'Move'; path: Vec2[]; apCost: number }
    | { kind: 'Patrol'; loop: Vec2[]; days: number; apPerLoop: number }
    | { kind: 'Siege'; targetRegion: string; breachDays: number; startDay: number }
    | { kind: 'Raid'; targetPoi: string; path: Vec2[]; lootValue: number }
    | { kind: 'Garrison'; regionId: string; minStrength: number; daysRequired: number }
    | { kind: 'Escort'; convoyId: string; path: Vec2[]; cargo: string }
    | { kind: 'BuildFort'; nodeId: string; path: Vec2[]; buildDays: number }
    | { kind: 'Trade'; route: string[]; escorts: string[]; profit: number }
    | { kind: 'Negotiate'; with: string; terms: Terms };

export interface Terms {
    type: 'truce' | 'tribute' | 'alliance' | 'trade_agreement';
    duration?: number;          // Days (for truce)
    goldAmount?: number;        // For tribute/trade
    regionIds?: string[];       // Territorial concessions
    acceptThreshold: number;    // Probability [0-1] based on power balance
}

// ===== GOALS & PLANNING =====

export type GoalType =
    | 'SecureHeartland'
    | 'Expand'
    | 'Exploit'
    | 'Punish'
    | 'Escort'
    | 'Stabilize'
    | 'Diplomacy';

export interface Goal {
    type: GoalType;
    factionId: string;
    utility: number;            // Computed U score
    targetRegionId?: string;
    targetFactionId?: string;
    targetPoi?: string;
    convoyId?: string;
    value: number;              // Expected gain
    risk: number;               // Expected loss/cost
    cost: number;               // Opportunity cost (AP, gold, manpower)
}

export interface UtilityWeights {
    value: number;              // Weight for direct value (gold, regions)
    pressure: number;           // Weight for border threat
    ethos: number;              // Weight for doctrine alignment
    econ: number;               // Weight for economic benefit
    risk: number;               // Weight for danger (negative)
    cost: number;               // Weight for opportunity cost (negative)
}

// ===== PLANNING =====

export interface Action {
    type: string;               // 'Move' | 'Garrison' | 'PatrolArc' | etc.
    armyId: string;
    params: any;                // Action-specific parameters
    apCost: number;
    supplyCost: number;
    durationDays: number;
    expectedValue: number;      // Estimated outcome value
    risk: number;               // Risk factor [0-1]
}

export interface Plan {
    goalType: GoalType;
    factionId: string;
    actions: Action[];
    totalValue: number;         // Sum of expectedValue
    totalCost: number;          // Sum of AP/supply/gold costs
    totalRisk: number;          // Compound risk
    valuePerDay: number;        // totalValue / sum(durationDays)
    planningSeed: string;       // For determinism
}

// ===== INTEL & SENSORS =====

export interface Sighting {
    timestamp: number;          // SimTime
    observerFactionId: string;
    targetArmyId: string;
    pos: Vec2;
    estimatedStrength: number;
    hostile: boolean;
}

export interface DangerField {
    regionId: string;
    threatLevel: number;        // 0-1 (from dens, ruins, bandits)
    sources: string[];          // POI IDs causing danger
    lastUpdated: number;
}

export interface Intel {
    factionId: string;
    visibleArmies: string[];    // Army IDs currently seen
    sightings: Sighting[];      // Recent sightings (last 7 days)
    dangerFields: DangerField[];
    regionStates: Record<string, RegionIntel>;
}

export interface RegionIntel {
    regionId: string;
    owner: string | null;
    contested: boolean;
    garrisonStrength: number;   // Estimated
    tier: number;
    lastSeen: number;
}

// ===== RUNTIME =====

export interface AIConfig {
    planningWindowHours: number;    // How often to replan (default: 2)
    searchMsPerFrame: number;       // Time budget per frame (default: 3)
    maxSearchDepth: number;         // GOAP rollout depth (default: 3)
    defaultUtilityWeights: UtilityWeights;
}

export interface AIState {
    factions: Record<string, Faction>;
    armies: Record<string, Army>;
    intel: Record<string, Intel>;
    lastPlanningTime: number;       // SimTime of last planning window
    pendingOrders: Order[];         // Queued orders to issue
    executionLog: ExecutionEvent[];
}

export interface ExecutionEvent {
    timestamp: number;
    factionId: string;
    armyId?: string;
    eventType:
    | 'goal_generated'
    | 'plan_created'
    | 'order_issued'
    | 'order_executed'
    | 'order_completed'
    | 'battle_outcome'
    | 'diplomacy_result';
    payload: any;
}

// ===== LOGISTICS =====

export interface Convoy {
    id: string;
    factionId: string;
    cargo: string;              // 'settlers' | 'trade_goods' | 'supplies'
    value: number;              // Gold value
    path: Vec2[];
    pos: Vec2;
    escortArmyIds: string[];
    hp: number;                 // 0-100, reduced by raids
    arrived: boolean;
}

export interface SupplyState {
    armyId: string;
    supply: number;             // 0-100
    consumptionRate: number;    // Points per day
    lastResupply: number;       // SimTime
    nearestSupplyDepot: string; // Region ID
}
