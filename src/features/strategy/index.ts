/**
 * Strategic Layer - World Engine Campaign Management
 * Brigandine-style territory control with World Engine factions and lore
 */

export * from './types';
export * from './world';
export * from './economy';
export * from './time';

// Integrated Campaign Mode
export { default as IntegratedCampaign } from './IntegratedCampaign';

// Re-export key functions for easy access
export {
    routeExists,
    isInSupply,
    recomputeSupply,
    findChokepoints,
    calculateStrategicValue
} from './world';

export {
    calcIncome,
    applyIncome,
    settleUpkeep,
    resolveDeficits
} from './economy';

export {
    nextSeason,
    runSeasonStart,
    runSeasonEnd,
    getSeasonalModifier,
    isGoodSeasonFor
} from './time';