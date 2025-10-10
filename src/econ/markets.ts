/**
 * Canvas 12 - Markets & Vendors
 * 
 * Regional markets, vendor inventories, stock management, and restocking
 */

import type {
  Market,
  MarketTier,
  Vendor,
  VendorType,
  Stack,
  Item,
  PriceModifier
} from './types';
import { SeededRandom } from '../proc/noise';

// ============================================================================
// MARKET CREATION
// ============================================================================

/**
 * Base stock quantities by market tier
 */
const BASE_STOCK_BY_TIER: Record<MarketTier, number> = {
  1: 5,    // Village - limited stock
  2: 15,   // Town - moderate stock
  3: 30,   // City - good stock
  4: 50    // Capital - abundant stock
};

/**
 * Restock interval by market tier (in days)
 */
const RESTOCK_INTERVAL: Record<MarketTier, number> = {
  1: 7,    // Weekly
  2: 5,    // Every 5 days
  3: 3,    // Every 3 days
  4: 2     // Every 2 days
};

/**
 * Create a new market for a region
 */
export function createMarket(
  regionId: string,
  tier: MarketTier,
  currentDay: number = 0
): Market {
  return {
    regionId,
    tier,
    stock: {},
    modifiers: [],
    vendors: [],
    lastUpdate: currentDay
  };
}

/**
 * Get base stock quantity for item in market
 */
export function getBaseStock(tier: MarketTier, rarity: number): number {
  const base = BASE_STOCK_BY_TIER[tier];
  
  // Rarity affects stock: common items have more, rare items have less
  const rarityMultiplier = [1.0, 0.6, 0.3, 0.1, 0.05][rarity] ?? 0.05;
  
  return Math.max(1, Math.ceil(base * rarityMultiplier));
}

/**
 * Initialize stock for an item
 */
export function initializeStock(
  market: Market,
  itemId: string,
  rarity: number
): Market {
  const baseStock = getBaseStock(market.tier, rarity);
  
  return {
    ...market,
    stock: {
      ...market.stock,
      [itemId]: baseStock
    }
  };
}

// ============================================================================
// VENDOR MANAGEMENT
// ============================================================================

/**
 * Vendor stock templates by type
 */
const VENDOR_ITEM_TAGS: Record<VendorType, string[]> = {
  general: ['food', 'basic', 'tool', 'common'],
  smith: ['weapon', 'armor', 'metal', 'repair'],
  apothecary: ['potion', 'reagent', 'herb', 'healing'],
  enchanter: ['magic', 'scroll', 'arcane', 'enchantment'],
  stable: ['mount', 'feed', 'wagon', 'tack'],
  trader: ['cargo', 'luxury', 'trade', 'exotic'],
  blackmarket: ['contraband', 'rare', 'revival', 'forbidden']
};

/**
 * Vendor availability by market tier
 */
const VENDOR_TIERS: Record<VendorType, MarketTier> = {
  general: 1,      // Available everywhere
  smith: 1,        // Available everywhere
  apothecary: 2,   // Towns and above
  enchanter: 3,    // Cities and above
  stable: 2,       // Towns and above
  trader: 2,       // Towns and above
  blackmarket: 3   // Cities and above (hidden)
};

/**
 * Create a vendor
 */
export function createVendor(
  id: string,
  name: string,
  type: VendorType,
  regionId: string,
  currentDay: number
): Vendor {
  return {
    id,
    name,
    type,
    regionId,
    inventory: [],
    buyback: [],
    restockDay: currentDay + RESTOCK_INTERVAL[1], // Default to town interval
    reputation: 0,
    tags: []
  };
}

/**
 * Check if vendor type is available in market tier
 */
export function isVendorAvailable(type: VendorType, tier: MarketTier): boolean {
  return tier >= VENDOR_TIERS[type];
}

/**
 * Get vendor types available in market tier
 */
export function getAvailableVendorTypes(tier: MarketTier): VendorType[] {
  return (Object.keys(VENDOR_TIERS) as VendorType[])
    .filter(type => isVendorAvailable(type, tier));
}

/**
 * Check if item matches vendor's specialty
 */
export function matchesVendor(item: Item, vendorType: VendorType): boolean {
  const vendorTags = VENDOR_ITEM_TAGS[vendorType];
  if (!item.tags) return false;
  
  return item.tags.some(tag => vendorTags.includes(tag));
}

/**
 * Generate vendor inventory from item registry
 */
export function generateVendorInventory(
  vendor: Vendor,
  itemRegistry: Map<string, Item>,
  tier: MarketTier,
  seed: string
): Stack[] {
  const rng = new SeededRandom(seed);
  const inventory: Stack[] = [];
  
  // Filter items that match vendor type
  const matchingItems = Array.from(itemRegistry.values())
    .filter(item => matchesVendor(item, vendor.type));
  
  // Add items with availability based on rarity
  for (const item of matchingItems) {
    // Chance to stock item (lower rarity = higher chance)
    const stockChance = [1.0, 0.8, 0.5, 0.2, 0.05][item.rarity] ?? 0.05;
    
    if (rng.next() < stockChance) {
      const qty = getBaseStock(tier, item.rarity);
      inventory.push({ itemId: item.id, qty });
    }
  }
  
  return inventory;
}

/**
 * Restock vendor inventory
 */
export function restockVendor(
  vendor: Vendor,
  itemRegistry: Map<string, Item>,
  tier: MarketTier,
  currentDay: number,
  seed: string
): Vendor {
  // Check if restock is due
  if (currentDay < vendor.restockDay) {
    return vendor;
  }
  
  // Generate new inventory (partial restock)
  const newInventory = generateVendorInventory(vendor, itemRegistry, tier, `${seed}-${currentDay}`);
  
  // Merge with existing inventory (add to existing stacks)
  const mergedInventory = [...vendor.inventory];
  
  for (const newStack of newInventory) {
    const existing = mergedInventory.find(s => s.itemId === newStack.itemId);
    if (existing) {
      // Add 50% of new stock to existing
      existing.qty += Math.ceil(newStack.qty * 0.5);
    } else {
      // Add full new stack
      mergedInventory.push(newStack);
    }
  }
  
  // Clear old buyback items (kept for future implementation)
  
  return {
    ...vendor,
    inventory: mergedInventory,
    buyback: [], // Clear buyback for simplicity
    restockDay: currentDay + RESTOCK_INTERVAL[tier]
  };
}

// ============================================================================
// STOCK MANAGEMENT
// ============================================================================

/**
 * Adjust stock after purchase
 */
export function adjustStock(
  market: Market,
  itemId: string,
  delta: number
): Market {
  const currentStock = market.stock[itemId] ?? 0;
  const newStock = Math.max(0, currentStock + delta);
  
  return {
    ...market,
    stock: {
      ...market.stock,
      [itemId]: newStock
    }
  };
}

/**
 * Check if item is in stock
 */
export function hasStock(market: Market, itemId: string, qty: number = 1): boolean {
  const stock = market.stock[itemId] ?? 0;
  return stock >= qty;
}

/**
 * Get available quantity
 */
export function getAvailableStock(market: Market, itemId: string): number {
  return market.stock[itemId] ?? 0;
}

// ============================================================================
// MODIFIER MANAGEMENT
// ============================================================================

/**
 * Add price modifier to market
 */
export function addModifier(market: Market, modifier: PriceModifier): Market {
  // Check if modifier type already exists
  const existing = market.modifiers.find(m => m.type === modifier.type);
  
  if (existing) {
    // Update existing modifier
    return {
      ...market,
      modifiers: market.modifiers.map(m =>
        m.type === modifier.type ? modifier : m
      )
    };
  } else {
    // Add new modifier
    return {
      ...market,
      modifiers: [...market.modifiers, modifier]
    };
  }
}

/**
 * Remove modifier from market
 */
export function removeModifier(market: Market, type: string): Market {
  return {
    ...market,
    modifiers: market.modifiers.filter(m => m.type !== type)
  };
}

/**
 * Update market modifiers (remove expired, decay temporary)
 */
export function updateModifiers(market: Market, currentDay: number): Market {
  const updated = market.modifiers
    .filter(mod => !mod.expiry || mod.expiry > currentDay) // Remove expired
    .map(mod => {
      // Decay temporary modifiers
      if (mod.type === 'rumor' || mod.type === 'event') {
        const daysRemaining = mod.expiry ? mod.expiry - currentDay : 0;
        const decayFactor = daysRemaining / 7; // Decay over 7 days
        const decayedFactor = 1.0 + ((mod.factor - 1.0) * decayFactor);
        
        return { ...mod, factor: decayedFactor };
      }
      
      return mod;
    });
  
  return {
    ...market,
    modifiers: updated,
    lastUpdate: currentDay
  };
}

// ============================================================================
// BLACK MARKET
// ============================================================================

/**
 * Check if black market is available (requires low order or high fear)
 */
export function isBlackMarketAvailable(
  order: number,  // 0-100, higher = more law
  fear: number    // 0-100, higher = more fear
): boolean {
  return order < 40 || fear > 60;
}

/**
 * Create black market vendor
 */
export function createBlackMarketVendor(
  regionId: string,
  currentDay: number
): Vendor {
  return createVendor(
    `${regionId}-blackmarket`,
    'Shadowy Figure',
    'blackmarket',
    regionId,
    currentDay
  );
}

/**
 * Black market markup (2x base prices)
 */
export const BLACK_MARKET_MARKUP = 2.0;

// ============================================================================
// MARKET UPDATES
// ============================================================================

/**
 * Daily market update
 * - Decay modifiers
 * - Restock vendors
 * - Update stock levels
 */
export function updateMarket(
  market: Market,
  vendors: Vendor[],
  itemRegistry: Map<string, Item>,
  currentDay: number,
  seed: string
): { market: Market; vendors: Vendor[] } {
  // Update modifiers
  const updatedMarket = updateModifiers(market, currentDay);
  
  // Restock vendors
  const updatedVendors = vendors.map(vendor =>
    restockVendor(vendor, itemRegistry, market.tier, currentDay, `${seed}-${vendor.id}`)
  );
  
  return {
    market: updatedMarket,
    vendors: updatedVendors
  };
}
