/**
 * Canvas 09 - GOAP-lite Planner
 * 
 * Action simulation and value scoring for faction AI
 * Generates executable plans from high-utility goals
 */

import type {
    Faction,
    Goal,
    Plan,
    Action,
    Army,
    Intel,
    Vec2
} from './types';

export interface PlannerConfig {
    maxSearchDepth: number;     // How many actions deep to search
    maxPlansPerGoal: number;    // Max plans to evaluate per goal
    searchBudgetMs: number;     // Time budget for planning
}

const DEFAULT_CONFIG: PlannerConfig = {
    maxSearchDepth: 3,
    maxPlansPerGoal: 5,
    searchBudgetMs: 10
};

/**
 * Create executable plan from a goal
 */
export function planForGoal(
    goal: Goal,
    faction: Faction,
    armies: Army[],
    intel: Intel,
    seed: string,
    config: PlannerConfig = DEFAULT_CONFIG
): Plan | null {
    // TODO: Use config.searchBudgetMs for time-slicing

    // Select appropriate planner based on goal type
    switch (goal.type) {
        case 'SecureHeartland':
            return planSecure(goal, faction, armies, intel, seed, config);
        case 'Expand':
            return planExpand(goal, faction, armies, intel, seed, config);
        case 'Exploit':
            return planExploit(goal, faction, armies, intel, seed, config);
        case 'Punish':
            return planPunish(goal, faction, armies, intel, seed, config);
        case 'Escort':
            return planEscort(goal, faction, armies, intel, seed, config);
        case 'Stabilize':
            return planStabilize(goal, faction, armies, intel, seed, config);
        case 'Diplomacy':
            return planDiplomacy(goal, faction, armies, intel, seed, config);
        default:
            return null;
    }
}

/**
 * Plan: Secure Heartland - Move army to garrison vulnerable region
 */
function planSecure(
    goal: Goal,
    faction: Faction,
    armies: Army[],
    _intel: Intel,
    seed: string,
    _config: PlannerConfig
): Plan | null {
    if (!goal.targetRegionId) return null;

    // Find nearest available army
    const availableArmies = armies.filter(a =>
        a.factionId === faction.id && !a.orders && a.morale > 30
    );

    if (availableArmies.length === 0) return null;

    // Select strongest available army
    const army = availableArmies.sort((a, b) =>
        getTotalStrength(b) - getTotalStrength(a)
    )[0];

    // Calculate path to target region (simplified)
    const path = calculatePath(army.pos, getRegionCenter(goal.targetRegionId));
    const apCost = estimatePathCost(path);
    const durationDays = Math.ceil(apCost / army.maxAp);

    const actions: Action[] = [
        {
            type: 'Move',
            armyId: army.id,
            params: { path, targetRegion: goal.targetRegionId },
            apCost,
            supplyCost: durationDays * 2,
            durationDays,
            expectedValue: goal.value * 0.8, // Defensive value
            risk: goal.risk * 0.5 // Lower risk for defensive moves
        },
        {
            type: 'Garrison',
            armyId: army.id,
            params: { regionId: goal.targetRegionId, minStrength: 50 },
            apCost: 0,
            supplyCost: 30, // Garrison upkeep
            durationDays: 30, // Garrison for 30 days
            expectedValue: goal.value,
            risk: goal.risk
        }
    ];

    const totalValue = actions.reduce((sum, a) => sum + a.expectedValue, 0);
    const totalCost = actions.reduce((sum, a) => sum + a.apCost + a.supplyCost, 0);
    const totalRisk = Math.max(...actions.map(a => a.risk));
    const totalDuration = actions.reduce((sum, a) => sum + a.durationDays, 0);

    return {
        goalType: goal.type,
        factionId: faction.id,
        actions,
        totalValue,
        totalCost,
        totalRisk,
        valuePerDay: totalValue / totalDuration,
        planningSeed: seed
    };
}

/**
 * Plan: Expand - Capture neighbor region
 */
function planExpand(
    goal: Goal,
    faction: Faction,
    armies: Army[],
    intel: Intel,
    seed: string,
    _config: PlannerConfig
): Plan | null {
    if (!goal.targetRegionId) return null;

    const regionIntel = intel.regionStates[goal.targetRegionId];
    if (!regionIntel) return null;

    // Find strongest available army
    const availableArmies = armies.filter(a =>
        a.factionId === faction.id && !a.orders && a.morale > 40
    );

    if (availableArmies.length === 0) return null;

    const army = availableArmies.sort((a, b) =>
        getTotalStrength(b) - getTotalStrength(a)
    )[0];

    // Check if army is strong enough
    const armyStrength = getTotalStrength(army);
    if (armyStrength < regionIntel.garrisonStrength * 1.2) {
        return null; // Need 20% strength advantage
    }

    const path = calculatePath(army.pos, getRegionCenter(goal.targetRegionId));
    const apCost = estimatePathCost(path);
    const durationDays = Math.ceil(apCost / army.maxAp);
    const siegeDays = Math.ceil(regionIntel.garrisonStrength / armyStrength * 10);

    const actions: Action[] = [
        {
            type: 'Move',
            armyId: army.id,
            params: { path, targetRegion: goal.targetRegionId },
            apCost,
            supplyCost: durationDays * 2,
            durationDays,
            expectedValue: goal.value * 0.3,
            risk: goal.risk * 0.6
        },
        {
            type: 'Siege',
            armyId: army.id,
            params: { targetRegion: goal.targetRegionId, breachDays: siegeDays },
            apCost: siegeDays * 10,
            supplyCost: siegeDays * 5,
            durationDays: siegeDays,
            expectedValue: goal.value,
            risk: goal.risk
        }
    ];

    const totalValue = actions.reduce((sum, a) => sum + a.expectedValue, 0);
    const totalCost = actions.reduce((sum, a) => sum + a.apCost + a.supplyCost, 0);
    const totalRisk = Math.max(...actions.map(a => a.risk));
    const totalDuration = actions.reduce((sum, a) => sum + a.durationDays, 0);

    return {
        goalType: goal.type,
        factionId: faction.id,
        actions,
        totalValue,
        totalCost,
        totalRisk,
        valuePerDay: totalValue / totalDuration,
        planningSeed: seed
    };
}

/**
 * Plan: Exploit - Establish trade route with escorts
 */
function planExploit(
    goal: Goal,
    faction: Faction,
    armies: Army[],
    _intel: Intel,
    seed: string,
    _config: PlannerConfig
): Plan | null {
    if (!goal.targetRegionId) return null;

    // Find escort armies (smaller patrols)
    const escorts = armies.filter(a =>
        a.factionId === faction.id && !a.orders && getTotalStrength(a) < 50
    ).slice(0, 2);

    if (escorts.length === 0) return null;

    const actions: Action[] = escorts.map(army => ({
        type: 'Trade',
        armyId: army.id,
        params: {
            route: [goal.targetRegionId],
            escorts: escorts.map(e => e.id),
            profit: goal.value
        },
        apCost: 20,
        supplyCost: 10,
        durationDays: 7, // Weekly trade runs
        expectedValue: goal.value,
        risk: goal.risk
    }));

    const totalValue = actions.reduce((sum, a) => sum + a.expectedValue, 0);
    const totalCost = actions.reduce((sum, a) => sum + a.apCost + a.supplyCost, 0);
    const totalRisk = Math.max(...actions.map(a => a.risk));
    const totalDuration = Math.max(...actions.map(a => a.durationDays));

    return {
        goalType: goal.type,
        factionId: faction.id,
        actions,
        totalValue,
        totalCost,
        totalRisk,
        valuePerDay: totalValue / totalDuration,
        planningSeed: seed
    };
}

/**
 * Plan: Punish - Raid enemy infrastructure
 */
function planPunish(
    goal: Goal,
    faction: Faction,
    armies: Army[],
    _intel: Intel,
    seed: string,
    _config: PlannerConfig
): Plan | null {
    if (!goal.targetRegionId) return null;

    // Find fast mobile army for raids
    const raiders = armies.filter(a =>
        a.factionId === faction.id && !a.orders && a.morale > 50 && a.ap > 50
    );

    if (raiders.length === 0) return null;

    const army = raiders.sort((a, b) => b.ap - a.ap)[0]; // Fastest army

    const path = calculatePath(army.pos, getRegionCenter(goal.targetRegionId));
    const apCost = estimatePathCost(path) * 0.8; // Raids are faster
    const durationDays = Math.ceil(apCost / army.maxAp);

    const actions: Action[] = [
        {
            type: 'Raid',
            armyId: army.id,
            params: { targetPoi: goal.targetPoi, lootValue: goal.value, path },
            apCost,
            supplyCost: durationDays * 3,
            durationDays,
            expectedValue: goal.value,
            risk: goal.risk
        }
    ];

    const totalValue = actions.reduce((sum, a) => sum + a.expectedValue, 0);
    const totalCost = actions.reduce((sum, a) => sum + a.apCost + a.supplyCost, 0);
    const totalRisk = Math.max(...actions.map(a => a.risk));
    const totalDuration = actions.reduce((sum, a) => sum + a.durationDays, 0);

    return {
        goalType: goal.type,
        factionId: faction.id,
        actions,
        totalValue,
        totalCost,
        totalRisk,
        valuePerDay: totalValue / totalDuration,
        planningSeed: seed
    };
}

/**
 * Plan: Escort - Protect settler convoy
 */
function planEscort(
    goal: Goal,
    faction: Faction,
    armies: Army[],
    _intel: Intel,
    seed: string,
    _config: PlannerConfig
): Plan | null {
    if (!goal.targetRegionId || !goal.convoyId) return null;

    // Find strong escort army
    const escorts = armies.filter(a =>
        a.factionId === faction.id && !a.orders && getTotalStrength(a) > 40
    );

    if (escorts.length === 0) return null;

    const army = escorts.sort((a, b) => getTotalStrength(b) - getTotalStrength(a))[0];

    const path = calculatePath(army.pos, getRegionCenter(goal.targetRegionId));
    const apCost = estimatePathCost(path);
    const durationDays = Math.ceil(apCost / army.maxAp);

    const actions: Action[] = [
        {
            type: 'Escort',
            armyId: army.id,
            params: { convoyId: goal.convoyId, path, cargo: 'settlers' },
            apCost,
            supplyCost: durationDays * 4,
            durationDays,
            expectedValue: goal.value,
            risk: goal.risk
        }
    ];

    const totalValue = actions.reduce((sum, a) => sum + a.expectedValue, 0);
    const totalCost = actions.reduce((sum, a) => sum + a.apCost + a.supplyCost, 0);
    const totalRisk = Math.max(...actions.map(a => a.risk));
    const totalDuration = actions.reduce((sum, a) => sum + a.durationDays, 0);

    return {
        goalType: goal.type,
        factionId: faction.id,
        actions,
        totalValue,
        totalCost,
        totalRisk,
        valuePerDay: totalValue / totalDuration,
        planningSeed: seed
    };
}

/**
 * Plan: Stabilize - Hunt dens and clear danger
 */
function planStabilize(
    goal: Goal,
    faction: Faction,
    armies: Army[],
    _intel: Intel,
    seed: string,
    _config: PlannerConfig
): Plan | null {
    if (!goal.targetPoi) return null;

    // Find combat-ready army
    const hunters = armies.filter(a =>
        a.factionId === faction.id && !a.orders && a.morale > 50
    );

    if (hunters.length === 0) return null;

    const army = hunters.sort((a, b) => getTotalStrength(b) - getTotalStrength(a))[0];

    const path = calculatePath(army.pos, getRegionCenter(goal.targetRegionId || ''));
    const apCost = estimatePathCost(path);
    const durationDays = Math.ceil(apCost / army.maxAp) + 2; // +2 for hunting

    const actions: Action[] = [
        {
            type: 'Move',
            armyId: army.id,
            params: { path, targetRegion: goal.targetRegionId },
            apCost: apCost * 0.5,
            supplyCost: (durationDays - 2) * 2,
            durationDays: durationDays - 2,
            expectedValue: goal.value * 0.3,
            risk: goal.risk * 0.7
        },
        {
            type: 'PatrolArc',
            armyId: army.id,
            params: { targetPoi: goal.targetPoi, days: 2 },
            apCost: 20,
            supplyCost: 10,
            durationDays: 2,
            expectedValue: goal.value,
            risk: goal.risk
        }
    ];

    const totalValue = actions.reduce((sum, a) => sum + a.expectedValue, 0);
    const totalCost = actions.reduce((sum, a) => sum + a.apCost + a.supplyCost, 0);
    const totalRisk = Math.max(...actions.map(a => a.risk));
    const totalDuration = actions.reduce((sum, a) => sum + a.durationDays, 0);

    return {
        goalType: goal.type,
        factionId: faction.id,
        actions,
        totalValue,
        totalCost,
        totalRisk,
        valuePerDay: totalValue / totalDuration,
        planningSeed: seed
    };
}

/**
 * Plan: Diplomacy - Negotiate terms
 */
function planDiplomacy(
    goal: Goal,
    faction: Faction,
    _armies: Army[],
    _intel: Intel,
    seed: string,
    _config: PlannerConfig
): Plan | null {
    if (!goal.targetFactionId) return null;

    // Diplomacy actions don't require armies
    const actions: Action[] = [
        {
            type: 'Negotiate',
            armyId: '', // No army needed
            params: {
                with: goal.targetFactionId,
                terms: {
                    type: 'truce',
                    duration: 30,
                    acceptThreshold: 0.7
                }
            },
            apCost: 0,
            supplyCost: 0,
            durationDays: 1,
            expectedValue: goal.value,
            risk: 0.1
        }
    ];

    const totalValue = goal.value;
    const totalCost = goal.cost;
    const totalRisk = 0.1;

    return {
        goalType: goal.type,
        factionId: faction.id,
        actions,
        totalValue,
        totalCost,
        totalRisk,
        valuePerDay: totalValue,
        planningSeed: seed
    };
}

// ===== HELPER FUNCTIONS =====

function getTotalStrength(army: Army): number {
    return army.composition.reduce((sum, unit) =>
        sum + (unit.count * unit.strength), 0
    );
}

function calculatePath(from: Vec2, to: Vec2): Vec2[] {
    // Simplified straight-line path
    // TODO: Wire to Canvas 06 road pathfinding
    return [from, to];
}

function getRegionCenter(_regionId: string): Vec2 {
    // TODO: Wire to Canvas 07 region data
    return { x: 1024, y: 1024 };
}

function estimatePathCost(path: Vec2[]): number {
    // Calculate AP cost based on path length
    let cost = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const dx = path[i + 1].x - path[i].x;
        const dy = path[i + 1].y - path[i].y;
        cost += Math.sqrt(dx * dx + dy * dy) * 0.1; // 0.1 AP per unit distance
    }
    return Math.ceil(cost);
}
