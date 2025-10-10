/**
 * Canvas 09 - Order Execution
 * 
 * Runtime execution of AI orders with deterministic outcomes
 */

import type {
    Order,
    Army,
    ExecutionState,
    Faction,
    Intel
} from './types';

/**
 * Execute order for one tick
 * Returns true if order is complete
 */
export function executeOrder(
    order: Order,
    army: Army,
    _faction: Faction,
    _intel: Intel,
    dtFixed: number
): boolean {
    if (!army.executionState) {
        army.executionState = initializeExecutionState(order);
    }

    const state = army.executionState;

    switch (order.kind) {
        case 'Move':
            return executeMove(order, army, state, dtFixed);
        case 'Patrol':
            return executePatrol(order, army, state, dtFixed);
        case 'Siege':
            return executeSiege(order, army, state, dtFixed);
        case 'Raid':
            return executeRaid(order, army, state, dtFixed);
        case 'Garrison':
            return executeGarrison(order, army, state, dtFixed);
        case 'Escort':
            return executeEscort(order, army, state, dtFixed);
        case 'BuildFort':
            return executeBuildFort(order, army, state, dtFixed);
        case 'Trade':
            return executeTrade(order, army, state, dtFixed);
        case 'Negotiate':
            return executeNegotiate(order, army, state, dtFixed);
    }
}

/**
 * Initialize execution state for an order
 */
function initializeExecutionState(order: Order): ExecutionState {
    const baseState: ExecutionState = {
        currentWaypoint: 0,
        daysRemaining: 0
    };

    switch (order.kind) {
        case 'Move':
            return { ...baseState, daysRemaining: order.path.length };
        case 'Patrol':
            return { ...baseState, daysRemaining: order.days };
        case 'Siege':
            return { ...baseState, daysRemaining: order.breachDays };
        case 'Garrison':
            return { ...baseState, daysRemaining: order.daysRequired };
        case 'BuildFort':
            return { ...baseState, daysRemaining: order.buildDays };
        case 'Trade':
            return { ...baseState, daysRemaining: 7 }; // Weekly cycle
        default:
            return baseState;
    }
}

/**
 * Execute Move order
 */
function executeMove(
    order: Order & { kind: 'Move' },
    army: Army,
    state: ExecutionState,
    dtFixed: number
): boolean {
    const stepsPerDay = 1 / (dtFixed * 48); // Assuming 30fps
    const apPerStep = order.apCost / (order.path.length * stepsPerDay);

    // Consume AP
    if (army.ap >= apPerStep) {
        army.ap -= apPerStep;
        army.supply -= 0.05; // Small supply cost per step

        // Advance waypoint progress
        const progress = 1 / (order.path.length * stepsPerDay);
        if (Math.random() < progress) { // Stochastic waypoint advancement
            state.currentWaypoint++;

            // Update army position
            if (state.currentWaypoint < order.path.length) {
                army.pos = { ...order.path[state.currentWaypoint] };
            }
        }

        // Check if reached destination
        if (state.currentWaypoint >= order.path.length - 1) {
            army.pos = { ...order.path[order.path.length - 1] };
            return true; // Order complete
        }
    } else {
        // Out of AP - order stalled
        console.warn(`Army ${army.id} out of AP during move`);
    }

    return false;
}

/**
 * Execute Patrol order
 */
function executePatrol(
    order: Order & { kind: 'Patrol' },
    army: Army,
    state: ExecutionState,
    dtFixed: number
): boolean {
    const stepsPerDay = 1 / (dtFixed * 48);
    const apPerStep = order.apPerLoop / (order.loop.length * stepsPerDay);

    if (army.ap >= apPerStep) {
        army.ap -= apPerStep;
        army.supply -= 0.03;

        // Advance patrol loop
        const progress = 1 / (order.loop.length * stepsPerDay);
        if (Math.random() < progress) {
            state.currentWaypoint = (state.currentWaypoint + 1) % order.loop.length;
            army.pos = { ...order.loop[state.currentWaypoint] };
        }

        // Count down patrol days
        state.daysRemaining -= dtFixed / (24 * 60 * 60); // Convert fixed dt to days
        if (state.daysRemaining <= 0) {
            return true; // Patrol complete
        }
    }

    return false;
}

/**
 * Execute Siege order
 */
function executeSiege(
    order: Order & { kind: 'Siege' },
    army: Army,
    state: ExecutionState,
    dtFixed: number
): boolean {
    const stepsPerDay = 1 / (dtFixed * 48);

    // Siege consumes supply and reduces morale
    army.supply -= 0.1 * dtFixed / (24 * 60 * 60);
    army.morale -= 0.5 * dtFixed / (24 * 60 * 60);

    // Count down breach days
    const progress = 1 / (order.breachDays * stepsPerDay);
    if (Math.random() < progress) {
        state.daysRemaining--;

        if (state.daysRemaining <= 0) {
            // Siege successful - trigger battle
            console.log(`Siege of ${order.targetRegion} complete - initiating battle`);
            return true;
        }
    }

    // Check for siege breaking conditions
    if (army.supply < 10 || army.morale < 20) {
        console.warn(`Army ${army.id} forced to abandon siege - low supply/morale`);
        return true; // Abort siege
    }

    return false;
}

/**
 * Execute Raid order
 */
function executeRaid(
    order: Order & { kind: 'Raid' },
    army: Army,
    state: ExecutionState,
    dtFixed: number
): boolean {
    // Move to target first
    if (state.currentWaypoint < order.path.length - 1) {
        const stepsPerDay = 1 / (dtFixed * 48);
        const progress = 1 / (order.path.length * stepsPerDay);

        if (Math.random() < progress) {
            state.currentWaypoint++;
            army.pos = { ...order.path[state.currentWaypoint] };
        }
        return false;
    }

    // Execute raid
    if (!state.resourcesDelivered) {
        console.log(`Army ${army.id} raiding ${order.targetPoi} for ${order.lootValue} gold`);
        state.resourcesDelivered = true;

        // Trigger encounter/combat
        // TODO: Wire to Canvas 13 encounter system

        return true; // Raid complete
    }

    return false;
}

/**
 * Execute Garrison order
 */
function executeGarrison(
    order: Order & { kind: 'Garrison' },
    army: Army,
    state: ExecutionState,
    dtFixed: number
): boolean {
    const stepsPerDay = 1 / (dtFixed * 48);

    // Garrison slowly restores morale and reduces supply drain
    army.morale += 0.2 * dtFixed / (24 * 60 * 60);
    army.morale = Math.min(100, army.morale);
    army.supply -= 0.02 * dtFixed / (24 * 60 * 60); // Reduced drain

    // Count down garrison days
    const progress = 1 / (order.daysRequired * stepsPerDay);
    if (Math.random() < progress) {
        state.daysRemaining--;

        if (state.daysRemaining <= 0) {
            console.log(`Garrison duty complete for army ${army.id} at ${order.regionId}`);
            return true;
        }
    }

    return false;
}

/**
 * Execute Escort order
 */
function executeEscort(
    order: Order & { kind: 'Escort' },
    army: Army,
    state: ExecutionState,
    dtFixed: number
): boolean {
    // Move with convoy
    if (state.currentWaypoint < order.path.length - 1) {
        const stepsPerDay = 1 / (dtFixed * 48);
        const progress = 1 / (order.path.length * stepsPerDay * 1.5); // Slower with convoy

        if (Math.random() < progress) {
            state.currentWaypoint++;
            army.pos = { ...order.path[state.currentWaypoint] };
            army.supply -= 0.05;
        }
        return false;
    }

    // Convoy arrived
    if (!state.resourcesDelivered) {
        console.log(`Convoy ${order.convoyId} delivered successfully by army ${army.id}`);
        state.resourcesDelivered = true;
        return true;
    }

    return false;
}

/**
 * Execute BuildFort order
 */
function executeBuildFort(
    order: Order & { kind: 'BuildFort' },
    army: Army,
    state: ExecutionState,
    dtFixed: number
): boolean {
    // Move to site first
    if (state.currentWaypoint < order.path.length - 1) {
        const stepsPerDay = 1 / (dtFixed * 48);
        const progress = 1 / (order.path.length * stepsPerDay);

        if (Math.random() < progress) {
            state.currentWaypoint++;
            army.pos = { ...order.path[state.currentWaypoint] };
        }
        return false;
    }

    // Build fortification
    const stepsPerDay = 1 / (dtFixed * 48);
    const progress = 1 / (order.buildDays * stepsPerDay);

    if (Math.random() < progress) {
        state.daysRemaining--;
        army.supply -= 1.0; // Building consumes supply

        if (state.daysRemaining <= 0) {
            console.log(`Fort construction complete at ${order.nodeId} by army ${army.id}`);
            // TODO: Create fortification in world state
            return true;
        }
    }

    return false;
}

/**
 * Execute Trade order
 */
function executeTrade(
    order: Order & { kind: 'Trade' },
    army: Army,
    state: ExecutionState,
    dtFixed: number
): boolean {
    const stepsPerDay = 1 / (dtFixed * 48);

    // Trade routes run continuously
    const progress = 1 / (7 * stepsPerDay); // Weekly cycle
    if (Math.random() < progress) {
        state.daysRemaining--;

        if (state.daysRemaining <= 0) {
            console.log(`Trade route ${order.route.join('->')} generated ${order.profit} gold`);
            // TODO: Add gold to faction treasury

            // Restart cycle
            state.daysRemaining = 7;
        }
    }

    // Trade routes never "complete" - return false to continue
    return false;
}

/**
 * Execute Negotiate order
 */
function executeNegotiate(
    order: Order & { kind: 'Negotiate' },
    _army: Army,
    state: ExecutionState,
    dtFixed: number
): boolean {
    // Negotiation happens instantly but waits for acceptance
    if (state.daysRemaining === 0) {
        state.daysRemaining = 1; // Set to 1 to simulate negotiation time
    }

    state.daysRemaining -= dtFixed / (24 * 60 * 60);

    if (state.daysRemaining <= 0) {
        console.log(`Negotiation with ${order.with} complete`);
        // TODO: Apply terms to faction relations
        return true;
    }

    return false;
}

/**
 * Cancel order and reset army state
 */
export function cancelOrder(army: Army): void {
    army.orders = undefined;
    army.executionState = undefined;
    console.log(`Order cancelled for army ${army.id}`);
}

/**
 * Check if army can accept new orders
 */
export function canAcceptOrder(army: Army): boolean {
    return !army.orders || army.executionState === undefined;
}

/**
 * Estimate order completion time in days
 */
export function estimateCompletionTime(order: Order): number {
    switch (order.kind) {
        case 'Move':
            return order.path.length * 0.5; // 0.5 days per waypoint
        case 'Patrol':
            return order.days;
        case 'Siege':
            return order.breachDays;
        case 'Garrison':
            return order.daysRequired;
        case 'BuildFort':
            return order.buildDays;
        case 'Trade':
            return Infinity; // Continuous
        case 'Negotiate':
            return 1;
        default:
            return 1;
    }
}
