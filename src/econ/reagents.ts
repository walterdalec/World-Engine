/**
 * Canvas 12 - Reagents & Crafting
 * 
 * Reagent harvesting, crafting recipes, and revival cost integration
 */

import type {
  ReagentCategory,
  HarvestNode,
  Recipe,
  Stack,
  MarketTier
} from './types';
import { SeededRandom } from '../proc/noise';

// ============================================================================
// REAGENT SYSTEM
// ============================================================================

/**
 * Reagent categories and their common sources
 */
export const REAGENT_SOURCES: Record<ReagentCategory, string[]> = {
  botanical: ['forest', 'swamp', 'plains', 'jungle'],
  mineral: ['mountain', 'desert', 'underground', 'volcano'],
  arcane: ['ruins', 'nexus', 'tower', 'leyline'],
  creature: ['dungeon', 'lair', 'battlefield', 'graveyard']
};

/**
 * Base respawn time by category (in days)
 */
const RESPAWN_TIMES: Record<ReagentCategory, number> = {
  botanical: 3,  // Fast regrowth
  mineral: 7,    // Moderate regeneration
  arcane: 14,    // Slow magical accumulation
  creature: 5    // Monster respawns
};

/**
 * Create harvest node
 */
export function createHarvestNode(
  id: string,
  regionId: string,
  position: { q: number; r: number },
  category: ReagentCategory,
  yields: string[],
  skill?: string,
  difficulty?: number
): HarvestNode {
  return {
    id,
    regionId,
    position,
    category,
    yields,
    respawnDays: RESPAWN_TIMES[category],
    skill,
    difficulty
  };
}

/**
 * Check if harvest node is ready
 */
export function isNodeReady(node: HarvestNode, currentDay: number): boolean {
  if (!node.lastHarvest) return true;
  
  const daysSinceHarvest = currentDay - node.lastHarvest;
  return daysSinceHarvest >= node.respawnDays;
}

/**
 * Harvest from node
 * Returns harvested items and updated node
 */
export function harvestNode(
  node: HarvestNode,
  currentDay: number,
  skillLevel: number = 0,
  seed: string
): {
  node: HarvestNode;
  harvested: Stack[];
  success: boolean;
} {
  if (!isNodeReady(node, currentDay)) {
    return {
      node,
      harvested: [],
      success: false
    };
  }
  
  // Skill check if required
  if (node.difficulty && node.skill) {
    const rng = new SeededRandom(`${seed}-${node.id}-${currentDay}`);
    const roll = rng.next() * 20; // d20
    const total = roll + skillLevel;
    
    if (total < node.difficulty) {
      // Failed harvest, but node is still consumed
      return {
        node: {
          ...node,
          lastHarvest: currentDay
        },
        harvested: [],
        success: false
      };
    }
  }
  
  // Successful harvest
  const rng = new SeededRandom(`${seed}-${node.id}-${currentDay}-loot`);
  const harvested: Stack[] = [];
  
  // Each yield has 60% chance to drop
  for (const itemId of node.yields) {
    if (rng.next() < 0.6) {
      const qty = 1 + Math.floor(rng.next() * 3); // 1-3 qty
      harvested.push({ itemId, qty });
    }
  }
  
  return {
    node: {
      ...node,
      lastHarvest: currentDay
    },
    harvested,
    success: true
  };
}

// ============================================================================
// CRAFTING RECIPES
// ============================================================================

/**
 * Common potion recipes
 */
export const POTION_RECIPES: Recipe[] = [
  {
    id: 'healing_potion',
    name: 'Healing Potion',
    result: 'potion_healing',
    resultQty: 1,
    ingredients: [
      { itemId: 'herb_heartbloom', qty: 2 },
      { itemId: 'reagent_spirit_salt', qty: 1 }
    ],
    difficulty: 10,
    duration: 1
  },
  {
    id: 'stamina_potion',
    name: 'Stamina Potion',
    result: 'potion_stamina',
    resultQty: 1,
    ingredients: [
      { itemId: 'herb_energy_root', qty: 2 },
      { itemId: 'mineral_iron_dust', qty: 1 }
    ],
    difficulty: 10,
    duration: 1
  },
  {
    id: 'antidote',
    name: 'Antidote',
    result: 'potion_antidote',
    resultQty: 1,
    ingredients: [
      { itemId: 'herb_purifying_moss', qty: 3 },
      { itemId: 'reagent_clean_water', qty: 1 }
    ],
    difficulty: 12,
    duration: 1
  }
];

/**
 * Field kit recipes
 */
export const KIT_RECIPES: Recipe[] = [
  {
    id: 'field_repair_kit',
    name: 'Field Repair Kit',
    result: 'kit_field_repair',
    resultQty: 1,
    ingredients: [
      { itemId: 'mineral_iron_ore', qty: 2 },
      { itemId: 'material_leather_scraps', qty: 3 },
      { itemId: 'tool_hammer', qty: 1 }
    ],
    difficulty: 15,
    location: 'workshop',
    duration: 2
  },
  {
    id: 'medical_kit',
    name: 'Medical Kit',
    result: 'kit_medical',
    resultQty: 1,
    ingredients: [
      { itemId: 'herb_healing', qty: 5 },
      { itemId: 'material_bandages', qty: 10 },
      { itemId: 'reagent_alcohol', qty: 1 }
    ],
    difficulty: 12,
    duration: 1
  }
];

/**
 * Check if recipe can be crafted
 */
export function canCraftRecipe(
  recipe: Recipe,
  inventory: Stack[],
  skillLevel: number = 0
): {
  canCraft: boolean;
  missingIngredients: Stack[];
  skillCheck: boolean;
} {
  // Check skill requirement
  const skillCheck = !recipe.difficulty || skillLevel >= recipe.difficulty;
  
  // Check ingredients
  const missingIngredients: Stack[] = [];
  
  for (const required of recipe.ingredients) {
    const available = inventory.find(s => s.itemId === required.itemId)?.qty ?? 0;
    if (available < required.qty) {
      missingIngredients.push({
        itemId: required.itemId,
        qty: required.qty - available
      });
    }
  }
  
  return {
    canCraft: skillCheck && missingIngredients.length === 0,
    missingIngredients,
    skillCheck
  };
}

/**
 * Craft item from recipe
 * Returns result and consumed ingredients
 */
export function craftItem(
  recipe: Recipe,
  seed: string
): {
  result: Stack;
  consumed: Stack[];
  success: boolean;
} {
  // Skill check for variable quality
  const rng = new SeededRandom(`${seed}-${recipe.id}`);
  const roll = rng.next() * 20;
  
  let resultQty = recipe.resultQty;
  
  // Critical success (natural 20): +1 qty
  if (roll >= 19) {
    resultQty += 1;
  }
  // Critical failure (natural 1): lose half materials, no result
  else if (roll <= 1) {
    return {
      result: { itemId: recipe.result, qty: 0 },
      consumed: recipe.ingredients.map(ing => ({
        ...ing,
        qty: Math.ceil(ing.qty / 2)
      })),
      success: false
    };
  }
  
  return {
    result: { itemId: recipe.result, qty: resultQty },
    consumed: recipe.ingredients,
    success: true
  };
}

// ============================================================================
// REVIVAL COST INTEGRATION (Canvas 11)
// ============================================================================

/**
 * Calculate dynamic revival cost based on market conditions
 */
export function calculateRevivalCost(
  baseCost: number,
  reagentIds: string[],
  market: MarketTier,
  modifiers: number = 1.0
): {
  totalCost: number;
  breakdown: Array<{ itemId: string; cost: number }>;
} {
  const breakdown: Array<{ itemId: string; cost: number }> = [];
  
  // Base ritual cost
  let totalCost = baseCost;
  
  // Add reagent costs
  for (const reagentId of reagentIds) {
    // Simplified - would use actual market prices from pricing.ts
    const tierMultiplier = [1.2, 1.0, 0.9, 0.85][market - 1] ?? 1.0;
    const reagentCost = Math.ceil(50 * tierMultiplier * modifiers);
    
    breakdown.push({ itemId: reagentId, cost: reagentCost });
    totalCost += reagentCost;
  }
  
  return {
    totalCost: Math.ceil(totalCost),
    breakdown
  };
}

/**
 * Check if player can afford revival
 */
export function canAffordRevival(
  gold: number,
  reagentCost: number
): boolean {
  return gold >= reagentCost;
}

// ============================================================================
// REAGENT MARKET DYNAMICS
// ============================================================================

/**
 * Calculate reagent scarcity modifier after major events
 * (e.g., big battles increase demand for revival reagents)
 */
export function calculateReagentScarcity(
  recentDeaths: number,
  _baseStock: number
): number {
  // Each death increases demand, reducing stock
  const demandSpike = recentDeaths * 0.1; // 10% per death
  return Math.max(0.2, 1.0 - demandSpike); // Minimum 20% stock
}

/**
 * Apply scarcity to reagent prices
 */
export function applyReagentScarcity(
  basePrice: number,
  scarcity: number
): number {
  // Low scarcity = high prices
  const scarcityMultiplier = 1.0 / Math.max(0.2, scarcity);
  return Math.ceil(basePrice * scarcityMultiplier);
}

// ============================================================================
// HARVEST NODE GENERATION
// ============================================================================

/**
 * Generate harvest nodes for a region
 */
export function generateHarvestNodes(
  regionId: string,
  biome: string,
  size: number,
  seed: string
): HarvestNode[] {
  const rng = new SeededRandom(`${seed}-${regionId}`);
  const nodes: HarvestNode[] = [];
  
  // Determine category from biome
  const categoryMap: Record<string, ReagentCategory> = {
    forest: 'botanical',
    swamp: 'botanical',
    plains: 'botanical',
    mountain: 'mineral',
    desert: 'mineral',
    underground: 'mineral',
    ruins: 'arcane',
    dungeon: 'creature'
  };
  
  const category = categoryMap[biome] ?? 'botanical';
  
  // Generate 1-3 nodes per region
  const nodeCount = 1 + Math.floor(rng.next() * 3);
  
  for (let i = 0; i < nodeCount; i++) {
    const q = Math.floor(rng.next() * size);
    const r = Math.floor(rng.next() * size);
    
    // Generate yields based on category
    const yields = [`reagent_${category}_${i}`, `reagent_common_${i}`];
    
    const node = createHarvestNode(
      `${regionId}-node-${i}`,
      regionId,
      { q, r },
      category,
      yields,
      'survival',
      10 + Math.floor(rng.next() * 10) // DC 10-20
    );
    
    nodes.push(node);
  }
  
  return nodes;
}

/**
 * Find harvest nodes near position
 */
export function findNearbyNodes(
  nodes: HarvestNode[],
  position: { q: number; r: number },
  radius: number
): HarvestNode[] {
  return nodes.filter(node => {
    const dq = node.position.q - position.q;
    const dr = node.position.r - position.r;
    const distance = Math.sqrt(dq * dq + dr * dr);
    return distance <= radius;
  });
}
