/**
 * Canvas 12 - Economy API
 * 
 * Public API and event system for inventory, markets, and trade
 */

import type {
  Item,
  Stack,
  Inventory,
  Market,
  MarketTier,
  Vendor,
  Price,
  Upkeep,
  RouteEval,
  CargoContract,
  Recipe,
  HarvestNode,
  EconomyEvent,
  EconomyEventType,
  EconomyState
} from './types';

import {
  createInventory,
  addItem,
  removeItem,
  transferItem,
  getItemQuantity,
  hasItem,
  hasItems,
  consumeItems,
  calculateEncumbrance,
  equipItem,
  unequipItem
} from './inventory';

import {
  calculatePrice,
  getMarketPrice,
  calculateRepairCost,
  calculateRepairAmount,
  createReputationModifier,
  createRumorModifier
} from './pricing';

import {
  createMarket,
  initializeStock,
  adjustStock,
  hasStock,
  getAvailableStock,
  addModifier,
  updateMarket,
  generateVendorInventory,
  isBlackMarketAvailable,
  BLACK_MARKET_MARKUP
} from './markets';

import {
  calculateUpkeep,
  processUpkeep,
  calculatePartyWages,
  createWageDebt,
  payWageDebt,
  isDesertionRisk,
  calculateDesertionChance,
  calculateStarvationPenalty,
  FOOD_COST_PER_PERSON,
  MOUNT_DAILY_COST,
  WAGON_DAILY_COST
} from './upkeep';

import {
  evaluateRoute,
  findBestRoute,
  createCargoContract,
  acceptContract,
  completeContract,
  generateConvoyContract
} from './trade';

import {
  createHarvestNode,
  isNodeReady,
  harvestNode,
  canCraftRecipe,
  craftItem,
  calculateRevivalCost,
  generateHarvestNodes,
  POTION_RECIPES,
  KIT_RECIPES
} from './reagents';

// ============================================================================
// EVENT BUS
// ============================================================================

type EventListener = (_event: EconomyEvent) => void;
const eventListeners = new Map<EconomyEventType, EventListener[]>();

/**
 * Subscribe to economy events
 */
export function subscribeToEconomyEvents(
  type: EconomyEventType,
  listener: EventListener
): () => void {
  const listeners = eventListeners.get(type) ?? [];
  listeners.push(listener);
  eventListeners.set(type, listeners);
  
  // Return unsubscribe function
  return () => {
    const current = eventListeners.get(type) ?? [];
    eventListeners.set(type, current.filter(l => l !== listener));
  };
}

/**
 * Emit economy event
 */
function emitEvent(type: EconomyEventType, data: Record<string, unknown>): void {
  const event: EconomyEvent = {
    type,
    timestamp: Date.now(),
    data
  };
  
  const listeners = eventListeners.get(type) ?? [];
  listeners.forEach(listener => listener(event));
}

// ============================================================================
// MARKET OPERATIONS
// ============================================================================

/**
 * Get market for a region
 */
export function getMarket(
  state: EconomyState,
  regionId: string
): Market | undefined {
  return state.markets.get(regionId);
}

/**
 * Get price quote for an item
 */
export function quote(
  market: Market,
  itemId: string,
  qty: number,
  itemRegistry: Map<string, Item>,
  reputation: number = 0
): Price | undefined {
  const item = itemRegistry.get(itemId);
  if (!item) return undefined;
  
  const stock = getAvailableStock(market, itemId);
  const baseStock = 10; // Simplified
  
  // Add reputation modifier
  const repMod = createReputationModifier(reputation);
  const modifiers = [...market.modifiers, repMod];
  
  const price = getMarketPrice(item, market.tier, stock, baseStock, modifiers);
  
  return {
    buy: price.buy * qty,
    sell: price.sell * qty
  };
}

/**
 * Buy item from market
 */
export function buy(
  state: EconomyState,
  regionId: string,
  itemId: string,
  qty: number,
  inventory: Inventory,
  itemRegistry: Map<string, Item>
): {
  success: boolean;
  inventory?: Inventory;
  market?: Market;
  cost?: number;
  error?: string;
} {
  const market = state.markets.get(regionId);
  if (!market) {
    return { success: false, error: 'Market not found' };
  }
  
  // Check stock
  if (!hasStock(market, itemId, qty)) {
    return { success: false, error: 'Insufficient stock' };
  }
  
  // Get price
  const priceQuote = quote(market, itemId, qty, itemRegistry);
  if (!priceQuote) {
    return { success: false, error: 'Item not found' };
  }
  
  // Check gold
  if (inventory.gold < priceQuote.buy) {
    return { success: false, error: 'Insufficient gold' };
  }
  
  // Add to inventory
  const updatedInventory = addItem(inventory, itemId, qty, itemRegistry);
  if (!updatedInventory) {
    return { success: false, error: 'Inventory full' };
  }
  
  // Deduct gold
  updatedInventory.gold -= priceQuote.buy;
  
  // Update market stock
  const updatedMarket = adjustStock(market, itemId, -qty);
  state.markets.set(regionId, updatedMarket);
  
  // Emit event
  emitEvent('econ/buy', {
    regionId,
    itemId,
    qty,
    cost: priceQuote.buy
  });
  
  return {
    success: true,
    inventory: updatedInventory,
    market: updatedMarket,
    cost: priceQuote.buy
  };
}

/**
 * Sell item to market
 */
export function sell(
  state: EconomyState,
  regionId: string,
  itemId: string,
  qty: number,
  inventory: Inventory,
  itemRegistry: Map<string, Item>
): {
  success: boolean;
  inventory?: Inventory;
  market?: Market;
  revenue?: number;
  error?: string;
} {
  const market = state.markets.get(regionId);
  if (!market) {
    return { success: false, error: 'Market not found' };
  }
  
  // Check inventory
  if (!hasItem(inventory, itemId, qty)) {
    return { success: false, error: 'Item not in inventory' };
  }
  
  // Get price
  const priceQuote = quote(market, itemId, qty, itemRegistry);
  if (!priceQuote) {
    return { success: false, error: 'Item not found' };
  }
  
  // Remove from inventory
  const updatedInventory = removeItem(inventory, itemId, qty, itemRegistry);
  if (!updatedInventory) {
    return { success: false, error: 'Cannot remove item' };
  }
  
  // Add gold
  updatedInventory.gold += priceQuote.sell;
  
  // Update market stock
  const updatedMarket = adjustStock(market, itemId, qty);
  state.markets.set(regionId, updatedMarket);
  
  // Emit event
  emitEvent('econ/sell', {
    regionId,
    itemId,
    qty,
    revenue: priceQuote.sell
  });
  
  return {
    success: true,
    inventory: updatedInventory,
    market: updatedMarket,
    revenue: priceQuote.sell
  };
}

/**
 * Repair item
 */
export function repair(
  itemId: string,
  currentDurability: number,
  inventory: Inventory,
  itemRegistry: Map<string, Item>,
  isFieldKit: boolean = false
): {
  success: boolean;
  inventory?: Inventory;
  cost?: number;
  restored?: number;
  error?: string;
} {
  const item = itemRegistry.get(itemId);
  if (!item || !item.durability) {
    return { success: false, error: 'Item cannot be repaired' };
  }
  
  const cost = calculateRepairCost(item, currentDurability, isFieldKit);
  
  if (inventory.gold < cost) {
    return { success: false, error: 'Insufficient gold' };
  }
  
  const missing = item.durability.max - currentDurability;
  const restored = calculateRepairAmount(missing, isFieldKit);
  
  // Deduct gold
  const updatedInventory = { ...inventory, gold: inventory.gold - cost };
  
  // Emit event
  emitEvent('econ/repair', {
    itemId,
    cost,
    restored,
    isFieldKit
  });
  
  return {
    success: true,
    inventory: updatedInventory,
    cost,
    restored
  };
}

/**
 * Pay daily upkeep
 */
export function payUpkeep(
  state: EconomyState,
  treasury: number,
  upkeep: Upkeep
): {
  remainingGold: number;
  debt: typeof state.wageDebt;
  paid: boolean;
} {
  const result = processUpkeep(treasury, upkeep, state.wageDebt);
  
  // Update state
  state.wageDebt = result.debt;
  
  // Emit event
  emitEvent('econ/upkeep', {
    cost: upkeep.total,
    paid: result.paid,
    debt: result.debt?.amount ?? 0
  });
  
  return result;
}

// ============================================================================
// TRADE OPERATIONS
// ============================================================================

/**
 * Evaluate trade route
 */
export function evaluateTradeRoute(
  state: EconomyState,
  originId: string,
  destinationId: string,
  manifest: Stack[],
  itemRegistry: Map<string, Item>,
  distance: number,
  upkeep: Upkeep,
  speedModifier: number = 1.0
): RouteEval | undefined {
  const origin = state.markets.get(originId);
  const destination = state.markets.get(destinationId);
  
  if (!origin || !destination) return undefined;
  
  return evaluateRoute(
    origin,
    destination,
    manifest,
    itemRegistry,
    distance,
    upkeep,
    speedModifier
  );
}

/**
 * Start cargo contract
 */
export function startContract(
  state: EconomyState,
  contractId: string
): boolean {
  const contract = state.activeContracts.find(c => c.id === contractId);
  if (!contract) return false;
  
  const updated = acceptContract(contract);
  state.activeContracts = state.activeContracts.map(c =>
    c.id === contractId ? updated : c
  );
  
  emitEvent('econ/convoyStart', { contractId });
  return true;
}

/**
 * Complete cargo contract
 */
export function finishContract(
  state: EconomyState,
  contractId: string,
  cargoIntact: boolean
): {
  success: boolean;
  payout: number;
  bonusEarned: boolean;
} {
  const contract = state.activeContracts.find(c => c.id === contractId);
  if (!contract) {
    return { success: false, payout: 0, bonusEarned: false };
  }
  
  const result = completeContract(contract, state.day, cargoIntact);
  
  // Move to completed
  state.activeContracts = state.activeContracts.filter(c => c.id !== contractId);
  state.completedContracts.push(result.contract);
  
  emitEvent('econ/convoyEnd', {
    contractId,
    payout: result.payout,
    bonusEarned: result.bonusEarned
  });
  
  return {
    success: true,
    payout: result.payout,
    bonusEarned: result.bonusEarned
  };
}

// ============================================================================
// CRAFTING OPERATIONS
// ============================================================================

/**
 * Craft item from recipe
 */
export function craft(
  recipe: Recipe,
  inventory: Inventory,
  itemRegistry: Map<string, Item>,
  seed: string
): {
  success: boolean;
  inventory?: Inventory;
  result?: Stack;
  error?: string;
} {
  // Check if can craft
  const check = canCraftRecipe(recipe, inventory.stacks, 0);
  
  if (!check.canCraft) {
    return {
      success: false,
      error: check.missingIngredients.length > 0
        ? 'Missing ingredients'
        : 'Insufficient skill'
    };
  }
  
  // Consume ingredients
  const updatedInventory = consumeItems(inventory, recipe.ingredients, itemRegistry);
  if (!updatedInventory) {
    return { success: false, error: 'Failed to consume ingredients' };
  }
  
  // Craft item
  const craftResult = craftItem(recipe, seed);
  
  if (!craftResult.success || craftResult.result.qty === 0) {
    // Crafting failed, materials partially consumed
    return {
      success: false,
      inventory: updatedInventory,
      error: 'Crafting failed'
    };
  }
  
  // Add result to inventory
  const finalInventory = addItem(
    updatedInventory,
    craftResult.result.itemId,
    craftResult.result.qty,
    itemRegistry
  );
  
  if (!finalInventory) {
    return { success: false, error: 'Inventory full' };
  }
  
  emitEvent('econ/craft', {
    recipeId: recipe.id,
    result: craftResult.result
  });
  
  return {
    success: true,
    inventory: finalInventory,
    result: craftResult.result
  };
}

/**
 * Harvest from node
 */
export function harvest(
  state: EconomyState,
  nodeId: string,
  inventory: Inventory,
  itemRegistry: Map<string, Item>,
  skillLevel: number,
  seed: string
): {
  success: boolean;
  inventory?: Inventory;
  harvested?: Stack[];
  error?: string;
} {
  const node = state.harvestNodes.get(nodeId);
  if (!node) {
    return { success: false, error: 'Harvest node not found' };
  }
  
  const result = harvestNode(node, state.day, skillLevel, seed);
  
  if (!result.success) {
    // Update node even on failure
    state.harvestNodes.set(nodeId, result.node);
    return { success: false, error: 'Harvest failed or node not ready' };
  }
  
  // Add harvested items to inventory
  let updatedInventory = inventory;
  for (const stack of result.harvested) {
    const added = addItem(updatedInventory, stack.itemId, stack.qty, itemRegistry);
    if (added) {
      updatedInventory = added;
    }
  }
  
  // Update node
  state.harvestNodes.set(nodeId, result.node);
  
  emitEvent('econ/harvest', {
    nodeId,
    harvested: result.harvested
  });
  
  return {
    success: true,
    inventory: updatedInventory,
    harvested: result.harvested
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Types
  type Item,
  type Stack,
  type Inventory,
  type Market,
  type MarketTier,
  type Vendor,
  type Price,
  type Upkeep,
  type RouteEval,
  type CargoContract,
  type Recipe,
  type HarvestNode,
  type EconomyState,
  
  // Inventory
  createInventory,
  addItem,
  removeItem,
  transferItem,
  getItemQuantity,
  hasItem,
  hasItems,
  consumeItems,
  calculateEncumbrance,
  equipItem,
  unequipItem,
  
  // Pricing
  calculatePrice,
  getMarketPrice,
  calculateRepairCost,
  createReputationModifier,
  createRumorModifier,
  
  // Markets
  createMarket,
  initializeStock,
  adjustStock,
  hasStock,
  getAvailableStock,
  addModifier,
  updateMarket,
  generateVendorInventory,
  isBlackMarketAvailable,
  BLACK_MARKET_MARKUP,
  
  // Upkeep
  calculateUpkeep,
  processUpkeep,
  calculatePartyWages,
  createWageDebt,
  payWageDebt,
  isDesertionRisk,
  calculateDesertionChance,
  calculateStarvationPenalty,
  FOOD_COST_PER_PERSON,
  MOUNT_DAILY_COST,
  WAGON_DAILY_COST,
  
  // Trade
  evaluateRoute,
  findBestRoute,
  createCargoContract,
  acceptContract,
  completeContract,
  generateConvoyContract,
  
  // Crafting
  createHarvestNode,
  isNodeReady,
  canCraftRecipe,
  calculateRevivalCost,
  generateHarvestNodes,
  POTION_RECIPES,
  KIT_RECIPES
};
