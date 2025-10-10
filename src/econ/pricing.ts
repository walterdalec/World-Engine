/**
 * Canvas 12 - Pricing System
 * 
 * Dynamic pricing with modifiers, supply/demand, and deterministic price curves
 */

import type {
  Item,
  Price,
  PriceModifier,
  MarketTier,
  Rarity
} from './types';

// ============================================================================
// BASE PRICING
// ============================================================================

/**
 * Sell penalty (% of buy price)
 */
const BASE_SELL_PENALTY = 0.3; // 30% of buy price

/**
 * Market tier price modifiers
 */
const TIER_MODIFIERS: Record<MarketTier, number> = {
  1: 1.2,   // Village - higher prices, limited stock
  2: 1.0,   // Town - baseline
  3: 0.9,   // City - better prices, good stock
  4: 0.85   // Capital - best prices, full stock
};

/**
 * Rarity price multipliers
 */
const RARITY_MULTIPLIERS: Record<Rarity, number> = {
  0: 1.0,   // Common
  1: 2.5,   // Uncommon
  2: 7.0,   // Rare
  3: 20.0,  // Epic
  4: 50.0   // Legendary
};

/**
 * Calculate base buy price for an item
 */
export function getBaseBuyPrice(item: Item, tier: MarketTier): number {
  const rarityMultiplier = RARITY_MULTIPLIERS[item.rarity];
  const tierModifier = TIER_MODIFIERS[tier];
  
  return Math.ceil(item.value * rarityMultiplier * tierModifier);
}

/**
 * Calculate base sell price for an item
 */
export function getBaseSellPrice(item: Item, tier: MarketTier, charismaBonus: number = 0): number {
  const buyPrice = getBaseBuyPrice(item, tier);
  const sellRatio = BASE_SELL_PENALTY + charismaBonus;
  
  return Math.ceil(buyPrice * sellRatio);
}

// ============================================================================
// PRICE MODIFIERS
// ============================================================================

/**
 * Apply modifiers to a price
 */
export function applyModifiers(basePrice: number, modifiers: PriceModifier[]): number {
  let price = basePrice;
  
  for (const mod of modifiers) {
    price *= mod.factor;
  }
  
  return Math.ceil(price);
}

/**
 * Create reputation modifier
 */
export function createReputationModifier(reputation: number): PriceModifier {
  // reputation range: -100 to +100
  // -100 = 1.5x prices, +100 = 0.7x prices
  const normalized = reputation / 100; // -1 to +1
  const factor = 1.0 - (normalized * 0.3); // 1.3 to 0.7
  
  return {
    type: 'reputation',
    factor,
    reason: reputation > 0 ? 'Friendly reputation' : 'Poor reputation'
  };
}

/**
 * Create rumor/event modifier
 */
export function createRumorModifier(
  itemTags: string[],
  rumorTags: string[],
  impact: number,
  expiryDay: number
): PriceModifier | undefined {
  // Check if item is affected by rumor
  const affected = itemTags.some(tag => rumorTags.includes(tag));
  if (!affected) return undefined;
  
  return {
    type: 'rumor',
    factor: 1.0 + impact, // Impact is positive or negative
    expiry: expiryDay,
    reason: 'Recent events'
  };
}

/**
 * Create supply modifier based on stock levels
 */
export function createSupplyModifier(stock: number, baseStock: number): PriceModifier {
  const ratio = stock / baseStock;
  
  // Low stock = higher prices
  // High stock = lower prices
  let factor: number;
  if (ratio < 0.25) {
    factor = 1.5; // Scarce - 50% markup
  } else if (ratio < 0.5) {
    factor = 1.25; // Low - 25% markup
  } else if (ratio > 2.0) {
    factor = 0.8; // Abundant - 20% discount
  } else if (ratio > 1.5) {
    factor = 0.9; // High - 10% discount
  } else {
    factor = 1.0; // Normal
  }
  
  return {
    type: 'supply',
    factor,
    reason: ratio < 0.5 ? 'Low supply' : ratio > 1.5 ? 'High supply' : 'Normal supply'
  };
}

/**
 * Create demand modifier based on recent transactions
 */
export function createDemandModifier(
  recentBuys: number,
  recentSells: number,
  baselineVolume: number
): PriceModifier {
  const netDemand = recentBuys - recentSells;
  const ratio = netDemand / baselineVolume;
  
  // High demand = higher prices
  // Low demand = lower prices
  let factor: number;
  if (ratio > 2.0) {
    factor = 1.3; // High demand - 30% markup
  } else if (ratio > 1.0) {
    factor = 1.15; // Moderate demand - 15% markup
  } else if (ratio < -2.0) {
    factor = 0.8; // Low demand - 20% discount
  } else if (ratio < -1.0) {
    factor = 0.9; // Weak demand - 10% discount
  } else {
    factor = 1.0; // Normal
  }
  
  return {
    type: 'demand',
    factor,
    reason: ratio > 1.0 ? 'High demand' : ratio < -1.0 ? 'Low demand' : 'Normal demand'
  };
}

/**
 * Create distance modifier based on distance from source region
 */
export function createDistanceModifier(distance: number): PriceModifier {
  // Each 10 hexes adds 5% to price
  const factor = 1.0 + (distance / 10) * 0.05;
  
  return {
    type: 'distance',
    factor: Math.min(factor, 1.5), // Cap at 50% markup
    reason: distance > 20 ? 'Remote location' : distance > 10 ? 'Distant source' : 'Local goods'
  };
}

// ============================================================================
// PRICE CALCULATION
// ============================================================================

/**
 * Calculate final buy/sell prices with all modifiers
 */
export function calculatePrice(
  item: Item,
  tier: MarketTier,
  modifiers: PriceModifier[],
  charismaBonus: number = 0
): Price {
  const baseBuy = getBaseBuyPrice(item, tier);
  const baseSell = getBaseSellPrice(item, tier, charismaBonus);
  
  // Apply modifiers to buy price
  const finalBuy = applyModifiers(baseBuy, modifiers);
  
  // Sell price uses inverse modifiers (you get less when prices are high)
  const sellModifiers = modifiers.map(mod => ({
    ...mod,
    factor: 2.0 - mod.factor // Invert: 1.2 becomes 0.8, 0.8 becomes 1.2
  }));
  const finalSell = applyModifiers(baseSell, sellModifiers);
  
  return {
    buy: finalBuy,
    sell: finalSell
  };
}

/**
 * Get price for a specific item in a market
 */
export function getMarketPrice(
  item: Item,
  tier: MarketTier,
  stock: number,
  baseStock: number,
  modifiers: PriceModifier[],
  charismaBonus: number = 0
): Price {
  // Add supply modifier
  const supplyMod = createSupplyModifier(stock, baseStock);
  const allModifiers = [...modifiers, supplyMod];
  
  return calculatePrice(item, tier, allModifiers, charismaBonus);
}

// ============================================================================
// PRICE HISTORY & TRENDS
// ============================================================================

/**
 * Price history entry
 */
export interface PriceHistoryEntry {
  day: number;
  price: number;
  modifiers: PriceModifier[];
}

/**
 * Calculate price trend (for charts/tooltips)
 */
export function calculateTrend(history: PriceHistoryEntry[]): {
  direction: 'rising' | 'falling' | 'stable';
  change: number; // % change
} {
  if (history.length < 2) {
    return { direction: 'stable', change: 0 };
  }
  
  const recent = history[history.length - 1].price;
  const old = history[0].price;
  const change = ((recent - old) / old) * 100;
  
  let direction: 'rising' | 'falling' | 'stable';
  if (change > 5) {
    direction = 'rising';
  } else if (change < -5) {
    direction = 'falling';
  } else {
    direction = 'stable';
  }
  
  return { direction, change };
}

/**
 * Record price in history
 */
export function recordPrice(
  history: PriceHistoryEntry[],
  day: number,
  price: number,
  modifiers: PriceModifier[]
): PriceHistoryEntry[] {
  const entry: PriceHistoryEntry = { day, price, modifiers };
  
  // Keep last 30 days
  const updated = [...history, entry];
  if (updated.length > 30) {
    updated.shift();
  }
  
  return updated;
}

// ============================================================================
// REPAIR COSTS
// ============================================================================

/**
 * Calculate repair cost for damaged gear
 */
export function calculateRepairCost(
  item: Item,
  currentDurability: number,
  isFieldKit: boolean = false
): number {
  if (!item.durability) return 0;
  
  const missing = item.durability.max - currentDurability;
  const baseCost = Math.ceil(missing * item.value * 0.05);
  
  // Field kits are less efficient (higher cost, lower effectiveness)
  return isFieldKit ? Math.ceil(baseCost * 1.5) : baseCost;
}

/**
 * Calculate repair effectiveness
 * Field kits only restore 50% of missing durability
 */
export function calculateRepairAmount(
  missing: number,
  isFieldKit: boolean = false
): number {
  return isFieldKit ? Math.ceil(missing * 0.5) : missing;
}

// ============================================================================
// DETERMINISTIC PRICE GENERATION
// ============================================================================

/**
 * Generate deterministic price variation based on seed
 * Used for consistent price curves across saves
 */
export function generatePriceVariation(
  basePrice: number,
  seed: string,
  day: number
): number {
  // Simple hash-based PRNG for determinism
  let hash = 0;
  const combined = `${seed}-${day}`;
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Generate variation: -10% to +10%
  const normalized = (Math.abs(hash) % 1000) / 1000; // 0 to 1
  const variation = (normalized * 0.2) - 0.1; // -0.1 to +0.1
  
  return Math.ceil(basePrice * (1.0 + variation));
}

/**
 * Calculate modifier decay (modifiers fade over time)
 */
export function decayModifiers(
  modifiers: PriceModifier[],
  currentDay: number,
  halfLife: number = 7
): PriceModifier[] {
  return modifiers
    .filter(mod => !mod.expiry || mod.expiry > currentDay) // Remove expired
    .map(mod => {
      // Decay temporary modifiers toward 1.0
      if (mod.type === 'rumor' || mod.type === 'event') {
        const daysSince = mod.expiry ? (mod.expiry - currentDay) : 0;
        const decayFactor = Math.pow(0.5, daysSince / halfLife);
        const decayedFactor = 1.0 + ((mod.factor - 1.0) * decayFactor);
        
        return { ...mod, factor: decayedFactor };
      }
      
      return mod;
    });
}
