/**
 * Canvas 09 - Public API
 * 
 * Main exports for faction AI system
 */

// Re-export types
export type {
    Faction,
    Army,
    Goal,
    Order,
    Plan,
    Intel,
    AIConfig,
    AIState,
    Ethos,
    Stance,
    DoctrineFlags,
    UnitRef,
    ExecutionEvent,
    Vec2
} from './types';

// Re-export runtime functions
export {
    aiInit,
    aiRegisterFaction,
    aiRegisterArmy,
    aiTick,
    aiPlan,
    aiIssueOrder,
    aiGetIntel,
    aiGetState,
    aiReset,
    aiGetEvents
} from './runtime';

// Re-export goal generation
export {
    generateGoals,
    DEFAULT_WEIGHTS
} from './goals';

// Re-export planning
export {
    planForGoal
} from './planner';

// Re-export order execution
export {
    executeOrder,
    cancelOrder,
    canAcceptOrder,
    estimateCompletionTime
} from './orders';

// Helper functions for creating factions
export function createFaction(
    id: string,
    name: string,
    ethos: import('./types').Ethos
): import('./types').Faction {
    return {
        id,
        name,
        ethos,
        treasury: 1000,
        manpower: 500,
        caps: {
            regions: 10,
            armies: 5,
            patrols: 3
        },
        stance: 'peace',
        relations: {},
        doctrines: getDefaultDoctrines(ethos),
        regionIds: [],
        armyIds: []
    };
}

export function createArmy(
    id: string,
    name: string,
    factionId: string,
    pos: import('./types').Vec2
): import('./types').Army {
    return {
        id,
        name,
        factionId,
        pos,
        regionId: 'unknown',
        ap: 100,
        maxAp: 100,
        supply: 100,
        composition: [
            { type: 'infantry', count: 50, strength: 1.0, upkeep: 1 },
            { type: 'archer', count: 20, strength: 1.2, upkeep: 1.5 }
        ],
        morale: 100
    };
}

function getDefaultDoctrines(ethos: import('./types').Ethos): import('./types').DoctrineFlags {
    switch (ethos) {
        case 'dominion':
            return {
                aggressiveExpansion: true,
                defensiveFocus: false,
                tradeOriented: false,
                raidingCulture: true,
                diplomaticFirst: false,
                fortificationBuilder: true,
                settlerNation: false,
                denHunters: false
            };
        case 'marches':
            return {
                aggressiveExpansion: false,
                defensiveFocus: true,
                tradeOriented: false,
                raidingCulture: false,
                diplomaticFirst: false,
                fortificationBuilder: true,
                settlerNation: false,
                denHunters: true
            };
        case 'verdant':
            return {
                aggressiveExpansion: false,
                defensiveFocus: true,
                tradeOriented: false,
                raidingCulture: false,
                diplomaticFirst: true,
                fortificationBuilder: false,
                settlerNation: false,
                denHunters: true
            };
        case 'obsidian':
            return {
                aggressiveExpansion: false,
                defensiveFocus: false,
                tradeOriented: true,
                raidingCulture: false,
                diplomaticFirst: true,
                fortificationBuilder: false,
                settlerNation: true,
                denHunters: false
            };
        case 'radiant':
            return {
                aggressiveExpansion: false,
                defensiveFocus: false,
                tradeOriented: true,
                raidingCulture: false,
                diplomaticFirst: true,
                fortificationBuilder: false,
                settlerNation: true,
                denHunters: false
            };
        default:
            return {
                aggressiveExpansion: false,
                defensiveFocus: false,
                tradeOriented: false,
                raidingCulture: false,
                diplomaticFirst: false,
                fortificationBuilder: false,
                settlerNation: false,
                denHunters: false
            };
    }
}
