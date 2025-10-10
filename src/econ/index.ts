/**
 * Canvas 12 - Economy System
 * 
 * Lightweight but consequential economy that ties travel, combat, crafting,
 * and revival together. Money matters; weight matters; choices echo.
 */

// Export everything from API (which re-exports from subsystems)
export * from './api';

// Export types
export type {
  // Core types
  Item,
  Stack,
  Inventory,
  Slot,
  ItemKind,
  Rarity,
  Durability,
  EncumbranceLevel,
  EncumbranceState,
  
  // Economy types
  Price,
  Market,
  MarketTier,
  Vendor,
  VendorType,
  PriceModifier,
  ModifierType,
  
  // Upkeep types
  Upkeep,
  WageDebt,
  
  // Trade types
  RouteEval,
  CargoContract,
  
  // Crafting types
  Recipe,
  ReagentCategory,
  HarvestNode,
  
  // Event types
  EconomyEvent,
  EconomyEventType,
  EconomyState
} from './types';

// Re-export key constants
export { BLACK_MARKET_MARKUP } from './markets';
export { FOOD_COST_PER_PERSON, MOUNT_DAILY_COST, WAGON_DAILY_COST } from './upkeep';
export { POTION_RECIPES, KIT_RECIPES } from './reagents';
