/**
 * Strategic Layer - World Engine Campaign Management
 * Brigandine-style territory control with World Engine factions and lore
 */

export * from './types';
export * from './world';
export * from './economy';
export * from './time';

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