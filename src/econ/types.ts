/**
 * Canvas 12 - Economy Types
 * 
 * Core type definitions for inventory, markets, pricing, and trade systems
 */

// ============================================================================
// ITEMS & INVENTORY
// ============================================================================

/**
 * Equipment slots for characters
 */
export type Slot = 
  | 'head' 
  | 'chest' 
  | 'hands' 
  | 'legs' 
  | 'feet' 
  | 'neck' 
  | 'ring' 
  | 'main' 
  | 'off' 
  | 'twohand' 
  | 'trinket';

/**
 * Item categories
 */
export type ItemKind = 
  | 'gear'        // Equipment
  | 'consumable'  // Potions, food, scrolls
  | 'reagent'     // Crafting materials, revival components
  | 'cargo'       // Trade goods
  | 'quest';      // Quest items

/**
 * Item rarity tiers
 */
export type Rarity = 0 | 1 | 2 | 3 | 4; // Common | Uncommon | Rare | Epic | Legendary

/**
 * Durability tracking for gear
 */
export interface Durability {
  cur: number;  // Current durability
  max: number;  // Maximum durability
}

/**
 * Item effect placeholder (detailed in Canvas 18)
 */
export interface Effect {
  type: string;
  value: number;
  duration?: number;
}

/**
 * Core item definition
 */
export interface Item {
  id: string;
  name: string;
  kind: ItemKind;
  weight: number;           // In pounds
  value: number;            // Base gold value
  rarity: Rarity;
  description?: string;
  durability?: Durability;
  tags?: string[];          // For filtering and mechanics
  effects?: Effect[];       // Stat bonuses, buffs, etc.
  slot?: Slot;              // Equipment slot if gear
  twoHanded?: boolean;      // Requires both main/off slots
  soulbound?: boolean;      // Cannot be traded or sold
  stackable?: boolean;      // Can stack in inventory
  maxStack?: number;        // Max stack size
}

/**
 * Stacked items in inventory
 */
export interface Stack {
  itemId: string;
  qty: number;
  condition?: number; // For gear, average durability %
}

/**
 * Inventory container
 */
export interface Inventory {
  capacity: number;   // Max weight capacity
  weight: number;     // Current weight
  stacks: Stack[];    // Item stacks
  gold: number;       // Currency
}

/**
 * Encumbrance levels affecting travel and combat
 */
export type EncumbranceLevel = 'light' | 'normal' | 'heavy' | 'overloaded';

export interface EncumbranceState {
  level: EncumbranceLevel;
  ratio: number;              // weight/capacity
  speedModifier: number;      // Travel speed multiplier
  escapeModifier: number;     // Escape chance multiplier
  staminaCost: number;        // Stamina drain multiplier
}

// ============================================================================
// ECONOMY & MARKETS
// ============================================================================

/**
 * Buy/sell prices for an item
 */
export interface Price {
  buy: number;
  sell: number;
}

/**
 * Region market tier
 */
export type MarketTier = 1 | 2 | 3 | 4; // Village | Town | City | Capital

/**
 * Price modifier types
 */
export type ModifierType = 
  | 'reputation'    // Faction standing
  | 'rumor'         // Events and news
  | 'supply'        // Stock levels
  | 'demand'        // Recent transactions
  | 'distance'      // Distance from source
  | 'rarity'        // Item rarity
  | 'event';        // Special events

/**
 * Price modifier
 */
export interface PriceModifier {
  type: ModifierType;
  factor: number;     // Multiplier (1.0 = no change)
  expiry?: number;    // Game day when modifier expires
  reason?: string;    // Display reason
}

/**
 * Vendor specialization
 */
export type VendorType = 
  | 'general'       // Basic goods, food, cheap gear
  | 'smith'         // Weapons, armor, repairs
  | 'apothecary'    // Potions, reagents, herbs
  | 'enchanter'     // Magic items, scrolls
  | 'stable'        // Mounts, feed, wagons
  | 'trader'        // Cargo, luxury goods
  | 'blackmarket';  // Contraband, rare reagents

/**
 * Vendor definition
 */
export interface Vendor {
  id: string;
  name: string;
  type: VendorType;
  regionId: string;
  inventory: Stack[];      // Available items
  buyback: Stack[];        // Recently sold items
  restockDay: number;      // Next restock date
  reputation: number;      // Player reputation modifier
  tags?: string[];         // Special features
}

/**
 * Regional market state
 */
export interface Market {
  regionId: string;
  tier: MarketTier;
  stock: Record<string, number>;        // Item availability
  modifiers: PriceModifier[];           // Active price modifiers
  vendors: Vendor[];                    // Available vendors
  lastUpdate: number;                   // Game day
}

// ============================================================================
// UPKEEP & WAGES
// ============================================================================

/**
 * Daily upkeep costs
 */
export interface Upkeep {
  wages: number;          // Party member wages
  food: number;           // Food consumption
  mounts: number;         // Stabling and feed
  wagons: number;         // Vehicle maintenance
  total: number;          // Total daily cost
}

/**
 * Wage debt when treasury is insufficient
 */
export interface WageDebt {
  amount: number;
  days: number;           // Days overdue
  moralePenalty: number;  // Current morale hit
}

// ============================================================================
// TRADE ROUTES
// ============================================================================

/**
 * Trade route evaluation
 */
export interface RouteEval {
  origin: string;
  destination: string;
  distance: number;         // Hex distance
  travelDays: number;       // Estimated travel time
  buyValue: number;         // Total purchase cost
  sellValue: number;        // Total sale revenue
  travelCost: number;       // Food, repairs, wages
  riskPremium: number;      // Insurance cost for danger
  profit: number;           // Net profit
  profitPerDay: number;     // Profit efficiency
  dangerLevel: number;      // 0-1 ambush risk
  recommended: boolean;     // Profitable route
}

/**
 * Cargo contract for convoy missions
 */
export interface CargoContract {
  id: string;
  origin: string;
  destination: string;
  cargo: Stack[];
  payment: number;
  bonus: number;            // Bonus for fast/safe delivery
  deadline: number;         // Game day deadline
  insurance: number;        // Partial refund on loss
  dangerLevel: number;
  accepted: boolean;
  completed: boolean;
}

// ============================================================================
// REAGENTS & CRAFTING
// ============================================================================

/**
 * Reagent categories
 */
export type ReagentCategory = 
  | 'botanical'   // Herbs, flowers, seeds
  | 'mineral'     // Ores, gems, crystals
  | 'arcane'      // Magical essences
  | 'creature';   // Animal parts, monster drops

/**
 * Harvest node in the world
 */
export interface HarvestNode {
  id: string;
  regionId: string;
  position: { q: number; r: number };
  category: ReagentCategory;
  yields: string[];         // Possible item IDs
  respawnDays: number;      // Days until next harvest
  lastHarvest?: number;     // Game day of last harvest
  skill?: string;           // Required skill
  difficulty?: number;      // Skill check DC
}

/**
 * Crafting recipe
 */
export interface Recipe {
  id: string;
  name: string;
  result: string;           // Output item ID
  resultQty: number;
  ingredients: Stack[];     // Required items
  skill?: string;           // Required skill
  difficulty?: number;      // Skill check DC
  location?: string;        // Required facility (smith, lab, etc)
  duration: number;         // Days to craft
}

// ============================================================================
// EVENTS
// ============================================================================

/**
 * Economy event types
 */
export type EconomyEventType = 
  | 'econ/buy'
  | 'econ/sell'
  | 'econ/repair'
  | 'econ/upkeep'
  | 'econ/stock'
  | 'econ/priceChange'
  | 'econ/convoyStart'
  | 'econ/convoyEnd'
  | 'econ/harvest'
  | 'econ/craft';

/**
 * Economy event payload
 */
export interface EconomyEvent {
  type: EconomyEventType;
  timestamp: number;        // Game day
  data: Record<string, unknown>;
}

// ============================================================================
// RUNTIME STATE
// ============================================================================

/**
 * Global economy state
 */
export interface EconomyState {
  day: number;                          // Current game day
  markets: Map<string, Market>;         // Region markets
  activeContracts: CargoContract[];     // Open contracts
  completedContracts: CargoContract[];  // Completed contracts
  harvestNodes: Map<string, HarvestNode>; // World harvest points
  wageDebt?: WageDebt;                  // Unpaid wages
  priceHistory: Map<string, number[]>;  // Price trends for charts
}
