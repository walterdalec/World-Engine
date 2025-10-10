/**
 * Canvas 09 - Runtime & Time Integration
 * 
 * Main AI tick system with Canvas 08 integration
 * Handles planning windows, order execution, and deterministic seeds
 */

import type { TickContext } from '../core/time';
import type {
    AIConfig,
    AIState,
    Faction,
    Army,
    Intel,
    ExecutionEvent
} from './types';
import { registerSystem, DT_FIXED } from '../core/time';
import { generateGoals } from './goals';
import { planForGoal } from './planner';
import { executeOrder, canAcceptOrder } from './orders';

// Global AI state
let aiState: AIState = {
    factions: {},
    armies: {},
    intel: {},
    lastPlanningTime: 0,
    pendingOrders: [],
    executionLog: []
};

let aiConfig: AIConfig = {
    planningWindowHours: 2,
    searchMsPerFrame: 3,
    maxSearchDepth: 3,
    defaultUtilityWeights: {
        value: 1.0,
        pressure: 0.8,
        ethos: 0.6,
        econ: 0.7,
        risk: -1.2,
        cost: -0.5
    }
};

let isInitialized = false;

/**
 * Initialize AI system and register with time system
 */
export function aiInit(config: Partial<AIConfig> = {}): void {
    aiConfig = { ...aiConfig, ...config };
    isInitialized = true;

    // Reset last planning time to trigger immediate planning
    aiState.lastPlanningTime = -999999; // Force first planning on next tick

    // Register with Canvas 08 time system
    registerSystem(
        {
            id: 'faction-ai',
            idlePolicy: 'pause', // AI stops during pause
            order: 'main'
        },
        (ctx: TickContext) => {
            aiTick(ctx);
        }
    );

    console.log('🏛️ Faction AI initialized with config:', aiConfig);
    console.log('🏛️ First planning will occur within 2 in-game hours (~22 seconds at 4x speed)');
}

/**
 * Main AI tick - executes orders
 */
export function aiTick(ctx: TickContext): void {
    if (!isInitialized) return;

    const currentTimeHours = ctx.timeSec / 3600;

    // Check if we should run planning
    const hoursSinceLastPlan = currentTimeHours - (aiState.lastPlanningTime / 3600);

    // Debug logging every 30 seconds (900 steps at 30fps)
    if (ctx.stepIndex % 900 === 0) {
        console.log(`🏛️ AI Status: ${hoursSinceLastPlan.toFixed(2)}h / ${aiConfig.planningWindowHours}h until next planning (Day ${ctx.day}, Step ${ctx.stepIndex})`);
    }

    if (hoursSinceLastPlan >= aiConfig.planningWindowHours) {
        aiPlan(ctx.timeSec, ctx.day, ctx.stepIndex);
    }

    // Execute orders for all armies
    const armies = Object.values(aiState.armies);
    for (const army of armies) {
        if (army.orders) {
            const complete = executeOrder(
                army.orders,
                army,
                aiState.factions[army.factionId],
                aiState.intel[army.factionId],
                DT_FIXED
            );

            if (complete) {
                logEvent({
                    timestamp: ctx.timeSec,
                    factionId: army.factionId,
                    armyId: army.id,
                    eventType: 'order_completed',
                    payload: { order: army.orders }
                });

                army.orders = undefined;
                army.executionState = undefined;
            }
        }

        // Restore AP each day
        if (ctx.stepIndex % (48 * 30) === 0) { // Assuming 30fps, 48 steps = 1 day
            army.ap = army.maxAp;
        }
    }
}

/**
 * AI Planning - runs at planning window boundaries
 */
export function aiPlan(currentTime: number, day: number, _step: number): void {
    if (!isInitialized) return;

    aiState.lastPlanningTime = currentTime;
    const hour = Math.floor((currentTime % (24 * 3600)) / 3600);

    console.log(`🏛️ AI Planning at Day ${day}, Hour ${hour}`);

    // Plan for each faction
    for (const faction of Object.values(aiState.factions)) {
        planForFaction(faction, currentTime, day, hour);
    }
}

/**
 * Plan for a single faction
 */
function planForFaction(faction: Faction, currentTime: number, day: number, hour: number): void {
    // Generate planning seed for determinism
    const planningSeed = `${faction.id}_${day}_${hour}`;

    // Get faction intel
    const intel = aiState.intel[faction.id];
    if (!intel) return;

    // Get faction armies
    const armies = faction.armyIds
        .map(id => aiState.armies[id])
        .filter(a => a !== undefined);

    // Generate goals
    const goals = generateGoals(
        faction,
        intel,
        armies,
        aiConfig.defaultUtilityWeights
    );

    if (goals.length === 0) {
        console.log(`  Faction ${faction.id}: No goals generated`);
        return;
    }

    // Log top goal
    logEvent({
        timestamp: currentTime,
        factionId: faction.id,
        eventType: 'goal_generated',
        payload: { goal: goals[0] }
    });

    // Plan for top 3 goals
    const topGoals = goals.slice(0, 3);
    for (const goal of topGoals) {
        const plan = planForGoal(
            goal,
            faction,
            armies,
            intel,
            planningSeed,
            {
                maxSearchDepth: aiConfig.maxSearchDepth,
                maxPlansPerGoal: 3,
                searchBudgetMs: aiConfig.searchMsPerFrame
            }
        );

        if (plan && plan.valuePerDay > 0) {
            // Issue orders from plan
            for (const action of plan.actions) {
                if (action.armyId) {
                    const army = aiState.armies[action.armyId];
                    if (army && canAcceptOrder(army)) {
                        issueOrderFromAction(army, action, planningSeed);
                    }
                }
            }

            logEvent({
                timestamp: currentTime,
                factionId: faction.id,
                eventType: 'plan_created',
                payload: { goal: goal.type, plan }
            });

            break; // Only execute one plan per faction per window
        }
    }
}

/**
 * Issue order from a plan action
 */
function issueOrderFromAction(army: Army, action: any, seed: string): void {
    let order: any;

    switch (action.type) {
        case 'Move':
            order = {
                kind: 'Move',
                path: action.params.path,
                apCost: action.apCost
            };
            break;
        case 'Garrison':
            order = {
                kind: 'Garrison',
                regionId: action.params.regionId,
                minStrength: action.params.minStrength,
                daysRequired: action.durationDays
            };
            break;
        case 'Siege':
            order = {
                kind: 'Siege',
                targetRegion: action.params.targetRegion,
                breachDays: action.params.breachDays,
                startDay: 0
            };
            break;
        case 'Raid':
            order = {
                kind: 'Raid',
                targetPoi: action.params.targetPoi,
                path: action.params.path,
                lootValue: action.params.lootValue
            };
            break;
        case 'Escort':
            order = {
                kind: 'Escort',
                convoyId: action.params.convoyId,
                path: action.params.path,
                cargo: action.params.cargo
            };
            break;
        case 'Trade':
            order = {
                kind: 'Trade',
                route: action.params.route,
                escorts: action.params.escorts,
                profit: action.params.profit
            };
            break;
        case 'PatrolArc':
            order = {
                kind: 'Patrol',
                loop: [army.pos, army.pos], // Simplified patrol loop
                days: action.durationDays,
                apPerLoop: action.apCost
            };
            break;
        case 'Negotiate':
            order = {
                kind: 'Negotiate',
                with: action.params.with,
                terms: action.params.terms
            };
            break;
        default:
            console.warn(`Unknown action type: ${action.type}`);
            return;
    }

    army.orders = order;

    logEvent({
        timestamp: Date.now() / 1000,
        factionId: army.factionId,
        armyId: army.id,
        eventType: 'order_issued',
        payload: { order, seed }
    });

    console.log(`  Army ${army.id} issued ${order.kind} order`);
}

/**
 * Register a faction with AI system
 */
export function aiRegisterFaction(faction: Faction): void {
    aiState.factions[faction.id] = faction;

    // Initialize empty intel
    aiState.intel[faction.id] = {
        factionId: faction.id,
        visibleArmies: [],
        sightings: [],
        dangerFields: [],
        regionStates: {}
    };

    console.log(`🏛️ Registered faction: ${faction.name} (${faction.ethos})`);
}

/**
 * Register an army with AI system
 */
export function aiRegisterArmy(army: Army): void {
    aiState.armies[army.id] = army;
}

/**
 * Issue manual order (for testing/debugging)
 */
export function aiIssueOrder(armyId: string, order: any): void {
    const army = aiState.armies[armyId];
    if (!army) {
        console.warn(`Army ${armyId} not found`);
        return;
    }

    if (!canAcceptOrder(army)) {
        console.warn(`Army ${armyId} cannot accept orders (busy)`);
        return;
    }

    army.orders = order;
    console.log(`Manually issued ${order.kind} order to army ${armyId}`);
}

/**
 * Get intel for faction (for UI/debug)
 */
export function aiGetIntel(factionId: string): Intel | undefined {
    return aiState.intel[factionId];
}

/**
 * Get full AI state (for debugging)
 */
export function aiGetState(): AIState {
    return aiState;
}

/**
 * Reset AI state (for testing)
 */
export function aiReset(): void {
    aiState = {
        factions: {},
        armies: {},
        intel: {},
        lastPlanningTime: 0,
        pendingOrders: [],
        executionLog: []
    };
    isInitialized = false;
    console.log('🏛️ AI state reset');
}

/**
 * Log AI event
 */
function logEvent(event: ExecutionEvent): void {
    aiState.executionLog.push(event);

    // Keep log size manageable (last 1000 events)
    if (aiState.executionLog.length > 1000) {
        aiState.executionLog = aiState.executionLog.slice(-1000);
    }
}

/**
 * Get recent events for faction
 */
export function aiGetEvents(factionId: string, limit: number = 10): ExecutionEvent[] {
    return aiState.executionLog
        .filter(e => e.factionId === factionId)
        .slice(-limit);
}
